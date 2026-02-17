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

export const createSession = (user, ttlMs) => {
  pruneExpiredSessions();
  const sessionId = randomUUID();
  const expiresAt = Date.now() + ttlMs;
  const siteIds = Array.isArray(user.siteIds)
    ? Array.from(
        new Set(
          user.siteIds
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0)
            .map((value) => Math.trunc(value))
        )
      )
    : [];
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
