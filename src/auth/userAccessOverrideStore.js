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

let overrideCache = null;

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

const ensureLoaded = () => {
  if (Array.isArray(overrideCache)) return;
  try {
    mkdirSync(overrideDataDir, { recursive: true });
    if (!existsSync(overrideFilePath)) {
      writeFileSync(overrideFilePath, "[]\n", "utf8");
    }
    const raw = readFileSync(overrideFilePath, "utf8");
    const parsed = JSON.parse(raw);
    overrideCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    overrideCache = [];
  }
};

const saveOverrides = () => {
  ensureLoaded();
  try {
    writeFileSync(overrideFilePath, `${JSON.stringify(overrideCache, null, 2)}\n`, "utf8");
  } catch {
    // ignore write errors
  }
};

const findOverrideIndex = ({ id = "", email = "" } = {}) => {
  ensureLoaded();
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

export const getUserAccessOverride = ({ id = "", email = "" } = {}) => {
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

export const upsertUserAccessOverride = ({
  id = "",
  email = "",
  role = "",
  siteIds = []
} = {}) => {
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
  saveOverrides();
  return getUserAccessOverride({ id: idText, email: emailText });
};

export const applyUserAccessOverride = (user) => {
  if (!user || typeof user !== "object") return user;
  const userId = String(user.id ?? user.user_id ?? user.userId ?? "").trim();
  const userEmail = normalizeEmail(
    user.email ?? user.user_email ?? user.userEmail ?? user.username
  );
  const override = getUserAccessOverride({ id: userId, email: userEmail });
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

