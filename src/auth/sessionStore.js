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
  sessions.set(sessionId, {
    userId: user.id,
    email: user.email,
    name: user.name || user.email,
    role: user.role || "",
    upstreamToken: user.upstreamToken || "",
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
