import { createServer } from "http";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { validatePassword, verifyPassword } from "./auth/password.js";
import { createSession, deleteSession, getSession } from "./auth/sessionStore.js";
import { getUserByEmail, sanitizeUser } from "./auth/userStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "home");

const upstreamEnergyApi = "https://solarmdb.devonix.co.th/api/energy";
const upstreamSitesApi = "https://solarmdb.devonix.co.th/api/sites";
const upstreamDevicesApi = "https://solarmdb.devonix.co.th/api/devices";
const upstreamUsersApi = "https://solarmdb.devonix.co.th/api/users";
const upstreamAuthLoginApi = "https://solarmdb.devonix.co.th/api/auth/login";
const upstreamAuthLogoutApi = "https://solarmdb.devonix.co.th/api/auth/logout";
const upstreamAuthMeApi = "https://solarmdb.devonix.co.th/api/auth/me";

const sessionCookieName = "ppade_session";
const configuredSessionHours = Number(process.env.AUTH_SESSION_HOURS);
const sessionTtlMs =
  (Number.isFinite(configuredSessionHours) && configuredSessionHours > 0
    ? configuredSessionHours
    : 8) *
  60 *
  60 *
  1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const mime = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".pdf":
      return "application/pdf";
    default:
      return "text/plain; charset=utf-8";
  }
};

const isAuthApiPath = (pathname) => pathname.startsWith("/api/auth/");
const isProxyApiPath = (pathname) =>
  pathname === "/api/energy" ||
  pathname === "/api/sites" ||
  pathname.startsWith("/api/sites/") ||
  pathname === "/api/devices" ||
  pathname.startsWith("/api/devices/") ||
  pathname === "/api/users" ||
  pathname.startsWith("/api/users/");
const isApiPath = (pathname) => isAuthApiPath(pathname) || isProxyApiPath(pathname);
const isLoginPath = (pathname) =>
  pathname === "/login" || pathname === "/login/" || pathname === "/login/index.html";

const isPublicStaticPath = (pathname) =>
  pathname === "/login" || pathname === "/login/" || pathname.startsWith("/login/");

const parseCookies = (cookieHeader = "") =>
  cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf("=");
      if (index === -1) return acc;
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      if (!key) return acc;
      try {
        acc[key] = decodeURIComponent(value);
      } catch {
        acc[key] = value;
      }
      return acc;
    }, {});

const isSecureRequest = (req) => {
  const protoHeader = req.headers["x-forwarded-proto"];
  if (typeof protoHeader === "string") {
    return protoHeader.split(",")[0].trim() === "https";
  }
  return Boolean(req.socket?.encrypted);
};

const buildSessionCookie = (req, sessionId, maxAgeSeconds) => {
  const parts = [
    `${sessionCookieName}=${encodeURIComponent(sessionId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`
  ];
  if (isSecureRequest(req)) parts.push("Secure");
  return parts.join("; ");
};

const buildClearSessionCookie = (req) => {
  const parts = [
    `${sessionCookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0"
  ];
  if (isSecureRequest(req)) parts.push("Secure");
  return parts.join("; ");
};

const sendJson = (res, status, payload, headers = {}) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...headers,
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(body);
};

const sendApiError = (res, status, message, extraHeaders = {}) => {
  sendJson(
    res,
    status,
    {
      message
    },
    {
      ...corsHeaders,
      ...extraHeaders
    }
  );
};

const readBodyBuffer = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const readJsonBody = async (req) => {
  const buffer = await readBodyBuffer(req);
  if (!buffer.length) return {};
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch {
    const error = new Error("INVALID_JSON");
    error.code = "INVALID_JSON";
    throw error;
  }
};

const getSessionFromRequest = (req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const sessionId = cookies[sessionCookieName] || "";
  const session = getSession(sessionId);
  return { sessionId, session };
};

const requireApiSession = (req, res) => {
  const { session } = getSessionFromRequest(req);
  if (!session) {
    sendApiError(res, 401, "กรุณาเข้าสู่ระบบ", {
      "Set-Cookie": buildClearSessionCookie(req)
    });
    return null;
  }
  return session;
};

const sitesCacheFreshMs = 30 * 1000;
const sitesCacheStaleMs = 5 * 60 * 1000;
const sitesResponseCache = new Map();

const buildProxyRequestHeaders = (req, method, extraHeaders = {}) => {
  const headers = {
    Accept: req.headers.accept || "application/json"
  };
  if (req.headers["content-type"]) {
    headers["Content-Type"] = req.headers["content-type"];
  } else if (method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }
  Object.entries(extraHeaders || {}).forEach(([key, value]) => {
    if (typeof value === "string" && value) {
      headers[key] = value;
    }
  });
  return headers;
};

const proxyRequest = async (req, res, upstreamUrl, extraHeaders = {}, options = {}) => {
  const method = String(req.method || "GET").toUpperCase();
  const preparedBody = Buffer.isBuffer(options?.bodyBuffer) ? options.bodyBuffer : null;
  const transformResponseBody =
    typeof options?.transformResponseBody === "function" ? options.transformResponseBody : null;
  const requestBody =
    method === "GET" || method === "HEAD"
      ? null
      : preparedBody || (await readBodyBuffer(req));

  const headers = buildProxyRequestHeaders(req, method, extraHeaders);

  const upstreamRes = await fetch(upstreamUrl, {
    method,
    headers,
    body:
      method === "GET" || method === "HEAD" || !requestBody || !requestBody.length
        ? undefined
        : requestBody
  });

  const rawBody = await upstreamRes.text();
  const body = applyJsonBodyTransform(
    rawBody,
    upstreamRes.headers.get("content-type"),
    transformResponseBody
  );
  res.writeHead(upstreamRes.status, {
    ...corsHeaders,
    "Content-Type": upstreamRes.headers.get("content-type") || "application/json; charset=utf-8"
  });
  res.end(body);
};

const buildSitesCacheKey = (session, upstreamUrl) => {
  const identity = String(session?.userId || session?.email || "anonymous");
  const role = String(session?.role || "").trim().toLowerCase();
  const isSuperadminScope = session?.canViewAllSites === true || role === "superadmin";
  const scopedSiteIds = isSuperadminScope
    ? "all"
    : normalizeSiteIds(Array.isArray(session?.siteIds) ? session.siteIds : []).join(",");
  return `${identity}:${role}:${scopedSiteIds}:${upstreamUrl}`;
};

const sendCachedSitesResponse = (res, cached, cacheStatus) => {
  res.writeHead(200, {
    ...corsHeaders,
    "Content-Type": cached.contentType || "application/json; charset=utf-8",
    "X-Proxy-Cache": cacheStatus
  });
  res.end(cached.body || "[]");
};

const proxySitesGetWithCache = async (
  req,
  res,
  session,
  upstreamUrl,
  extraHeaders = {},
  options = {}
) => {
  const now = Date.now();
  const transformResponseBody =
    typeof options?.transformResponseBody === "function" ? options.transformResponseBody : null;
  const cacheKey = buildSitesCacheKey(session, upstreamUrl);
  const cached = sitesResponseCache.get(cacheKey) || null;

  if (cached && now - cached.cachedAt <= sitesCacheFreshMs) {
    sendCachedSitesResponse(res, cached, "HIT");
    return;
  }

  const headers = buildProxyRequestHeaders(req, "GET", extraHeaders);
  let upstreamRes = null;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: "GET",
      headers
    });
  } catch (error) {
    if (cached && now - cached.cachedAt <= sitesCacheStaleMs) {
      sendCachedSitesResponse(res, cached, "STALE");
      return;
    }
    throw error;
  }

  const rawBody = await upstreamRes.text();
  const contentType =
    upstreamRes.headers.get("content-type") || "application/json; charset=utf-8";
  const body = applyJsonBodyTransform(rawBody, contentType, transformResponseBody);
  if (upstreamRes.ok) {
    sitesResponseCache.set(cacheKey, {
      body,
      contentType,
      cachedAt: Date.now()
    });
    res.writeHead(200, {
      ...corsHeaders,
      "Content-Type": contentType,
      "X-Proxy-Cache": "MISS"
    });
    res.end(body);
    return;
  }

  if (upstreamRes.status === 429 && cached && now - cached.cachedAt <= sitesCacheStaleMs) {
    sendCachedSitesResponse(res, cached, "STALE");
    return;
  }

  res.writeHead(upstreamRes.status, {
    ...corsHeaders,
    "Content-Type": contentType
  });
  res.end(body);
};

const serviceAuthToken =
  String(process.env.UPSTREAM_AUTH_TOKEN || process.env.UPSTREAM_API_TOKEN || "").trim();

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const readPayloadMessage = (payload, fallbackMessage) => {
  if (!payload || typeof payload !== "object") return fallbackMessage;
  const message =
    payload.message ||
    payload.error ||
    payload.detail ||
    payload.error_message ||
    payload.errorMessage;
  if (typeof message === "string" && message.trim()) return message.trim();
  return fallbackMessage;
};

const parseJsonResponse = async (response) => {
  const text = await response.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const extractList = (payload, keys = ["data", "items", "rows", "list", "users", "result"]) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  for (const key of keys) {
    const nested = payload[key];
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) continue;
    for (const nestedKey of keys) {
      if (Array.isArray(nested[nestedKey])) return nested[nestedKey];
    }
  }
  return [];
};

const extractAuthToken = (payload) => {
  if (!payload || typeof payload !== "object") return "";
  const candidates = [
    payload.token,
    payload.access_token,
    payload.accessToken,
    payload.jwt,
    payload.id_token,
    payload.idToken,
    payload.session_token,
    payload.sessionToken,
    payload.data?.token,
    payload.data?.access_token,
    payload.data?.accessToken,
    payload.data?.jwt,
    payload.result?.token,
    payload.result?.access_token,
    payload.result?.accessToken
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return "";
};

const extractAuthUser = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  const candidates = [
    payload.user,
    payload.data?.user,
    payload.result?.user,
    payload.profile,
    payload.data?.profile,
    payload.me,
    payload.data
  ];
  return candidates.find((item) => item && typeof item === "object" && !Array.isArray(item)) || null;
};

const readUserField = (...values) => {
  for (const value of values) {
    if (typeof value === "string") {
      const text = value.trim();
      if (text) return text;
    }
  }
  return "";
};

const normalizeRole = (value) => readUserField(value).toLowerCase();
const allowedCreateRoles = new Set(["admin", "superadmin"]);

const toPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : null;
};

const normalizeSiteIds = (values) => {
  if (!Array.isArray(values)) return [];
  const dedup = new Set();
  values.forEach((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const nestedId = toPositiveInt(item.id ?? item.site_id ?? item.siteId);
      if (nestedId) dedup.add(nestedId);
      return;
    }
    const siteId = toPositiveInt(item);
    if (siteId) dedup.add(siteId);
  });
  return Array.from(dedup);
};

const parsePositiveIdsFromParamValues = (values) => {
  const rawParts = [];
  (Array.isArray(values) ? values : []).forEach((value) => {
    String(value || "")
      .split(",")
      .forEach((part) => {
        rawParts.push(part);
      });
  });
  return normalizeSiteIds(rawParts);
};

const collectSiteIdsFromSearchParams = (searchParams, keys = ["site_id", "siteId", "id"]) => {
  if (!searchParams) return [];
  const values = [];
  keys.forEach((key) => {
    values.push(...searchParams.getAll(key));
  });
  return parsePositiveIdsFromParamValues(values);
};

const collectSiteIdFromPathSuffix = (pathname, basePath) => {
  if (typeof pathname !== "string" || !pathname.startsWith(basePath)) return null;
  const suffix = pathname.slice(basePath.length).replace(/^\/+/, "");
  if (!suffix) return null;
  const firstSegment = suffix.split("/")[0] || "";
  if (!firstSegment || firstSegment === "search") return null;
  try {
    return toPositiveInt(decodeURIComponent(firstSegment));
  } catch {
    return toPositiveInt(firstSegment);
  }
};

const collectPathIdFromSuffix = (pathname, basePath) => {
  if (typeof pathname !== "string" || !pathname.startsWith(basePath)) return "";
  const suffix = pathname.slice(basePath.length).replace(/^\/+/, "");
  if (!suffix) return "";
  const firstSegment = suffix.split("/")[0] || "";
  if (!firstSegment || firstSegment === "search") return "";
  try {
    return decodeURIComponent(firstSegment).trim();
  } catch {
    return String(firstSegment).trim();
  }
};

const normalizeEntityId = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const readEntityIdFromSearchParams = (searchParams, keys = ["id"]) => {
  if (!searchParams) return "";
  for (const key of keys) {
    const values = searchParams.getAll(key);
    for (const value of values) {
      const normalized = normalizeEntityId(value);
      if (normalized) return normalized;
    }
  }
  return "";
};

const readEntityIdFromPayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  return normalizeEntityId(payload.id ?? payload.user_id ?? payload.userId);
};

const resolveUsersTargetId = (method, pathId, queryId, payloadId) => {
  const normalizedMethod = String(method || "GET").toUpperCase();
  if (normalizedMethod === "POST") return "";
  return (
    normalizeEntityId(pathId) || normalizeEntityId(queryId) || normalizeEntityId(payloadId) || ""
  );
};

const isSameEntityId = (left, right) => {
  const leftId = normalizeEntityId(left);
  const rightId = normalizeEntityId(right);
  if (!leftId || !rightId) return false;
  if (leftId === rightId) return true;

  const leftNumber = Number(leftId);
  const rightNumber = Number(rightId);
  return (
    Number.isFinite(leftNumber) &&
    Number.isFinite(rightNumber) &&
    Math.trunc(leftNumber) === Math.trunc(rightNumber)
  );
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const isSuperadminSession = (session) => {
  const role = normalizeRole(session?.role);
  return session?.canViewAllSites === true || role === "superadmin";
};

const isAdminSession = (session) => normalizeRole(session?.role) === "admin";

const shouldRestrictSitesBySession = (session) => {
  if (!isAdminSession(session) || isSuperadminSession(session)) return false;
  const scopedSiteIds = normalizeSiteIds(Array.isArray(session?.siteIds) ? session.siteIds : []);
  return scopedSiteIds.length > 0;
};

const getAllowedSiteIdSetFromSession = (session) =>
  new Set(normalizeSiteIds(Array.isArray(session?.siteIds) ? session.siteIds : []));

const isAllowedSiteIdForSet = (siteId, allowedSiteIdSet) => {
  const normalized = toPositiveInt(siteId);
  if (!normalized) return true;
  if (!(allowedSiteIdSet instanceof Set)) return true;
  return allowedSiteIdSet.has(normalized);
};

const extractSiteIdFromSiteRow = (row) => toPositiveInt(row?.id ?? row?.site_id ?? row?.siteId);
const extractSiteIdFromDeviceRow = (row) => toPositiveInt(row?.site_id ?? row?.siteId ?? row?.id);

const filterPayloadListByAllowedSites = (payload, allowedSiteIdSet, siteIdReader, keys = []) => {
  const filterRows = (rows) =>
    rows.filter((row) => {
      const siteId = siteIdReader(row);
      return isAllowedSiteIdForSet(siteId, allowedSiteIdSet);
    });

  if (Array.isArray(payload)) {
    return filterRows(payload);
  }
  if (!payload || typeof payload !== "object") return payload;

  const nextPayload = { ...payload };
  let changed = false;
  const allKeys = Array.from(
    new Set(["data", "items", "rows", "list", "result", "sites", "devices", ...keys])
  );

  for (const key of allKeys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      nextPayload[key] = filterRows(value);
      changed = true;
      continue;
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const nested = { ...value };
    let nestedChanged = false;
    for (const nestedKey of allKeys) {
      if (!Array.isArray(value[nestedKey])) continue;
      nested[nestedKey] = filterRows(value[nestedKey]);
      nestedChanged = true;
    }
    if (!nestedChanged) {
      const nestedDirectSiteId = siteIdReader(value);
      if (nestedDirectSiteId && !isAllowedSiteIdForSet(nestedDirectSiteId, allowedSiteIdSet)) {
        nextPayload[key] = {};
        changed = true;
      }
      continue;
    }
    if (nestedChanged) {
      nextPayload[key] = nested;
      changed = true;
    }
  }

  if (changed) return nextPayload;
  const directSiteId = siteIdReader(payload);
  if (directSiteId && !isAllowedSiteIdForSet(directSiteId, allowedSiteIdSet)) return {};
  return payload;
};

const applyJsonBodyTransform = (rawBody, contentType, transformFn) => {
  if (typeof transformFn !== "function") return rawBody;
  const type = String(contentType || "").toLowerCase();
  if (!type.includes("json")) return rawBody;

  const bodyText = typeof rawBody === "string" ? rawBody : String(rawBody || "");
  if (!bodyText.trim()) return bodyText;

  try {
    const parsed = JSON.parse(bodyText);
    const transformed = transformFn(parsed);
    if (transformed === undefined) return bodyText;
    return JSON.stringify(transformed);
  } catch {
    return bodyText;
  }
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

const normalizeCreateUserPayload = (payload, context = {}) => {
  const method = String(context.method || "POST").toUpperCase();
  const actorSession = context.session || null;
  const hasRoleField =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? ["role", "user_role", "userRole"].some((key) => hasOwn(payload, key))
      : false;
  const hasEmailField =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? [
          "email",
          "user_email",
          "userEmail",
          "username",
          "user_name",
          "userName"
        ].some((key) => hasOwn(payload, key))
      : false;
  const safePayload =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? { ...payload }
      : {};
  const requestedRole = normalizeRole(
    readUserField(safePayload.role, safePayload.user_role, safePayload.userRole)
  );
  const role = allowedCreateRoles.has(requestedRole) ? requestedRole : "";
  if (role) {
    safePayload.role = role;
  } else {
    delete safePayload.role;
    delete safePayload.user_role;
    delete safePayload.userRole;
  }

  const email = normalizeEmail(
    readUserField(
      safePayload.email,
      safePayload.user_email,
      safePayload.userEmail,
      safePayload.username,
      safePayload.user_name,
      safePayload.userName
    )
  );
  let emailError = "";
  if (method === "POST" && !email) {
    emailError = "กรุณากรอก Email";
  } else if (method !== "POST" && hasEmailField && !email) {
    emailError = "กรุณากรอก Email";
    delete safePayload.email;
    delete safePayload.user_email;
    delete safePayload.userEmail;
    delete safePayload.username;
    delete safePayload.user_name;
    delete safePayload.userName;
  }
  if ((method === "POST" || hasEmailField) && email) {
    safePayload.email = email;
    delete safePayload.user_email;
    delete safePayload.userEmail;
    safePayload.username = email;
    delete safePayload.user_name;
    delete safePayload.userName;
  }
  if ((method === "POST" || hasEmailField) && email && !email.includes("@")) {
    emailError = "กรุณากรอก Email ให้ถูกต้อง";
  }

  const siteIds = normalizeSiteIds([
    ...(Array.isArray(safePayload.siteIds) ? safePayload.siteIds : []),
    ...(Array.isArray(safePayload.site_ids) ? safePayload.site_ids : [])
  ]);

  if (role === "admin") {
    safePayload.siteIds = siteIds;
    safePayload.site_ids = siteIds;
  } else if (role === "superadmin") {
    delete safePayload.siteIds;
    delete safePayload.site_ids;
  }

  const hasPasswordField = ["password", "new_password", "newPassword"].some((key) =>
    hasOwn(safePayload, key)
  );
  const passwordCandidates = [
    safePayload.password,
    safePayload.new_password,
    safePayload.newPassword
  ];
  const passwordValue =
    passwordCandidates.find((value) => typeof value === "string") ?? "";
  delete safePayload.new_password;
  delete safePayload.newPassword;

  let passwordError = "";
  let isPasswordWriteRequested = false;
  if (method === "POST") {
    if (!passwordValue) {
      passwordError = "กรุณากรอกรหัสผ่าน";
      delete safePayload.password;
    } else {
      passwordError = validatePassword(passwordValue);
      if (passwordError) {
        delete safePayload.password;
      } else {
        safePayload.password = passwordValue;
        isPasswordWriteRequested = true;
      }
    }
  } else if (hasPasswordField) {
    if (!passwordValue) {
      delete safePayload.password;
    } else {
      passwordError = validatePassword(passwordValue);
      if (passwordError) {
        delete safePayload.password;
      } else {
        safePayload.password = passwordValue;
        isPasswordWriteRequested = true;
      }
    }
  }

  let passwordPermissionError = "";
  if (method !== "POST" && isPasswordWriteRequested) {
    const targetUserId = normalizeEntityId(context.targetUserId);
    const actorUserId = normalizeEntityId(actorSession?.userId ?? actorSession?.id);
    if (isSuperadminSession(actorSession)) {
      // superadmin can change password for any user.
    } else if (isAdminSession(actorSession)) {
      if (!targetUserId || !actorUserId || !isSameEntityId(targetUserId, actorUserId)) {
        passwordPermissionError = "admin สามารถเปลี่ยนรหัสผ่านได้เฉพาะบัญชีของตัวเอง";
      }
    } else {
      passwordPermissionError = "ไม่มีสิทธิ์เปลี่ยนรหัสผ่าน";
    }
  }

  let rolePermissionError = "";
  if (method === "POST" && role === "superadmin" && !isSuperadminSession(actorSession)) {
    rolePermissionError = "admin ไม่สามารถสร้างบัญชี superadmin ได้";
  }

  const isRoleAllowed = method === "POST" ? Boolean(role) : !hasRoleField || Boolean(role);

  return {
    payload: safePayload,
    role,
    email,
    siteIds,
    isRoleAllowed,
    rolePermissionError,
    emailError,
    passwordError,
    passwordPermissionError
  };
};

const normalizeUserFromApi = (user, fallbackEmail = "") => {
  if (!user || typeof user !== "object") return null;
  const email = normalizeEmail(
    readUserField(
      user.email,
      user.user_email,
      user.userEmail,
      user.username,
      user.user_name,
      user.userName,
      fallbackEmail
    )
  );
  if (!email) return null;
  const role = normalizeRole(readUserField(user.role, user.user_role, user.userRole));
  const siteIds = extractUserSiteIds(user);

  const normalized = {
    id: user.id ?? user.user_id ?? user.userId ?? email,
    email,
    name:
      readUserField(
        user.name,
        user.full_name,
        user.fullName,
        user.display_name,
        user.displayName,
        user.username
      ) || email,
    role,
    siteIds,
    canViewAllSites: role === "superadmin",
    isActive: Number(user.is_active ?? user.isActive ?? user.active ?? 1) !== 0
  };
  return normalized;
};

const mergeNormalizedUsers = (...users) => {
  const candidates = users.filter((user) => user && typeof user === "object");
  if (!candidates.length) return null;

  let id = "";
  let email = "";
  let name = "";
  let role = "";
  let isActive = true;
  let canViewAllSites = false;
  const collectedSiteIds = [];

  candidates.forEach((user) => {
    if (!id && user.id !== undefined && user.id !== null) {
      id = String(user.id).trim();
    }
    if (!email) {
      const candidateEmail = normalizeEmail(user.email);
      if (candidateEmail) email = candidateEmail;
    }
    if (!name) {
      const candidateName = readUserField(user.name);
      if (candidateName) name = candidateName;
    }
    if (!role) {
      const candidateRole = normalizeRole(user.role);
      if (candidateRole) role = candidateRole;
    }
    if (user.isActive === false) isActive = false;
    if (user.canViewAllSites === true) canViewAllSites = true;
    if (Array.isArray(user.siteIds)) collectedSiteIds.push(...user.siteIds);
  });

  if (!email) return null;
  const siteIds = normalizeSiteIds(collectedSiteIds);
  return {
    id: id || email,
    email,
    name: name || email,
    role,
    siteIds,
    canViewAllSites: canViewAllSites || role === "superadmin",
    isActive
  };
};

const buildAuthHeader = (token) => (token ? `Bearer ${token}` : "");

const splitCombinedSetCookieHeader = (rawValue) => {
  const text = String(rawValue || "").trim();
  if (!text) return [];
  const list = [];
  let start = 0;
  let inExpires = false;
  for (let i = 0; i < text.length; i += 1) {
    const next = text.slice(i, i + 8).toLowerCase();
    if (next === "expires=") {
      inExpires = true;
      continue;
    }
    const char = text[i];
    if (inExpires && char === ";") {
      inExpires = false;
      continue;
    }
    if (!inExpires && char === ",") {
      const part = text.slice(start, i).trim();
      if (part) list.push(part);
      start = i + 1;
    }
  }
  const tail = text.slice(start).trim();
  if (tail) list.push(tail);
  return list;
};

const extractCookieHeaderFromResponse = (response) => {
  if (!response?.headers) return "";
  let setCookieValues = [];
  if (typeof response.headers.getSetCookie === "function") {
    setCookieValues = response.headers.getSetCookie();
  } else {
    const fallback = response.headers.get("set-cookie");
    if (fallback) setCookieValues = splitCombinedSetCookieHeader(fallback);
  }
  if (!Array.isArray(setCookieValues) || !setCookieValues.length) return "";
  const pairs = setCookieValues
    .map((cookieValue) => String(cookieValue || "").split(";")[0]?.trim() || "")
    .filter(Boolean);
  return pairs.join("; ");
};

const resolveUpstreamAuthHeader = (req, session) => {
  if (typeof req.headers.authorization === "string" && req.headers.authorization.trim()) {
    return req.headers.authorization.trim();
  }
  if (session?.upstreamToken) {
    return buildAuthHeader(session.upstreamToken);
  }
  if (serviceAuthToken) {
    return buildAuthHeader(serviceAuthToken);
  }
  return "";
};

const resolveUpstreamCookieHeader = (req, session) => {
  const requestCookie =
    typeof req.headers["x-upstream-cookie"] === "string"
      ? req.headers["x-upstream-cookie"].trim()
      : "";
  if (requestCookie) return requestCookie;
  if (session?.upstreamCookie) return session.upstreamCookie;
  return "";
};

const fetchCurrentUserFromUpstream = async (token, cookieHeader = "") => {
  if (!token && !cookieHeader) return null;
  try {
    const headers = {
      Accept: "application/json"
    };
    if (token) headers.Authorization = buildAuthHeader(token);
    if (cookieHeader) headers.Cookie = cookieHeader;
    const response = await fetch(upstreamAuthMeApi, {
      method: "GET",
      headers
    });
    if (!response.ok) return null;
    const payload = await parseJsonResponse(response);
    const normalized = normalizeUserFromApi(extractAuthUser(payload) || payload);
    return normalized;
  } catch {
    return null;
  }
};

const fetchUserFromUsersApi = async (email, token, cookieHeader = "") => {
  const targetEmail = normalizeEmail(email);
  if (!targetEmail) return null;
  const sessionAuthHeader = buildAuthHeader(token);
  const serviceAuthHeader = buildAuthHeader(serviceAuthToken);
  const authHeaders = [];
  if (sessionAuthHeader) authHeaders.push(sessionAuthHeader);
  if (serviceAuthHeader && serviceAuthHeader !== sessionAuthHeader) {
    authHeaders.push(serviceAuthHeader);
  }
  if (!authHeaders.length && cookieHeader) {
    authHeaders.push("");
  }
  if (!authHeaders.length && !cookieHeader) return null;

  let bestMatch = null;

  for (const authHeader of authHeaders) {
    try {
      const headers = {
        Accept: "application/json"
      };
      if (authHeader) headers.Authorization = authHeader;
      if (cookieHeader) headers.Cookie = cookieHeader;
      const response = await fetch(upstreamUsersApi, {
        method: "GET",
        headers
      });
      if (!response.ok) continue;
      const payload = await parseJsonResponse(response);
      const users = extractList(payload).map((item) => normalizeUserFromApi(item)).filter(Boolean);
      const matched = users.find((user) => normalizeEmail(user.email) === targetEmail) || null;
      if (!matched) continue;

      if (!bestMatch) {
        bestMatch = matched;
      } else {
        const currentCount = Array.isArray(bestMatch.siteIds) ? bestMatch.siteIds.length : 0;
        const nextCount = Array.isArray(matched.siteIds) ? matched.siteIds.length : 0;
        if (nextCount > currentCount) bestMatch = matched;
      }

      if (Array.isArray(bestMatch.siteIds) && bestMatch.siteIds.length > 0) break;
    } catch {
      // try next auth candidate
    }
  }

  return bestMatch;
};

const tryUpstreamLogin = async (email, password) => {
  const response = await fetch(upstreamAuthLoginApi, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const payload = await parseJsonResponse(response);
  const upstreamCookie = extractCookieHeaderFromResponse(response);
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: readPayloadMessage(payload, "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
    };
  }

  const token = extractAuthToken(payload);
  const payloadUser = normalizeUserFromApi(extractAuthUser(payload), email);
  const payloadRootUser = normalizeUserFromApi(payload, email);
  const meUser = await fetchCurrentUserFromUpstream(token, upstreamCookie);
  const usersApiUser = await fetchUserFromUsersApi(email, token, upstreamCookie);
  const normalizedUser = mergeNormalizedUsers(
    usersApiUser,
    meUser,
    payloadUser,
    payloadRootUser
  ) || {
    id: email,
    email: normalizeEmail(email),
    name: email,
    role: "",
    siteIds: [],
    canViewAllSites: false
  };
  if (!normalizedUser?.isActive) {
    return {
      ok: false,
      status: 403,
      message: "ผู้ใช้นี้ถูกปิดการใช้งาน"
    };
  }

  return {
    ok: true,
    status: response.status,
    token,
    upstreamCookie,
    user: normalizedUser
  };
};

const handleAuthApi = async (req, res, url) => {
  const method = String(req.method || "GET").toUpperCase();

  if (url.pathname === "/api/auth/login") {
    if (method !== "POST") {
      sendApiError(res, 405, "Method Not Allowed");
      return;
    }

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch (error) {
      if (error.code === "INVALID_JSON") {
        sendApiError(res, 400, "รูปแบบ JSON ไม่ถูกต้อง");
        return;
      }
      throw error;
    }

    const email = normalizeEmail(readUserField(payload.email, payload.username));
    const password = String(payload.password || "");
    if (!email || !password) {
      sendApiError(res, 400, "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      const upstreamLogin = await tryUpstreamLogin(email, password);
      if (!upstreamLogin.ok) {
        sendApiError(res, upstreamLogin.status || 401, upstreamLogin.message);
        return;
      }
      const { sessionId, expiresAt } = createSession(
        {
          ...upstreamLogin.user,
          upstreamToken: upstreamLogin.token,
          upstreamCookie: upstreamLogin.upstreamCookie
        },
        sessionTtlMs
      );
      sendJson(
        res,
        200,
        {
          user: {
            id: upstreamLogin.user.id,
            email: upstreamLogin.user.email,
            name: upstreamLogin.user.name,
            role: upstreamLogin.user.role,
            siteIds: Array.isArray(upstreamLogin.user.siteIds) ? upstreamLogin.user.siteIds : [],
            canViewAllSites: upstreamLogin.user.canViewAllSites === true
          },
          expiresAt: new Date(expiresAt).toISOString()
        },
        {
          ...corsHeaders,
          "Set-Cookie": buildSessionCookie(req, sessionId, sessionTtlMs / 1000)
        }
      );
      return;
    } catch (error) {
      console.warn("[AUTH] Upstream login failed, fallback to local user store", error);
    }

    const localUser = await getUserByEmail(email);
    if (!localUser || !verifyPassword(password, localUser.password)) {
      sendApiError(res, 401, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    const { sessionId, expiresAt } = createSession(sanitizeUser(localUser), sessionTtlMs);
    sendJson(
      res,
      200,
      {
        user: sanitizeUser(localUser),
        expiresAt: new Date(expiresAt).toISOString()
      },
      {
        ...corsHeaders,
        "Set-Cookie": buildSessionCookie(req, sessionId, sessionTtlMs / 1000)
      }
    );
    return;
  }

  if (url.pathname === "/api/auth/logout") {
    if (method !== "POST") {
      sendApiError(res, 405, "Method Not Allowed");
      return;
    }

    const { sessionId, session } = getSessionFromRequest(req);
    const authHeader = resolveUpstreamAuthHeader(req, session);
    const upstreamCookie = resolveUpstreamCookieHeader(req, session);
    if (authHeader || upstreamCookie) {
      const headers = {
        Accept: "application/json"
      };
      if (authHeader) headers.Authorization = authHeader;
      if (upstreamCookie) headers.Cookie = upstreamCookie;
      try {
        await fetch(upstreamAuthLogoutApi, {
          method: "POST",
          headers
        });
      } catch {
        // ignore upstream logout errors
      }
    }
    deleteSession(sessionId);
    sendJson(
      res,
      200,
      {
        message: "ออกจากระบบเรียบร้อย"
      },
      {
        ...corsHeaders,
        "Set-Cookie": buildClearSessionCookie(req)
      }
    );
    return;
  }

  if (url.pathname === "/api/auth/me") {
    if (method !== "GET") {
      sendApiError(res, 405, "Method Not Allowed");
      return;
    }

    const { session } = getSessionFromRequest(req);
    if (!session) {
      sendApiError(res, 401, "ยังไม่ได้เข้าสู่ระบบ", {
        "Set-Cookie": buildClearSessionCookie(req)
      });
      return;
    }

    sendJson(
      res,
      200,
      {
        user: {
          id: session.userId,
          email: session.email,
          name: session.name,
          role: session.role || "",
          siteIds: Array.isArray(session.siteIds) ? session.siteIds : [],
          canViewAllSites: session.canViewAllSites === true
        },
        expiresAt: new Date(session.expiresAt).toISOString()
      },
      corsHeaders
    );
    return;
  }

  sendApiError(res, 404, "ไม่พบ API นี้");
};

const resolveStaticPath = (pathname) => {
  if (pathname === "/") return "/index.html";
  if (pathname === "/login" || pathname === "/login/") return "/login/index.html";
  return pathname;
};

const resolveSafeRedirectPath = (rawRedirect) => {
  if (typeof rawRedirect !== "string" || !rawRedirect.trim()) return "/index.html";
  try {
    const trustedOrigin = "http://localhost";
    const targetUrl = new URL(rawRedirect, trustedOrigin);
    if (targetUrl.origin !== trustedOrigin) return "/index.html";
    if (isLoginPath(targetUrl.pathname)) return "/index.html";
    const targetPath = `${targetUrl.pathname}${targetUrl.search}`;
    return targetPath.startsWith("/") ? targetPath : "/index.html";
  } catch {
    return "/index.html";
  }
};

const buildLoginRedirectLocation = (url) => {
  const params = new URLSearchParams();
  params.set("redirect", `${url.pathname}${url.search}`);
  return `/login/index.html?${params.toString()}`;
};

const serveStaticFile = async (res, pathname) => {
  const relPath = resolveStaticPath(pathname);
  const safePath = path.posix.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.normalize(path.join(publicDir, safePath));
  const publicRoot = `${publicDir}${path.sep}`;

  if (filePath !== publicDir && !filePath.startsWith(publicRoot)) {
    throw new Error("FORBIDDEN_PATH");
  }

  const data = await readFile(filePath);
  const headers = {
    "Content-Type": mime(filePath)
  };
  const ext = path.extname(filePath).toLowerCase();
  if ([".html", ".css", ".js"].includes(ext)) {
    headers["Cache-Control"] = "no-store, max-age=0";
  }
  res.writeHead(200, headers);
  res.end(data);
};

export const handleRequest = async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const method = String(req.method || "GET").toUpperCase();

    if (method === "OPTIONS" && isApiPath(url.pathname)) {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    if (isAuthApiPath(url.pathname)) {
      await handleAuthApi(req, res, url);
      return;
    }

    if (isProxyApiPath(url.pathname)) {
      const session = requireApiSession(req, res);
      if (!session) return;
      const authHeader = resolveUpstreamAuthHeader(req, session);
      const upstreamCookie = resolveUpstreamCookieHeader(req, session);
      const restrictSites = shouldRestrictSitesBySession(session);
      const allowedSiteIdSet = restrictSites ? getAllowedSiteIdSetFromSession(session) : null;

      if (url.pathname === "/api/energy") {
        const requestedSiteIds = collectSiteIdsFromSearchParams(url.searchParams, [
          "site_id",
          "siteId"
        ]);
        if (
          restrictSites &&
          requestedSiteIds.some((siteId) => !isAllowedSiteIdForSet(siteId, allowedSiteIdSet))
        ) {
          sendApiError(res, 403, "ไม่มีสิทธิ์เข้าถึง Plant นี้");
          return;
        }
        const upstreamUrl = `${upstreamEnergyApi}${url.search}`;
        await proxyRequest(req, res, upstreamUrl, {
          Authorization: authHeader,
          Cookie: upstreamCookie
        });
        return;
      }

      if (url.pathname === "/api/sites" || url.pathname.startsWith("/api/sites/")) {
        const suffix = url.pathname.slice("/api/sites".length);
        const pathSiteId = collectSiteIdFromPathSuffix(url.pathname, "/api/sites");
        const querySiteIds = collectSiteIdsFromSearchParams(url.searchParams, [
          "site_id",
          "siteId",
          "id"
        ]);
        const requestedSiteIds = normalizeSiteIds([pathSiteId, ...querySiteIds]);
        if (
          restrictSites &&
          requestedSiteIds.some((siteId) => !isAllowedSiteIdForSet(siteId, allowedSiteIdSet))
        ) {
          sendApiError(res, 403, "ไม่มีสิทธิ์เข้าถึง Plant นี้");
          return;
        }
        const upstreamUrl = `${upstreamSitesApi}${suffix}${url.search}`;
        if (method === "GET") {
          const transformSitesPayload = restrictSites
            ? (payload) =>
                filterPayloadListByAllowedSites(
                  payload,
                  allowedSiteIdSet,
                  extractSiteIdFromSiteRow,
                  ["sites"]
                )
            : null;
          await proxySitesGetWithCache(req, res, session, upstreamUrl, {
            Authorization: authHeader,
            Cookie: upstreamCookie
          }, {
            transformResponseBody: transformSitesPayload
          });
          return;
        }
        await proxyRequest(req, res, upstreamUrl, {
          Authorization: authHeader,
          Cookie: upstreamCookie
        });
        return;
      }

      if (url.pathname === "/api/devices" || url.pathname.startsWith("/api/devices/")) {
        const suffix = url.pathname.slice("/api/devices".length);
        const requestedSiteIds = collectSiteIdsFromSearchParams(url.searchParams, [
          "site_id",
          "siteId"
        ]);
        if (
          restrictSites &&
          requestedSiteIds.some((siteId) => !isAllowedSiteIdForSet(siteId, allowedSiteIdSet))
        ) {
          sendApiError(res, 403, "ไม่มีสิทธิ์เข้าถึง Plant นี้");
          return;
        }
        const upstreamUrl = `${upstreamDevicesApi}${suffix}${url.search}`;
        const transformDevicesPayload =
          restrictSites && method === "GET"
            ? (payload) =>
                filterPayloadListByAllowedSites(
                  payload,
                  allowedSiteIdSet,
                  extractSiteIdFromDeviceRow,
                  ["devices"]
                )
            : null;
        await proxyRequest(
          req,
          res,
          upstreamUrl,
          {
            Authorization: authHeader,
            Cookie: upstreamCookie
          },
          {
            transformResponseBody: transformDevicesPayload
          }
        );
        return;
      }

      if (url.pathname === "/api/users" || url.pathname.startsWith("/api/users/")) {
        const suffix = url.pathname.slice("/api/users".length);
        const upstreamUrl = `${upstreamUsersApi}${suffix}${url.search}`;
        const shouldNormalizeUsersWritePayload = ["POST", "PUT", "PATCH"].includes(method);
        if (shouldNormalizeUsersWritePayload) {
          let payload = {};
          try {
            payload = await readJsonBody(req);
          } catch (error) {
            if (error.code === "INVALID_JSON") {
              sendApiError(res, 400, "รูปแบบ JSON ไม่ถูกต้อง");
              return;
            }
            throw error;
          }

          const pathUserId = collectPathIdFromSuffix(url.pathname, "/api/users");
          const queryUserId = readEntityIdFromSearchParams(url.searchParams, [
            "id",
            "user_id",
            "userId"
          ]);
          const payloadUserId = readEntityIdFromPayload(payload);
          const targetUserId = resolveUsersTargetId(method, pathUserId, queryUserId, payloadUserId);

          const normalizedUserWrite = normalizeCreateUserPayload(payload, {
            method,
            session,
            targetUserId
          });
          if (!normalizedUserWrite.isRoleAllowed) {
            const roleErrorMessage =
              method === "POST"
                ? "role ต้องเป็น admin หรือ superadmin เท่านั้น"
                : "role ต้องเป็น admin หรือ superadmin เมื่อมีการระบุค่า";
            sendApiError(res, 400, roleErrorMessage);
            return;
          }
          if (normalizedUserWrite.rolePermissionError) {
            sendApiError(res, 403, normalizedUserWrite.rolePermissionError);
            return;
          }
          if (normalizedUserWrite.emailError) {
            sendApiError(res, 400, normalizedUserWrite.emailError);
            return;
          }
          if (normalizedUserWrite.passwordError) {
            sendApiError(res, 400, normalizedUserWrite.passwordError);
            return;
          }
          if (normalizedUserWrite.passwordPermissionError) {
            sendApiError(res, 403, normalizedUserWrite.passwordPermissionError);
            return;
          }

          await proxyRequest(
            req,
            res,
            upstreamUrl,
            {
              Authorization: authHeader,
              Cookie: upstreamCookie,
              "Content-Type": "application/json; charset=utf-8"
            },
            {
              bodyBuffer: Buffer.from(JSON.stringify(normalizedUserWrite.payload))
            }
          );
          return;
        }
        await proxyRequest(req, res, upstreamUrl, {
          Authorization: authHeader,
          Cookie: upstreamCookie
        });
        return;
      }
    }

    if (url.pathname.startsWith("/api/")) {
      sendApiError(res, 404, "ไม่พบ API นี้");
      return;
    }

    const { session } = getSessionFromRequest(req);
    const isAuthenticated = Boolean(session);

    if (url.pathname === "/") {
      res.writeHead(302, {
        Location: isAuthenticated ? "/index.html" : "/login/index.html"
      });
      res.end();
      return;
    }

    if (!isAuthenticated && !isPublicStaticPath(url.pathname)) {
      res.writeHead(302, { Location: buildLoginRedirectLocation(url) });
      res.end();
      return;
    }

    if (isAuthenticated && isLoginPath(url.pathname)) {
      res.writeHead(302, {
        Location: resolveSafeRedirectPath(url.searchParams.get("redirect"))
      });
      res.end();
      return;
    }

    await serveStaticFile(res, url.pathname);
  } catch (error) {
    if (error?.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ไม่พบไฟล์ที่ร้องขอ");
      return;
    }

    console.error("[SERVER] Unhandled error", error);
    if (String(req.url || "").startsWith("/api/")) {
      sendApiError(res, 500, "เกิดข้อผิดพลาดภายในระบบ");
      return;
    }
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("เกิดข้อผิดพลาดภายในระบบ");
  }
};

export const createHttpServer = () => createServer((req, res) => void handleRequest(req, res));

const isMainModule = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();

if (isMainModule) {
  const port = process.env.PORT || 3000;
  createHttpServer().listen(port, () => {
    console.log(`PPAde พร้อมใช้งานที่ http://localhost:${port}`);
  });
}

export default handleRequest;
