import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configuredStateFilePath = String(process.env.BILLING_STATE_FILE_PATH || "").trim();
const isVercelRuntime = process.env.VERCEL === "1";
const defaultDataDir = isVercelRuntime ? "/tmp/ppade-data" : path.join(__dirname, "..", "data");
const stateDataDir = configuredStateFilePath
  ? path.dirname(configuredStateFilePath)
  : defaultDataDir;
const stateFilePath = configuredStateFilePath || path.join(stateDataDir, "billing-state.json");

let stateCache = null;

const isRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : null;
};

const normalizeSiteToken = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizeKeyPart = (value) =>
  normalizeSiteToken(value)
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

const safeJsonClone = (value, fallback) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
};

const toNonNegativeInt = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return Math.max(0, Math.trunc(Number(fallback) || 0));
  return Math.max(0, Math.trunc(parsed));
};

const normalizeSiteIdentity = (siteIdentity = {}) => {
  const siteId = toPositiveInt(siteIdentity.siteId ?? siteIdentity.site_id ?? siteIdentity.id);
  const siteCode = String(siteIdentity.siteCode ?? siteIdentity.site_code ?? "").trim();
  const siteName = String(siteIdentity.siteName ?? siteIdentity.name ?? "").trim();
  const key =
    siteId
      ? `id:${siteId}`
      : normalizeKeyPart(siteCode)
        ? `code:${normalizeKeyPart(siteCode)}`
        : normalizeKeyPart(siteName)
          ? `name:${normalizeKeyPart(siteName)}`
          : "default";
  return {
    siteId,
    siteCode,
    siteName,
    key
  };
};

const readStoreSiteIdentity = (entry = {}) => ({
  siteId: toPositiveInt(entry.siteId ?? entry.site_id ?? entry.id),
  siteCode: String(entry.siteCode ?? entry.site_code ?? "").trim(),
  siteName: String(entry.siteName ?? entry.site_name ?? entry.name ?? "").trim()
});

const findStoredKeyByIdentity = (identity = {}) => {
  ensureLoaded();
  const plants = isRecord(stateCache?.plants) ? stateCache.plants : {};
  const directKey = String(identity.key || "").trim().toLowerCase();
  const targetSiteId = toPositiveInt(identity.siteId);
  const targetSiteCode = normalizeSiteToken(identity.siteCode);
  const targetSiteName = normalizeSiteToken(identity.siteName);
  const entries = Object.entries(plants);
  let bestKey = "";
  let bestScore = -Infinity;
  entries.forEach(([key, value]) => {
    const keyToken = String(key || "").trim().toLowerCase();
    const storeIdentity = readStoreSiteIdentity(value);
    const storedSiteId = storeIdentity.siteId;
    const storedSiteCode = normalizeSiteToken(storeIdentity.siteCode);
    const storedSiteName = normalizeSiteToken(storeIdentity.siteName);
    const normalized = normalizeStoredEntry(value, storeIdentity, key);
    const hasSchedule = isRecord(normalized.schedule) && Object.keys(normalized.schedule).length > 0;
    const hasHistory = Array.isArray(normalized.history) && normalized.history.length > 0;
    const hasSequence = toNonNegativeInt(normalized.billSequence, 0) > 0;

    let identityScore = 0;
    if (directKey && keyToken === directKey) identityScore = Math.max(identityScore, 10);
    if (targetSiteId && storedSiteId && storedSiteId === targetSiteId) {
      identityScore = Math.max(identityScore, 9);
    }
    if (targetSiteCode && storedSiteCode && storedSiteCode === targetSiteCode) {
      identityScore = Math.max(identityScore, 8);
    }
    if (targetSiteName && storedSiteName && storedSiteName === targetSiteName) {
      identityScore = Math.max(identityScore, 7);
    }
    if (!identityScore) return;

    const richnessScore = (hasSchedule ? 3 : 0) + (hasHistory ? 2 : 0) + (hasSequence ? 1 : 0);
    const score = identityScore * 100 + richnessScore;
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  });
  return bestKey;
};

const normalizeStoredEntry = (entry, identity = {}, resolvedKey = "") => {
  const source = isRecord(entry) ? entry : {};
  const normalizedIdentity = normalizeSiteIdentity(identity);
  const sourceIdentity = readStoreSiteIdentity(source);
  const schedule = isRecord(source.schedule) ? safeJsonClone(source.schedule, {}) : {};
  const history = Array.isArray(source.history) ? safeJsonClone(source.history, []) : [];
  const billSequence = toNonNegativeInt(source.billSequence ?? source.sequence, 0);
  const updatedAt = String(source.updatedAt || "");
  return {
    key: String(resolvedKey || normalizedIdentity.key || "").trim(),
    siteId: normalizedIdentity.siteId ?? sourceIdentity.siteId ?? null,
    siteCode: normalizedIdentity.siteCode || sourceIdentity.siteCode || "",
    siteName: normalizedIdentity.siteName || sourceIdentity.siteName || "",
    schedule,
    history,
    billSequence,
    updatedAt
  };
};

const ensureLoaded = () => {
  if (isRecord(stateCache) && isRecord(stateCache.plants)) return;
  try {
    mkdirSync(stateDataDir, { recursive: true });
    if (!existsSync(stateFilePath)) {
      writeFileSync(stateFilePath, `${JSON.stringify({ plants: {} }, null, 2)}\n`, "utf8");
    }
    const raw = readFileSync(stateFilePath, "utf8");
    const parsed = JSON.parse(raw);
    if (isRecord(parsed) && isRecord(parsed.plants)) {
      stateCache = {
        plants: { ...parsed.plants }
      };
      return;
    }
  } catch {
    // fallback below
  }
  stateCache = { plants: {} };
};

const saveStore = () => {
  ensureLoaded();
  try {
    writeFileSync(stateFilePath, `${JSON.stringify(stateCache, null, 2)}\n`, "utf8");
  } catch {
    // ignore write errors
  }
};

export const readBillingState = (siteIdentity = {}) => {
  ensureLoaded();
  const identity = normalizeSiteIdentity(siteIdentity);
  const resolvedKey = findStoredKeyByIdentity(identity) || identity.key;
  const stored = stateCache.plants[resolvedKey];
  return normalizeStoredEntry(stored, identity, resolvedKey);
};

export const writeBillingState = (siteIdentity = {}, nextState = {}) => {
  ensureLoaded();
  const identity = normalizeSiteIdentity(siteIdentity);
  const resolvedKey = findStoredKeyByIdentity(identity) || identity.key;
  const current = normalizeStoredEntry(stateCache.plants[resolvedKey], identity, resolvedKey);
  const hasScheduleField = Object.prototype.hasOwnProperty.call(nextState || {}, "schedule");
  const hasHistoryField = Object.prototype.hasOwnProperty.call(nextState || {}, "history");
  const hasSequenceField =
    Object.prototype.hasOwnProperty.call(nextState || {}, "billSequence") ||
    Object.prototype.hasOwnProperty.call(nextState || {}, "sequence");

  const schedule = hasScheduleField
    ? isRecord(nextState?.schedule)
      ? safeJsonClone(nextState.schedule, {})
      : {}
    : current.schedule;
  const history = hasHistoryField
    ? Array.isArray(nextState?.history)
      ? safeJsonClone(nextState.history, [])
      : []
    : current.history;
  const billSequence = hasSequenceField
    ? toNonNegativeInt(nextState?.billSequence ?? nextState?.sequence, current.billSequence)
    : current.billSequence;

  const updated = {
    siteId: identity.siteId ?? current.siteId ?? null,
    siteCode: identity.siteCode || current.siteCode || "",
    siteName: identity.siteName || current.siteName || "",
    schedule,
    history,
    billSequence,
    updatedAt: new Date().toISOString()
  };
  stateCache.plants[resolvedKey] = updated;
  saveStore();
  return normalizeStoredEntry(updated, identity, resolvedKey);
};
