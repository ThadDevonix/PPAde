import { createHash, randomBytes } from "crypto";
import { createServer } from "http";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { sendResetPasswordEmail } from "./auth/mailer.js";
import { hashPassword, validatePassword, verifyPassword } from "./auth/password.js";
import { createSession, deleteSession, getSession } from "./auth/sessionStore.js";
import {
  getUserByEmail,
  getUserByResetTokenHash,
  sanitizeUser,
  setResetTokenForEmail,
  updatePasswordForUserId
} from "./auth/userStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "home");

const upstreamEnergyApi = "https://solarmdb.devonix.co.th/api/energy";
const upstreamSitesApi = "https://solarmdb.devonix.co.th/api/sites";
const upstreamDevicesApi = "https://solarmdb.devonix.co.th/api/devices";
const upstreamUsersApi = "https://solarmdb.devonix.co.th/api/users";
const upstreamAuthLoginApi = "https://solarmdb.devonix.co.th/api/auth/login";
const upstreamAuthLogoutApi = "https://solarmdb.devonix.co.th/api/auth/logout";
const upstreamAuthMeApi = "https://solarmdb.devonix.co.th/api/auth/me";
const upstreamAuthForgotPasswordApi = "https://solarmdb.devonix.co.th/api/auth/forgot-password";
const upstreamAuthResetPasswordApi = "https://solarmdb.devonix.co.th/api/auth/reset-password";

const sessionCookieName = "ppade_session";
const configuredSessionHours = Number(process.env.AUTH_SESSION_HOURS);
const configuredResetMinutes = Number(process.env.AUTH_RESET_MINUTES);
const sessionTtlMs =
  (Number.isFinite(configuredSessionHours) && configuredSessionHours > 0
    ? configuredSessionHours
    : 8) *
  60 *
  60 *
  1000;
const resetTokenTtlMs =
  (Number.isFinite(configuredResetMinutes) && configuredResetMinutes > 0
    ? configuredResetMinutes
    : 15) *
  60 *
  1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
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

const getRequestOrigin = (req) => {
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto =
    typeof protoHeader === "string"
      ? protoHeader.split(",")[0].trim()
      : req.socket?.encrypted
      ? "https"
      : "http";
  const host = req.headers.host || "localhost:3000";
  return `${proto}://${host}`;
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

const proxyRequest = async (req, res, upstreamUrl, extraHeaders = {}) => {
  const method = String(req.method || "GET").toUpperCase();
  const requestBody = method === "GET" || method === "HEAD" ? null : await readBodyBuffer(req);

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

  const upstreamRes = await fetch(upstreamUrl, {
    method,
    headers,
    body:
      method === "GET" || method === "HEAD" || !requestBody || !requestBody.length
        ? undefined
        : requestBody
  });

  const body = await upstreamRes.text();
  res.writeHead(upstreamRes.status, {
    ...corsHeaders,
    "Content-Type": upstreamRes.headers.get("content-type") || "application/json; charset=utf-8"
  });
  res.end(body);
};

const serviceAuthToken =
  String(process.env.UPSTREAM_AUTH_TOKEN || process.env.UPSTREAM_API_TOKEN || "").trim();

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

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

const normalizeUserFromApi = (user, fallbackEmail = "") => {
  if (!user || typeof user !== "object") return null;
  const email = normalizeEmail(readUserField(user.email, fallbackEmail));
  if (!email) return null;

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
    role: readUserField(user.role, user.user_role, user.userRole),
    isActive: Number(user.is_active ?? user.isActive ?? user.active ?? 1) !== 0
  };
  return normalized;
};

const buildAuthHeader = (token) => (token ? `Bearer ${token}` : "");

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

const fetchCurrentUserFromUpstream = async (token) => {
  if (!token) return null;
  try {
    const response = await fetch(upstreamAuthMeApi, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: buildAuthHeader(token)
      }
    });
    if (!response.ok) return null;
    const payload = await parseJsonResponse(response);
    const normalized = normalizeUserFromApi(extractAuthUser(payload) || payload);
    return normalized;
  } catch {
    return null;
  }
};

const fetchUserFromUsersApi = async (email, token) => {
  const targetEmail = normalizeEmail(email);
  if (!targetEmail) return null;
  const authHeader = token ? buildAuthHeader(token) : buildAuthHeader(serviceAuthToken);
  if (!authHeader) return null;
  try {
    const response = await fetch(upstreamUsersApi, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: authHeader
      }
    });
    if (!response.ok) return null;
    const payload = await parseJsonResponse(response);
    const users = extractList(payload).map((item) => normalizeUserFromApi(item)).filter(Boolean);
    return users.find((user) => user.email === targetEmail) || null;
  } catch {
    return null;
  }
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
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: readPayloadMessage(payload, "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
    };
  }

  const token = extractAuthToken(payload);
  const payloadUser = normalizeUserFromApi(extractAuthUser(payload), email);
  const meUser = await fetchCurrentUserFromUpstream(token);
  const usersApiUser = await fetchUserFromUsersApi(email, token);
  const normalizedUser =
    usersApiUser || meUser || payloadUser || { id: email, email: normalizeEmail(email), name: email, role: "" };
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

    const email = String(payload.email || "").trim().toLowerCase();
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
          upstreamToken: upstreamLogin.token
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
            role: upstreamLogin.user.role
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
    if (authHeader) {
      try {
        await fetch(upstreamAuthLogoutApi, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: authHeader
          }
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
          role: session.role || ""
        },
        expiresAt: new Date(session.expiresAt).toISOString()
      },
      corsHeaders
    );
    return;
  }

  if (url.pathname === "/api/auth/forgot-password") {
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

    const email = String(payload.email || "").trim().toLowerCase();
    const genericMessage =
      "หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้ทางอีเมล";

    if (email) {
      try {
        const upstreamResponse = await fetch(upstreamAuthForgotPasswordApi, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });
        const upstreamPayload = await parseJsonResponse(upstreamResponse);
        if (upstreamResponse.ok) {
          sendJson(
            res,
            200,
            {
              message: readPayloadMessage(upstreamPayload, genericMessage)
            },
            corsHeaders
          );
          return;
        }
      } catch {
        // fallback to local implementation
      }
    }

    if (email) {
      const user = await getUserByEmail(email);
      if (user) {
        const token = randomBytes(32).toString("hex");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + resetTokenTtlMs).toISOString();
        await setResetTokenForEmail(user.email, tokenHash, expiresAt);

        const resetUrl = `${getRequestOrigin(req)}/login/reset-password.html?token=${encodeURIComponent(token)}`;
        try {
          await sendResetPasswordEmail({
            to: user.email,
            name: user.name,
            resetUrl
          });
        } catch (error) {
          console.error("[AUTH] Failed to send reset password email", error);
        }
      }
    }

    sendJson(
      res,
      200,
      {
        message: genericMessage
      },
      corsHeaders
    );
    return;
  }

  if (url.pathname === "/api/auth/reset-password") {
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

    const token = String(payload.token || "").trim();
    const password = String(payload.password || "");

    if (!token) {
      sendApiError(res, 400, "ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      sendApiError(res, 400, passwordError);
      return;
    }

    try {
      const upstreamResponse = await fetch(upstreamAuthResetPasswordApi, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          password,
          new_password: password,
          newPassword: password
        })
      });
      const upstreamPayload = await parseJsonResponse(upstreamResponse);
      if (upstreamResponse.ok) {
        sendJson(
          res,
          200,
          {
            message: readPayloadMessage(upstreamPayload, "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว")
          },
          corsHeaders
        );
        return;
      }
    } catch {
      // fallback to local implementation
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = await getUserByResetTokenHash(tokenHash);
    const expiresAtMs = Date.parse(user?.resetToken?.expiresAt || "");
    const isExpired = !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now();

    if (!user || isExpired) {
      sendApiError(res, 400, "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว");
      return;
    }

    const nextPassword = hashPassword(password);
    await updatePasswordForUserId(user.id, nextPassword);

    sendJson(
      res,
      200,
      {
        message: "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว"
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

const serveStaticFile = async (res, pathname) => {
  const relPath = resolveStaticPath(pathname);
  const safePath = path.posix.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.normalize(path.join(publicDir, safePath));
  const publicRoot = `${publicDir}${path.sep}`;

  if (filePath !== publicDir && !filePath.startsWith(publicRoot)) {
    throw new Error("FORBIDDEN_PATH");
  }

  const data = await readFile(filePath);
  res.writeHead(200, { "Content-Type": mime(filePath) });
  res.end(data);
};

const server = createServer(async (req, res) => {
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

      if (url.pathname === "/api/energy") {
        const upstreamUrl = `${upstreamEnergyApi}${url.search}`;
        await proxyRequest(req, res, upstreamUrl);
        return;
      }

      if (url.pathname === "/api/sites" || url.pathname.startsWith("/api/sites/")) {
        const suffix = url.pathname.slice("/api/sites".length);
        const upstreamUrl = `${upstreamSitesApi}${suffix}${url.search}`;
        await proxyRequest(req, res, upstreamUrl);
        return;
      }

      if (url.pathname === "/api/devices" || url.pathname.startsWith("/api/devices/")) {
        const suffix = url.pathname.slice("/api/devices".length);
        const upstreamUrl = `${upstreamDevicesApi}${suffix}${url.search}`;
        await proxyRequest(req, res, upstreamUrl);
        return;
      }

      if (url.pathname === "/api/users" || url.pathname.startsWith("/api/users/")) {
        const suffix = url.pathname.slice("/api/users".length);
        const upstreamUrl = `${upstreamUsersApi}${suffix}${url.search}`;
        const authHeader = resolveUpstreamAuthHeader(req, session);
        await proxyRequest(req, res, upstreamUrl, {
          Authorization: authHeader
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
      res.writeHead(302, { Location: "/login/index.html" });
      res.end();
      return;
    }

    if (
      isAuthenticated &&
      (url.pathname === "/login" ||
        url.pathname === "/login/" ||
        url.pathname === "/login/index.html")
    ) {
      res.writeHead(302, { Location: "/index.html" });
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
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`PPAde พร้อมใช้งานที่ http://localhost:${port}`);
});
