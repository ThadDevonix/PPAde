import { randomUUID } from "crypto";

const sessions = new Map();

const pruneExpiredSessions = () => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (!session || session.expiresAt <= now) {
      sessions.delete(sessionId);
    }
  }
};

const pruneTimer = setInterval(pruneExpiredSessions, 15 * 60 * 1000);
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

export const createSession = (user, ttlMs) => {
  pruneExpiredSessions();
  const sessionId = randomUUID();
  const expiresAt = Date.now() + ttlMs;
  const siteIds = extractUserSiteIds(user);
  const role = String(user.role || "").trim().toLowerCase();
  const email = String(user.email || user.username || "").trim().toLowerCase();
  sessions.set(sessionId, {
    userId: user.id,
    email,
    name: user.name || email,
    role,
    siteIds,
    canViewAllSites: role === "superadmin" || user.canViewAllSites === true,
    upstreamToken: user.upstreamToken || "",
    upstreamCookie: user.upstreamCookie || "",
    expiresAt
  });
  return { sessionId, expiresAt };
};

export const getSession = (sessionId) => {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
};

export const deleteSession = (sessionId) => {
  if (!sessionId) return false;
  return sessions.delete(sessionId);
};
