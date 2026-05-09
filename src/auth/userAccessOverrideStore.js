import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configuredOverrideFilePath = String(
  process.env.AUTH_USER_ACCESS_OVERRIDES_FILE_PATH || ""
).trim();
const isVercelRuntime = process.env.VERCEL === "1";
const defaultDataDir = isVercelRuntime ? "/tmp/ppade-data" : path.join(__dirname, "..", "data");
const overrideDataDir = configuredOverrideFilePath
  ? path.dirname(configuredOverrideFilePath)
  : defaultDataDir;
const overrideFilePath =
  configuredOverrideFilePath || path.join(overrideDataDir, "user-access-overrides.json");
// Where the committed seed file lives (always inside the repo)
const seedFilePath = path.join(__dirname, "..", "data", "user-access-overrides.json");

// Vercel Blob is enabled when the standard env var is present.
const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const BLOB_PATHNAME = "user-access-overrides.json";

let overrideCache = null;
let cacheLoaded = false;
let blobModulePromise = null;

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
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
    if (Array.isArray(value)) {
      normalizeSiteIds(value).forEach((siteId) => dedup.add(siteId));
      return;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nestedSiteId = toPositiveInt(value.id ?? value.site_id ?? value.siteId);
      if (nestedSiteId) dedup.add(nestedSiteId);
      return;
    }
    const siteId = toPositiveInt(value);
    if (siteId) dedup.add(siteId);
  });
  return Array.from(dedup);
};

const loadBlobModule = async () => {
  if (!blobEnabled) return null;
  if (!blobModulePromise) {
    blobModulePromise = import("@vercel/blob").catch((err) => {
      console.error("[user-access] failed to load @vercel/blob:", err?.message || err);
      blobModulePromise = null;
      return null;
    });
  }
  return blobModulePromise;
};

const readBlobOverrides = async () => {
  const mod = await loadBlobModule();
  if (!mod) return null;
  try {
    const { blobs } = await mod.list({ prefix: BLOB_PATHNAME });
    const target = blobs?.find((b) => b.pathname === BLOB_PATHNAME);
    if (!target?.url) return null;
    const res = await fetch(target.url, { cache: "no-store" });
    if (!res.ok) return null;
    const parsed = await res.json().catch(() => null);
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    console.error("[user-access] Blob read failed:", err?.message || err);
    return null;
  }
};

const writeBlobOverrides = async (data) => {
  const mod = await loadBlobModule();
  if (!mod) return false;
  try {
    await mod.put(BLOB_PATHNAME, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
    return true;
  } catch (err) {
    console.error("[user-access] Blob write failed:", err?.message || err);
    return false;
  }
};

const readSeedOverrides = () => {
  try {
    if (!existsSync(seedFilePath)) return null;
    const raw = readFileSync(seedFilePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    console.warn("[user-access] seed read failed:", err?.message || err);
  }
  return null;
};

const readOverridesFromFile = () => {
  try {
    mkdirSync(overrideDataDir, { recursive: true });
    if (!existsSync(overrideFilePath)) {
      writeFileSync(overrideFilePath, "[]\n", "utf8");
    }
    const raw = readFileSync(overrideFilePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[user-access] file read failed:", err?.message || err);
    return [];
  }
};

const writeOverridesToFile = (data) => {
  try {
    mkdirSync(overrideDataDir, { recursive: true });
    writeFileSync(overrideFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    return true;
  } catch (err) {
    console.warn("[user-access] file write failed:", err?.message || err);
    return false;
  }
};

const ensureLoaded = async () => {
  if (cacheLoaded && Array.isArray(overrideCache)) return;

  // 1) Vercel Blob (production) — source of truth.
  if (blobEnabled) {
    const blobData = await readBlobOverrides();
    if (Array.isArray(blobData)) {
      overrideCache = blobData;
      cacheLoaded = true;
      return;
    }
    // Blob is empty — bootstrap from the committed seed file.
    const seed = readSeedOverrides();
    if (seed) {
      overrideCache = seed;
      cacheLoaded = true;
      const ok = await writeBlobOverrides(overrideCache);
      if (ok) {
        console.log("[user-access] bootstrapped Vercel Blob from src/data/user-access-overrides.json");
      }
      return;
    }
    overrideCache = [];
    cacheLoaded = true;
    return;
  }

  // 2) File path (local dev or no Blob token).
  overrideCache = readOverridesFromFile();
  cacheLoaded = true;
};

const persistOverrides = async () => {
  if (!Array.isArray(overrideCache)) return;
  const snapshot = JSON.parse(JSON.stringify(overrideCache));

  if (blobEnabled) {
    const ok = await writeBlobOverrides(snapshot);
    if (ok) return;
    // fall through to file as best-effort backup
  }
  writeOverridesToFile(snapshot);
};

const findOverrideIndex = ({ id = "", email = "" } = {}) => {
  const idText = String(id || "").trim();
  const normalizedEmail = normalizeEmail(email);
  if (!idText && !normalizedEmail) return -1;
  return overrideCache.findIndex((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const entryId = String(entry.id || "").trim();
    const entryEmail = normalizeEmail(entry.email);
    if (idText && entryId && entryId === idText) return true;
    if (normalizedEmail && entryEmail && entryEmail === normalizedEmail) return true;
    return false;
  });
};

export const getUserAccessOverride = async ({ id = "", email = "" } = {}) => {
  await ensureLoaded();
  const index = findOverrideIndex({ id, email });
  if (index < 0) return null;
  const item = overrideCache[index];
  if (!item || typeof item !== "object") return null;
  return {
    id: String(item.id || "").trim(),
    email: normalizeEmail(item.email),
    role: normalizeRole(item.role),
    siteIds: normalizeSiteIds(Array.isArray(item.siteIds) ? item.siteIds : []),
    updatedAt: String(item.updatedAt || "")
  };
};

export const upsertUserAccessOverride = async ({
  id = "",
  email = "",
  role = "",
  siteIds = []
} = {}) => {
  await ensureLoaded();
  const idText = String(id || "").trim();
  const emailText = normalizeEmail(email);
  if (!idText && !emailText) return null;

  const normalizedRole = normalizeRole(role);
  const normalizedSiteIds = normalizeSiteIds(siteIds);
  const nextItem = {
    id: idText,
    email: emailText,
    role: normalizedRole,
    siteIds: normalizedRole === "superadmin" ? [] : normalizedSiteIds,
    updatedAt: new Date().toISOString()
  };

  const index = findOverrideIndex({ id: idText, email: emailText });
  if (index >= 0) {
    const previous = overrideCache[index] && typeof overrideCache[index] === "object"
      ? overrideCache[index]
      : {};
    overrideCache[index] = {
      ...previous,
      ...nextItem,
      id: nextItem.id || String(previous.id || "").trim(),
      email: nextItem.email || normalizeEmail(previous.email)
    };
  } else {
    overrideCache.push(nextItem);
  }
  await persistOverrides();
  return getUserAccessOverride({ id: idText, email: emailText });
};

export const applyUserAccessOverride = async (user) => {
  if (!user || typeof user !== "object") return user;
  const userId = String(user.id ?? user.user_id ?? user.userId ?? "").trim();
  const userEmail = normalizeEmail(
    user.email ?? user.user_email ?? user.userEmail ?? user.username
  );
  const override = await getUserAccessOverride({ id: userId, email: userEmail });
  if (!override) return user;

  const role = override.role || normalizeRole(user.role);
  const canViewAllSites = role === "superadmin";
  const baseSiteIds = normalizeSiteIds(Array.isArray(user.siteIds) ? user.siteIds : []);
  const siteIds = canViewAllSites
    ? []
    : override.siteIds.length
      ? override.siteIds
      : baseSiteIds;

  return {
    ...user,
    role,
    siteIds,
    canViewAllSites
  };
};
