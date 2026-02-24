import { createHmac, timingSafeEqual } from "crypto";
import { applyUserAccessOverride } from "./userAccessOverrideStore.js";

const configuredSessionSecret = String(
  process.env.AUTH_SESSION_SECRET ||
    process.env.SESSION_SECRET ||
    process.env.UPSTREAM_AUTH_TOKEN ||
    process.env.UPSTREAM_API_TOKEN ||
    ""
).trim();
const sessionSecret = configuredSessionSecret || "ppade-dev-session-secret";
if (!configuredSessionSecret) {
  console.warn(
    "[AUTH] AUTH_SESSION_SECRET ยังไม่ถูกตั้งค่า กำลังใช้คีย์สำหรับ dev เท่านั้น"
  );
}

const revokedSessions = new Map();
const maxSessionTokenLength = 3800;

const pruneExpiredRevocations = () => {
  const now = Date.now();
  for (const [token, expiresAt] of revokedSessions.entries()) {
    if (!Number.isFinite(expiresAt) || expiresAt <= now) {
      revokedSessions.delete(token);
    }
  }
};

const pruneTimer = setInterval(pruneExpiredRevocations, 15 * 60 * 1000);
pruneTimer.unref();

const toPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : null;
};

const normalizeSiteIds = (values) => {
  if (!Array.isArray(values)) return [];
  const dedup = new Set();
  values.forEach((value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nestedId = toPositiveInt(value.id ?? value.site_id ?? value.siteId);
      if (nestedId) dedup.add(nestedId);
      return;
    }
    const siteId = toPositiveInt(value);
    if (siteId) dedup.add(siteId);
  });
  return Array.from(dedup);
};

const extractUserSiteIds = (user) => {
  if (!user || typeof user !== "object") return [];
  const rawValues = [];
  const collect = (candidate) => {
    if (Array.isArray(candidate)) {
      rawValues.push(...candidate);
      return;
    }
    if (candidate !== undefined && candidate !== null) {
      rawValues.push(candidate);
    }
  };

  collect(user.siteIds);
  collect(user.site_ids);
  collect(user.allowedSiteIds);
  collect(user.allowed_site_ids);
  collect(user.sites);
  collect(user.permissions?.siteIds);
  collect(user.permissions?.site_ids);
  collect(user.data?.siteIds);
  collect(user.data?.site_ids);

  return normalizeSiteIds(rawValues);
};

const encodeBase64UrlJson = (value) =>
  Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

const decodeBase64UrlJson = (value) => {
  if (typeof value !== "string" || !value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

const buildSignature = (value) => createHmac("sha256", sessionSecret).update(value).digest();

const verifySignature = (value, signatureBase64Url) => {
  if (typeof signatureBase64Url !== "string" || !signatureBase64Url) return false;
  let actualSignature;
  try {
    actualSignature = Buffer.from(signatureBase64Url, "base64url");
  } catch {
    return false;
  }
  const expectedSignature = buildSignature(value);
  if (actualSignature.length !== expectedSignature.length) return false;
  return timingSafeEqual(actualSignature, expectedSignature);
};

const signPayload = (payload) => {
  const header = {
    alg: "HS256",
    typ: "PPADE_SESSION",
    v: 1
  };
  const encodedHeader = encodeBase64UrlJson(header);
  const encodedPayload = encodeBase64UrlJson(payload);
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = buildSignature(message).toString("base64url");
  return `${message}.${signature}`;
};

const decodeAndVerifyTokenPayload = (token) => {
  if (typeof token !== "string" || !token) return null;
  if (token.length > maxSessionTokenLength) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  const header = decodeBase64UrlJson(encodedHeader);
  const payload = decodeBase64UrlJson(encodedPayload);
  if (!header || !payload) return null;
  if (header.alg !== "HS256") return null;
  const message = `${encodedHeader}.${encodedPayload}`;
  if (!verifySignature(message, signature)) return null;
  return payload;
};

const readText = (value) => (typeof value === "string" ? value.trim() : "");

const readExpiryMs = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed > 0 ? Math.trunc(parsed) : null;
};

const normalizeSession = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  const expiresAt = readExpiryMs(payload.exp ?? payload.expiresAt);
  if (!expiresAt || expiresAt <= Date.now()) return null;

  const role = String(payload.rl ?? payload.role ?? "").trim().toLowerCase();
  const email = String(payload.em ?? payload.email ?? payload.username ?? "")
    .trim()
    .toLowerCase();
  const name = readText(payload.nm ?? payload.name) || email;
  const siteIds = normalizeSiteIds(payload.sids ?? payload.siteIds ?? payload.site_ids);
  const canViewAllSites =
    payload.all === true || payload.canViewAllSites === true || role === "superadmin";
  const baseSession = {
    userId: payload.uid ?? payload.userId ?? payload.id ?? email,
    email,
    name,
    role,
    siteIds,
    canViewAllSites,
    upstreamToken: readText(payload.ut ?? payload.upstreamToken),
    upstreamCookie: readText(payload.uc ?? payload.upstreamCookie),
    expiresAt
  };
  const overridden = applyUserAccessOverride({
    id: baseSession.userId,
    email: baseSession.email,
    role: baseSession.role,
    siteIds: baseSession.siteIds,
    canViewAllSites: baseSession.canViewAllSites
  });
  const overriddenRole = String(overridden?.role || baseSession.role).trim().toLowerCase();
  const overriddenSiteIds = normalizeSiteIds(
    Array.isArray(overridden?.siteIds) ? overridden.siteIds : baseSession.siteIds
  );

  return {
    ...baseSession,
    role: overriddenRole,
    siteIds: overriddenSiteIds,
    canViewAllSites:
      overriddenRole === "superadmin" ||
      overridden?.canViewAllSites === true ||
      baseSession.canViewAllSites === true
  };
};

const normalizeTokenCandidate = (value, maxLength) => {
  const text = readText(value);
  if (!text) return "";
  if (!Number.isFinite(maxLength) || maxLength <= 0) return text;
  return text.length <= maxLength ? text : "";
};

const buildTokenWithSizeLimit = (basePayload) => {
  let payload = { ...basePayload };
  let token = signPayload(payload);

  if (token.length <= maxSessionTokenLength) return token;

  if (payload.uc) {
    payload = { ...payload, uc: "" };
    token = signPayload(payload);
  }
  if (token.length <= maxSessionTokenLength) return token;

  if (payload.ut) {
    payload = { ...payload, ut: "" };
    token = signPayload(payload);
  }
  if (token.length <= maxSessionTokenLength) return token;

  if (Array.isArray(payload.sids) && payload.sids.length > 64) {
    payload = { ...payload, sids: payload.sids.slice(0, 64) };
    token = signPayload(payload);
  }
  if (token.length <= maxSessionTokenLength) return token;

  const minimalPayload = {
    v: 1,
    exp: payload.exp,
    uid: payload.uid,
    em: payload.em,
    nm: payload.nm,
    rl: payload.rl,
    sids: Array.isArray(payload.sids) ? payload.sids.slice(0, 16) : [],
    all: payload.all === true
  };
  return signPayload(minimalPayload);
};

export const createSession = (user, ttlMs) => {
  pruneExpiredRevocations();
  const now = Date.now();
  const safeTtl = Number.isFinite(Number(ttlMs)) && Number(ttlMs) > 0 ? Number(ttlMs) : 0;
  const expiresAt = now + safeTtl;
  const role = String(user?.role || "").trim().toLowerCase();
  const email = String(user?.email || user?.username || "")
    .trim()
    .toLowerCase();
  const name = readText(user?.name) || email;
  const siteIds = extractUserSiteIds(user);
  const canViewAllSites = role === "superadmin" || user?.canViewAllSites === true;

  const payload = {
    v: 1,
    exp: expiresAt,
    uid: user?.id ?? email,
    em: email,
    nm: name,
    rl: role,
    sids: siteIds,
    all: canViewAllSites,
    ut: normalizeTokenCandidate(user?.upstreamToken, 2500),
    uc: normalizeTokenCandidate(user?.upstreamCookie, 1200)
  };

  const sessionId = buildTokenWithSizeLimit(payload);
  return { sessionId, expiresAt };
};

export const getSession = (sessionId) => {
  pruneExpiredRevocations();
  if (!sessionId) return null;

  const revokedExpiresAt = revokedSessions.get(sessionId);
  if (Number.isFinite(revokedExpiresAt)) {
    if (revokedExpiresAt > Date.now()) return null;
    revokedSessions.delete(sessionId);
  }

  const payload = decodeAndVerifyTokenPayload(sessionId);
  return normalizeSession(payload);
};

export const deleteSession = (sessionId) => {
  if (!sessionId) return false;
  const payload = decodeAndVerifyTokenPayload(sessionId);
  const expiresAt = readExpiryMs(payload?.exp ?? payload?.expiresAt) || Date.now() + 5 * 60 * 1000;
  revokedSessions.set(sessionId, expiresAt);
  return true;
};
