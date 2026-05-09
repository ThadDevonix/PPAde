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
// Where the committed seed file lives (always inside the repo)
const seedFilePath = path.join(__dirname, "..", "data", "billing-state.json");

// Vercel Blob is enabled when the standard env var is present.
const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const BLOB_PATHNAME = "billing-state.json";

let stateCache = null;
let cacheLoaded = false;
let blobModulePromise = null;

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

const loadBlobModule = async () => {
  if (!blobEnabled) return null;
  if (!blobModulePromise) {
    blobModulePromise = import("@vercel/blob").catch((err) => {
      console.error("[billing-state] failed to load @vercel/blob:", err?.message || err);
      blobModulePromise = null;
      return null;
    });
  }
  return blobModulePromise;
};

const readBlobState = async () => {
  const mod = await loadBlobModule();
  if (!mod) return null;
  try {
    const { blobs } = await mod.list({ prefix: BLOB_PATHNAME });
    const target = blobs?.find((b) => b.pathname === BLOB_PATHNAME);
    if (!target?.url) return null;
    const res = await fetch(target.url, { cache: "no-store" });
    if (!res.ok) return null;
    const parsed = await res.json().catch(() => null);
    if (isRecord(parsed) && isRecord(parsed.plants)) {
      return { plants: { ...parsed.plants } };
    }
  } catch (err) {
    console.error("[billing-state] Blob read failed:", err?.message || err);
  }
  return null;
};

const writeBlobState = async (state) => {
  const mod = await loadBlobModule();
  if (!mod) return false;
  try {
    await mod.put(BLOB_PATHNAME, JSON.stringify(state), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
    return true;
  } catch (err) {
    console.error("[billing-state] Blob write failed:", err?.message || err);
    return false;
  }
};

const readSeedState = () => {
  try {
    if (!existsSync(seedFilePath)) return null;
    const raw = readFileSync(seedFilePath, "utf8");
    const parsed = JSON.parse(raw);
    if (isRecord(parsed) && isRecord(parsed.plants) && Object.keys(parsed.plants).length > 0) {
      return { plants: { ...parsed.plants } };
    }
  } catch (err) {
    console.warn("[billing-state] seed read failed:", err?.message || err);
  }
  return null;
};

const readStateFromFile = () => {
  try {
    mkdirSync(stateDataDir, { recursive: true });
    if (!existsSync(stateFilePath)) {
      writeFileSync(stateFilePath, `${JSON.stringify({ plants: {} }, null, 2)}\n`, "utf8");
    }
    const raw = readFileSync(stateFilePath, "utf8");
    const parsed = JSON.parse(raw);
    if (isRecord(parsed) && isRecord(parsed.plants)) {
      return { plants: { ...parsed.plants } };
    }
  } catch (err) {
    console.warn("[billing-state] file read failed:", err?.message || err);
  }
  return null;
};

const writeStateToFile = (state) => {
  try {
    mkdirSync(stateDataDir, { recursive: true });
    writeFileSync(stateFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    return true;
  } catch (err) {
    console.warn("[billing-state] file write failed:", err?.message || err);
    return false;
  }
};

const ensureLoaded = async () => {
  if (cacheLoaded && isRecord(stateCache) && isRecord(stateCache.plants)) return;

  // 1) Vercel Blob (production).
  if (blobEnabled) {
    const blobState = await readBlobState();
    if (blobState) {
      stateCache = blobState;
      cacheLoaded = true;
      return;
    }
    // Blob is empty — bootstrap from the committed seed file.
    const seed = readSeedState();
    if (seed) {
      stateCache = seed;
      cacheLoaded = true;
      const ok = await writeBlobState(stateCache);
      if (ok) {
        console.log("[billing-state] bootstrapped Vercel Blob from src/data/billing-state.json");
      }
      return;
    }
    stateCache = { plants: {} };
    cacheLoaded = true;
    return;
  }

  // 2) File path (local dev or no Blob token).
  const fileState = readStateFromFile();
  if (fileState) {
    stateCache = fileState;
    cacheLoaded = true;
    return;
  }
  stateCache = { plants: {} };
  cacheLoaded = true;
};

const persistStore = async () => {
  if (!isRecord(stateCache)) return;
  const snapshot = safeJsonClone(stateCache, { plants: {} });

  if (blobEnabled) {
    const ok = await writeBlobState(snapshot);
    if (ok) return;
    // fall through to file as best-effort backup
  }
  writeStateToFile(snapshot);
};

export const readBillingState = async (siteIdentity = {}) => {
  await ensureLoaded();
  const identity = normalizeSiteIdentity(siteIdentity);
  const resolvedKey = findStoredKeyByIdentity(identity) || identity.key;
  const stored = stateCache.plants[resolvedKey];
  return normalizeStoredEntry(stored, identity, resolvedKey);
};

export const writeBillingState = async (siteIdentity = {}, nextState = {}) => {
  await ensureLoaded();
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
  await persistStore();
  return normalizeStoredEntry(updated, identity, resolvedKey);
};
