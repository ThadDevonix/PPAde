const defaultPlants = [];

const plantsStorageKey = "plantsDataV2";
const legacyPlantsStorageKey = "plantsDataV1";
const legacySeedPlantNames = new Set([
  "โฟนิคส์ สํานักงานใหญ่ 10kW",
  "โรงเรียนศรีษาบุตรสกุล 80kW อาคารหอประชุม",
  "Narai Hill Golf Resort Country Club 50 kW",
  "บริษัทศรีน้องพาณิชย์ จ.กระบี่",
  "PEA โรงเรียนชาติเชียรแม่ป่าไผ่ 5kW+op+batt",
  "PEA โรงเรียนพิจองซิง จ.แม่ฮาย 5kW+op+batt",
  "PEA โรงเรียนเข้นหัวเวียง 5kW+op+batt"
]);
const sitesApiBase = "/api/sites";
const devicesApiBase = "/api/devices";
const sitesRetryMaxAttempts = 3;
const sitesRetryBaseDelayMs = 700;
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `plant-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
const normalizePlants = (list) =>
  list.map((plant) => (plant.id ? plant : { ...plant, id: generateId() }));
const loadPlants = () => {
  try {
    const savedV2 = localStorage.getItem(plantsStorageKey);
    if (savedV2) {
      const parsedV2 = JSON.parse(savedV2);
      if (Array.isArray(parsedV2)) return parsedV2;
    }
    const savedV1 = localStorage.getItem(legacyPlantsStorageKey);
    if (savedV1) {
      const parsedV1 = JSON.parse(savedV1);
      if (Array.isArray(parsedV1)) {
        return parsedV1.filter((plant) => {
          const name = typeof plant?.name === "string" ? plant.name.trim() : "";
          return name && !legacySeedPlantNames.has(name);
        });
      }
    }
  } catch {
    // ignore parse errors
  }
  return [...defaultPlants];
};
const savePlants = () => {
  localStorage.setItem(plantsStorageKey, JSON.stringify(plants));
};
const readString = (...values) => {
  for (const value of values) {
    if (typeof value === "string") {
      const text = value.trim();
      if (text) return text;
    }
  }
  return "";
};
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const normalizeRole = (value) => readString(value).toLowerCase();
const normalizeEmail = (value) => readString(value).toLowerCase();
const normalizePlantNameKey = (value) => value.trim().toLowerCase();
const normalizeLocationValue = (value) => readString(value) || "Thailand";
const normalizeSiteCodeKey = (value) =>
  String(value || "").trim().toLowerCase();
const normalizeSiteStatus = (value) => {
  if (typeof value === "boolean") return value ? "online" : "offline";
  if (typeof value === "number") return value > 0 ? "online" : "offline";
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return "online";
  if (["0", "false", "off", "offline", "down", "error"].includes(text)) {
    return "offline";
  }
  return "online";
};
const normalizeMeterToken = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
const parseLoosePositiveId = (value) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return Math.trunc(numeric);
  if (typeof value !== "string") return null;
  const match = value.match(/(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
};
const normalizeSiteIds = (values) => {
  if (!Array.isArray(values)) return [];
  const dedup = new Set();
  const collect = (value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => collect(item));
      return;
    }
    if (value && typeof value === "object") {
      const siteId = parseLoosePositiveId(value.id ?? value.site_id ?? value.siteId);
      if (siteId) dedup.add(siteId);
      collect(value.siteIds);
      collect(value.site_ids);
      collect(value.allowedSiteIds);
      collect(value.allowed_site_ids);
      return;
    }
    if (typeof value === "string" && value.includes(",")) {
      value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => collect(part));
      return;
    }
    const siteId = parseLoosePositiveId(value);
    if (siteId) dedup.add(siteId);
  };

  values.forEach((value) => collect(value));
  return Array.from(dedup);
};
const extractUserSiteIds = (user) =>
  normalizeSiteIds([
    user?.siteIds,
    user?.site_ids,
    user?.allowedSiteIds,
    user?.allowed_site_ids,
    user?.sites,
    user?.permissions?.siteIds,
    user?.permissions?.site_ids,
    user?.permissions?.allowedSiteIds,
    user?.permissions?.allowed_site_ids,
    user?.data?.siteIds,
    user?.data?.site_ids,
    user?.data?.allowedSiteIds,
    user?.data?.allowed_site_ids
  ]);
const extractRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const keys = ["data", "items", "rows", "list", "result", "users"];
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
const resolveUserSiteIds = async (user) => {
  const base = extractUserSiteIds(user);
  if (base.length || normalizeRole(user?.role) === "superadmin") return base;

  const email = normalizeEmail(user?.email ?? user?.user_email ?? user?.username);
  if (!email) return base;
  try {
    const response = await fetch("/api/users", {
      method: "GET",
      credentials: "same-origin"
    });
    if (!response.ok) return base;
    const payload = await response.json().catch(() => ({}));
    const rows = extractRows(payload);
    const matched = rows.find((row) => {
      const rowEmail = normalizeEmail(
        row?.email ?? row?.user_email ?? row?.userEmail ?? row?.username
      );
      return rowEmail && rowEmail === email;
    });
    if (!matched) return base;
    const resolved = extractUserSiteIds(matched);
    return resolved.length ? resolved : base;
  } catch {
    return base;
  }
};
const getPlantSiteIdNumber = (plant) =>
  parseLoosePositiveId(plant?.apiId ?? plant?.siteId ?? plant?.site_id ?? plant?.id);
const getMeterIdentityKeyForCount = (meter, fallbackIndex) => {
  const meterIdCandidates = [meter?.apiId, meter?.device_id, meter?.deviceId, meter?.id];
  for (const candidate of meterIdCandidates) {
    const id = parseLoosePositiveId(candidate);
    if (Number.isFinite(id) && id > 0) return `id:${id}`;
  }
  const siteToken = normalizeMeterToken(
    meter?.siteCode ?? meter?.site_code ?? meter?.siteId ?? meter?.site_id ?? ""
  );
  const nameToken = normalizeMeterToken(
    meter?.name ?? meter?.deviceName ?? meter?.device_name ?? ""
  );
  const snToken = normalizeMeterToken(
    meter?.sn ?? meter?.serial ?? meter?.device_sn ?? meter?.modbus_address_in ?? ""
  );
  if (siteToken || nameToken || snToken) {
    return `${siteToken}:${nameToken}:${snToken}`;
  }
  return `fallback:${fallbackIndex}`;
};
const extractSiteRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const keys = ["data", "items", "result", "rows", "list", "sites"];
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
const extractDeviceRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const keys = ["data", "items", "result", "rows", "list", "devices"];
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
const toSitePlant = (row) => {
  if (!row || typeof row !== "object") return null;
  const apiId = Number(row.id ?? row.site_id ?? row.siteId);
  const siteCode = readString(row.site_code, row.siteCode, row.code);
  const name = readString(
    row.site_name,
    row.siteName,
    row.name,
    row.plant_name,
    row.plant
  );
  if (!name) return null;
  const status = normalizeSiteStatus(
    row.is_active ?? row.active ?? row.isActive ?? row.status
  );
  return {
    id: Number.isFinite(apiId) && apiId > 0
      ? `site-${apiId}`
      : `site-${siteCode || generateId()}`,
    apiId: Number.isFinite(apiId) && apiId > 0 ? apiId : null,
    siteCode,
    name,
    location: readString(row.location, row.address),
    timezone: readString(row.timezone) || "Asia/Bangkok",
    country: "Thailand",
    deviceType: "Meter",
    deviceSn: readString(row.device_sn, row.meter_sn, row.sn),
    status,
    devices: []
  };
};
const plantIdentityKey = (plant) => {
  if (!plant || typeof plant !== "object") return "";
  if (Number.isFinite(Number(plant.apiId)) && Number(plant.apiId) > 0) {
    return `id:${Number(plant.apiId)}`;
  }
  const fallback = normalizeSiteCodeKey(plant.siteCode) || normalizePlantNameKey(plant.name || "");
  return fallback ? `code:${fallback}` : "";
};
const toApiDevice = (row) => {
  if (!row || typeof row !== "object") return null;
  const siteId = Number(row.site_id ?? row.siteId);
  if (!Number.isFinite(siteId) || siteId <= 0) return null;
  const deviceId = Number(row.id ?? row.device_id ?? row.deviceId);
  const deviceName = readString(
    row.device_name,
    row.deviceName,
    row.name,
    row.meter_name,
    row.meterName
  );
  const sn = readString(
    row.modbus_address_in,
    row.modbusAddressIn,
    row.sn,
    row.serial,
    row.device_sn
  );
  const status = normalizeSiteStatus(
    row.is_active ?? row.active ?? row.isActive ?? row.status
  );
  return {
    id: Number.isFinite(deviceId) && deviceId > 0 ? `device-${deviceId}` : generateId(),
    apiId: Number.isFinite(deviceId) && deviceId > 0 ? deviceId : null,
    siteId,
    name: deviceName || sn || "Device",
    deviceName: deviceName || sn || "Device",
    sn,
    deviceType: readString(row.device_type, row.deviceType, row.type) || "METER",
    status
  };
};
const deviceIdentityKey = (device) => {
  if (!device || typeof device !== "object") return "";
  if (Number.isFinite(Number(device.apiId)) && Number(device.apiId) > 0) {
    return `id:${Number(device.apiId)}`;
  }
  const siteId = Number(device.siteId);
  if (!Number.isFinite(siteId) || siteId <= 0) return "";
  return `site:${siteId}:${normalizePlantNameKey(device.name || "")}`;
};
const normalizeApiPlants = (payload) => {
  const rows = extractSiteRows(payload);
  const byKey = new Map();
  rows.forEach((row) => {
    const plant = toSitePlant(row);
    if (!plant) return;
    const key = plantIdentityKey(plant);
    if (!key) return;
    if (!byKey.has(key)) byKey.set(key, plant);
  });
  return Array.from(byKey.values());
};
const normalizeApiDevices = (payload) => {
  const rows = extractDeviceRows(payload);
  const byKey = new Map();
  rows.forEach((row) => {
    const device = toApiDevice(row);
    if (!device) return;
    const key = deviceIdentityKey(device);
    if (!key) return;
    if (!byKey.has(key)) byKey.set(key, device);
  });
  return Array.from(byKey.values());
};
const mergeApiPlantsWithLocal = (apiPlants, localPlants, apiDevices = []) => {
  const byApiId = new Map();
  const bySiteCode = new Map();
  const byName = new Map();
  const devicesBySiteId = new Map();
  apiDevices.forEach((device) => {
    const siteId = Number(device.siteId);
    if (!Number.isFinite(siteId) || siteId <= 0) return;
    if (!devicesBySiteId.has(siteId)) devicesBySiteId.set(siteId, []);
    devicesBySiteId.get(siteId).push(device);
  });
  localPlants.forEach((plant) => {
    const apiId = Number(plant.apiId);
    if (Number.isFinite(apiId) && apiId > 0) byApiId.set(apiId, plant);
    const siteCodeKey = normalizeSiteCodeKey(plant.siteCode || plant.site_code);
    if (siteCodeKey) bySiteCode.set(siteCodeKey, plant);
    const nameKey = normalizePlantNameKey(plant.name || "");
    if (nameKey) byName.set(nameKey, plant);
  });
  const mergedApi = apiPlants.map((apiPlant) => {
    const apiSiteId = Number(apiPlant.apiId);
    const apiDevicesForPlant =
      Number.isFinite(apiSiteId) && apiSiteId > 0
        ? devicesBySiteId.get(apiSiteId) || []
        : [];
    const local =
      byApiId.get(Number(apiPlant.apiId)) ||
      bySiteCode.get(normalizeSiteCodeKey(apiPlant.siteCode)) ||
      byName.get(normalizePlantNameKey(apiPlant.name));
    const localDevices = Array.isArray(local?.devices) ? local.devices : [];
    const mergedDevices =
      apiDevicesForPlant.length || (Number.isFinite(apiSiteId) && apiSiteId > 0)
        ? apiDevicesForPlant
        : localDevices;
    return {
      ...apiPlant,
      id: local?.id || apiPlant.id,
      devices: mergedDevices,
      deviceSn: mergedDevices[0]?.sn || local?.deviceSn || apiPlant.deviceSn || ""
    };
  });
  return normalizePlants(mergedApi);
};
const parseFirstSiteFromResponse = (payload) => {
  const list = normalizeApiPlants(payload);
  if (list.length) return list[0];
  return toSitePlant(payload);
};
const getResponseErrorText = async (response) => {
  try {
    const text = await response.text();
    return text ? `: ${text}` : "";
  } catch {
    return "";
  }
};
const buildApiUrl = (base, path = "", search = "") => {
  const cleanedPath = path
    ? `/${String(path).replace(/^\/+/, "")}`
    : "";
  return `${base}${cleanedPath}${search || ""}`;
};
const requestApi = async (base, path = "", options = {}) => {
  const url = buildApiUrl(base, path, options.search || "");
  const method = String(options.method || "GET").toUpperCase();
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: options.headers,
    body: options.body
  });
  if (response.status === 401) {
    const unauthorizedError = new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    unauthorizedError.code = "UNAUTHORIZED";
    throw unauthorizedError;
  }
  if (response.status === 429) {
    const rateLimitError = new Error("API ถูกเรียกถี่เกินไป (429)");
    rateLimitError.code = "RATE_LIMIT";
    throw rateLimitError;
  }
  if (!response.ok) {
    const detail = await getResponseErrorText(response);
    throw new Error(`${method} ${url} failed (${response.status})${detail}`);
  }
  return response;
};
const requestSitesApi = async (path = "", options = {}) => {
  return requestApi(sitesApiBase, path, options);
};
const requestDevicesApi = async (path = "", options = {}) => {
  return requestApi(devicesApiBase, path, options);
};
const waitMs = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
const normalizeSitesCacheStatus = (value) => {
  const status = readString(value).toUpperCase();
  if (["MISS", "HIT", "STALE"].includes(status)) return status;
  return "";
};
const setSitesCacheBadge = (status = "", detail = "") => {
  const badge = document.getElementById("sites-cache-badge");
  if (!badge) return;
  const normalized = String(status || "").trim().toUpperCase();
  badge.classList.remove(
    "cache-miss",
    "cache-hit",
    "cache-stale",
    "cache-retry",
    "cache-error"
  );

  if (!normalized) {
    badge.textContent = "";
    badge.classList.add("hidden");
    return;
  }

  if (normalized === "MISS" || normalized === "HIT") {
    badge.textContent = "";
    badge.classList.add("hidden");
    return;
  } else if (normalized === "STALE") {
    badge.textContent = "API: STALE";
    badge.classList.add("cache-stale");
  } else if (normalized === "RETRY") {
    badge.textContent = detail
      ? `API: RETRY (${detail})`
      : "API: RETRY";
    badge.classList.add("cache-retry");
  } else if (normalized === "ERROR") {
    badge.textContent = "API: 429";
    badge.classList.add("cache-error");
  } else {
    badge.textContent = "";
    badge.classList.add("hidden");
    return;
  }

  badge.classList.remove("hidden");
};
const createSiteCode = (name) => {
  const base = String(name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 16) || "PPA";
  const suffix = Date.now().toString().slice(-6);
  return `${base}_${suffix}`;
};
const createSitePayload = (name, location) => ({
  site_code: createSiteCode(name),
  site_name: name,
  location: normalizeLocationValue(location),
  timezone: "Asia/Bangkok",
  is_active: 1
});
const fetchPlantsFromApi = async () => {
  const response = await requestSitesApi("", { method: "GET" });
  const payload = await response.json();
  return {
    plants: normalizeApiPlants(payload),
    cacheStatus: normalizeSitesCacheStatus(response.headers.get("x-proxy-cache"))
  };
};
const fetchPlantsFromApiWithRetry = async () => {
  let lastError = null;
  for (let attempt = 1; attempt <= sitesRetryMaxAttempts; attempt += 1) {
    try {
      return await fetchPlantsFromApi();
    } catch (error) {
      if (error?.code === "UNAUTHORIZED") throw error;
      if (error?.code !== "RATE_LIMIT") throw error;
      lastError = error;
      if (attempt >= sitesRetryMaxAttempts) break;
      const nextAttempt = attempt + 1;
      setSitesCacheBadge("RETRY", `${nextAttempt}/${sitesRetryMaxAttempts}`);
      await waitMs(sitesRetryBaseDelayMs * attempt);
    }
  }
  throw lastError || new Error("โหลดข้อมูลจาก Sites API ไม่สำเร็จ");
};
const fetchDevicesFromApi = async () => {
  const response = await requestDevicesApi("", { method: "GET" });
  const payload = await response.json();
  return normalizeApiDevices(payload);
};
const getPlantSiteId = (plant) => {
  const siteId = getPlantSiteIdNumber(plant);
  if (siteId) return String(siteId);
  return "-";
};
const getPlantMeterCount = (plant) => {
  const devices = Array.isArray(plant?.devices) ? plant.devices : [];
  const seen = new Set();
  let count = 0;
  devices.forEach((device, idx) => {
    if (!device || typeof device !== "object") return;
    const status = normalizeSiteStatus(
      device.is_active ?? device.active ?? device.isActive ?? device.status
    );
    if (status === "offline") return;
    const key = getMeterIdentityKeyForCount(device, idx);
    if (seen.has(key)) return;
    seen.add(key);
    count += 1;
  });
  return count;
};
const matchesPlantIdentity = (apiPlant, plant) => {
  const apiId = Number(apiPlant?.apiId);
  const plantApiId = Number(plant?.apiId);
  if (
    Number.isFinite(apiId) &&
    apiId > 0 &&
    Number.isFinite(plantApiId) &&
    plantApiId > 0
  ) {
    return apiId === plantApiId;
  }
  const apiCode = normalizeSiteCodeKey(apiPlant?.siteCode);
  const plantCode = normalizeSiteCodeKey(plant?.siteCode);
  if (apiCode && plantCode && apiCode === plantCode) return true;
  const apiName = normalizePlantNameKey(apiPlant?.name || "");
  const plantName = normalizePlantNameKey(plant?.name || "");
  if (apiName && plantName && apiName === plantName) return true;
  return false;
};
const resolveApiPlant = async (plant) => {
  if (!plant || typeof plant !== "object") return plant;
  const apiId = Number(plant.apiId);
  if (Number.isFinite(apiId) && apiId > 0) return plant;
  const response = await requestSitesApi("", { method: "GET" }).catch(() => null);
  if (!response) return plant;
  const payload = await response.json().catch(() => null);
  const rows = extractSiteRows(payload);
  const matchedRow = rows.find((row) => {
    const candidate = toSitePlant(row);
    if (!candidate) return false;
    return matchesPlantIdentity(candidate, plant);
  });
  const matched = matchedRow ? toSitePlant(matchedRow) : null;
  if (!matched) return plant;
  return {
    ...plant,
    apiId: matched.apiId,
    siteCode: matched.siteCode || plant.siteCode || "",
    name: matched.name || plant.name || "",
    location: matched.location || plant.location || "",
    timezone: matched.timezone || plant.timezone || "Asia/Bangkok",
    status: matched.status || plant.status || "online"
  };
};
const createPlantInApi = async (name, location) => {
  const payload = createSitePayload(name, location);
  const response = await requestSitesApi("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const responsePayload = await response.json().catch(() => null);
  const created = parseFirstSiteFromResponse(responsePayload);
  if (created) return created;
  const refreshed = await fetchPlantsFromApi()
    .then((result) => result.plants)
    .catch(() => []);
  const matched = refreshed.find((site) => {
    const sameCode =
      normalizeSiteCodeKey(site.siteCode) === normalizeSiteCodeKey(payload.site_code);
    const sameName =
      normalizePlantNameKey(site.name) === normalizePlantNameKey(payload.site_name);
    return sameCode || sameName;
  });
  if (matched) return matched;
  return {
    id: `site-${payload.site_code}`,
    apiId: null,
    siteCode: payload.site_code,
    name: payload.site_name,
    location: payload.location,
    timezone: payload.timezone,
    country: "Thailand",
    deviceType: "Meter",
    deviceSn: "",
    status: "online",
    devices: []
  };
};
const updatePlantInApi = async (plant, name, location) => {
  const targetPlant = await resolveApiPlant(plant);
  const apiId = Number(targetPlant?.apiId);
  if (!Number.isFinite(apiId) || apiId <= 0) return null;
  const normalizedLocation = normalizeLocationValue(location || targetPlant.location);
  const payload = {
    id: apiId,
    site_code: targetPlant.siteCode || createSiteCode(name),
    site_name: name,
    location: normalizedLocation,
    timezone: targetPlant.timezone || "Asia/Bangkok",
    is_active: targetPlant.status === "offline" ? 0 : 1
  };
  const response = await requestSitesApi("", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const responsePayload = await response.json().catch(() => null);
  return (
    parseFirstSiteFromResponse(responsePayload) || {
      ...targetPlant,
      siteCode: payload.site_code,
      name,
      location: payload.location,
      timezone: payload.timezone
    }
  );
};
const deactivatePlantInApi = async (plant, options = {}) => {
  const targetPlant = options.skipResolve ? plant : await resolveApiPlant(plant);
  const apiId = Number(targetPlant?.apiId);
  if (!Number.isFinite(apiId) || apiId <= 0) return false;
  const payload = {
    id: apiId,
    site_code: targetPlant.siteCode || createSiteCode(targetPlant.name || "PPA"),
    site_name: targetPlant.name || "PPA Site",
    location: normalizeLocationValue(targetPlant.location),
    timezone: targetPlant.timezone || "Asia/Bangkok",
    is_active: 0
  };
  await requestSitesApi("", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return true;
};
const deletePlantInApi = async (plant) => {
  const targetPlant = await resolveApiPlant(plant);
  const apiId = Number(targetPlant?.apiId);
  if (!Number.isFinite(apiId) || apiId <= 0) {
    throw new Error("ไม่พบรหัส Plant จาก API จึงยังลบที่หลังบ้านไม่ได้");
  }
  const errors = [];
  try {
    await requestSitesApi(String(apiId), { method: "DELETE" });
    return "hard";
  } catch (error) {
    errors.push(error);
  }
  try {
    await requestSitesApi("", {
      method: "DELETE",
      search: `?id=${encodeURIComponent(apiId)}`
    });
    return "hard";
  } catch (error) {
    errors.push(error);
  }
  try {
    await requestSitesApi("", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: apiId })
    });
    return "hard";
  } catch (error) {
    errors.push(error);
  }
  try {
    const deactivated = await deactivatePlantInApi(targetPlant, { skipResolve: true });
    if (deactivated) return "soft";
  } catch (error) {
    errors.push(error);
  }
  throw errors[0] || new Error("DELETE /api/sites failed");
};
const hydratePlantsFromApi = async () => {
  const hadPlants = plants.length > 0;
  isHydratingPlants = true;
  let hydrated = false;
  plantsLoadError = "";
  if (!hadPlants) render([]);
  try {
    const sitesResult = await fetchPlantsFromApiWithRetry();
    const apiPlants = sitesResult.plants;
    setSitesCacheBadge(sitesResult.cacheStatus);
    const apiDevices = await fetchDevicesFromApi().catch(() => []);
    plants = mergeApiPlantsWithLocal(apiPlants, plants, apiDevices);
    savePlants();
    hydrated = true;
  } catch (error) {
    if (error?.code === "UNAUTHORIZED") {
      redirectToLogin();
      return;
    }
    if (error?.code === "RATE_LIMIT") {
      plantsLoadError = "API ถูกเรียกถี่เกินไป (429) กรุณารอสักครู่แล้วกดรีเฟรช";
      setSitesCacheBadge("ERROR");
      console.warn("Sites API rate limited", error);
    }
    if (!plantsLoadError) {
      const reason = readString(error?.message);
      plantsLoadError = reason
        ? `โหลดข้อมูลจาก Sites API ไม่สำเร็จ: ${reason}`
        : "โหลดข้อมูลจาก Sites API ไม่สำเร็จ (แนะนำเปิดผ่าน npm start ที่ http://localhost:3000)";
      setSitesCacheBadge("ERROR");
      console.warn("Failed to load plants from API", error);
    }
  } finally {
    isHydratingPlants = false;
  }
  if (hydrated) {
    applyFilters();
    return;
  }
  if (hadPlants) {
    applyFilters();
    return;
  }
  render([]);
};

let plants = normalizePlants(loadPlants());
savePlants();

const rowsEl = document.getElementById("rows");
const inputs = {
  plant: document.getElementById("plant")
};
const createPlantBtn = document.getElementById("create-plant");
const plantCountEl = document.getElementById("plant-count");
const authUserEl = document.getElementById("auth-user");
const logoutBtn = document.getElementById("logout-btn");
const plantModal = document.getElementById("plant-modal");
const plantModalTitle = document.getElementById("plant-modal-title");
const plantModalClose = document.getElementById("plant-modal-close");
const plantCancel = document.getElementById("plant-cancel");
const plantDelete = document.getElementById("plant-delete");
const plantStepLabel = document.getElementById("plant-step-label");
const plantStepper = document.getElementById("plant-stepper");
const plantStepFill = document.getElementById("plant-step-fill");
const plantStepNext = document.getElementById("plant-step-next");
const plantStepBack = document.getElementById("plant-step-back");
const plantSave = document.getElementById("plant-save");
const plantNameInput = document.getElementById("plant-name-input");
const plantLocationInput = document.getElementById("plant-location-input");
const plantLocationCurrentBtn = document.getElementById("plant-location-current");
const plantLocationHint = document.getElementById("plant-location-hint");
const plantStepPanels = document.querySelectorAll(".plant-step");
const meterAddBtn = document.getElementById("meter-add-btn");
const meterModal = document.getElementById("meter-modal");
const meterModalTitle = document.getElementById("meter-modal-title");
const meterModalClose = document.getElementById("meter-modal-close");
const meterAddConfirm = document.getElementById("meter-add-confirm");
const meterAddCancel = document.getElementById("meter-add-cancel");
const meterNameInput = document.getElementById("meter-name-input");
const addressGroupAddBtn = document.getElementById("address-group-add-btn");
const addressGroupList = document.getElementById("address-group-list");
const addressGroupTemplate = document.getElementById("address-group-template");
const meterList = document.getElementById("meter-list");
const meterPager = document.getElementById("meter-pager");

let isPlantModalOpen = false;
let pendingMeters = [];
let editingPlantId = null;
let editingMeterIndex = null;
let meterPage = 1;
let plantStep = 1;
let plantModalMode = "create";
const metersPerPage = 5;
let isMeterModalOpen = false;
let isHydratingPlants = false;
let plantsLoadError = "";
let isLocatingPlantLocation = false;
let currentUserRole = "";
let currentUserSiteIdSet = new Set();
const canDeletePlants = () => currentUserRole === "superadmin";
const canDeleteMeters = () => currentUserRole === "superadmin";
const canAccessPlant = (plant) => {
  if (normalizeRole(currentUserRole) === "superadmin") return true;
  if (!currentUserSiteIdSet.size) return false;
  const siteId = getPlantSiteIdNumber(plant);
  return Boolean(siteId && currentUserSiteIdSet.has(siteId));
};

const redirectToLogin = () => {
  const target = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const search = new URLSearchParams();
  search.set("redirect", target);
  window.location.href = `./login/index.html?${search.toString()}`;
};
const setAuthUser = (user) => {
  if (!authUserEl) return;
  const label = readString(user?.name, user?.email) || "ผู้ใช้งาน";
  authUserEl.textContent = `ผู้ใช้: ${label}`;
};
const ensureAuthenticated = async () => {
  currentUserRole = "";
  currentUserSiteIdSet = new Set();
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "same-origin"
    });
    if (!response.ok) {
      redirectToLogin();
      return null;
    }
    const payload = await response.json().catch(() => ({}));
    if (!payload?.user) {
      redirectToLogin();
      return null;
    }
    currentUserRole = normalizeRole(payload.user?.role);
    currentUserSiteIdSet = new Set(await resolveUserSiteIds(payload.user));
    setAuthUser(payload.user);
    return payload.user;
  } catch {
    redirectToLogin();
    return null;
  }
};
const logout = async () => {
  if (logoutBtn) {
    logoutBtn.disabled = true;
    logoutBtn.textContent = "กำลังออกจากระบบ...";
  }
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } catch {
    // ignore network error and force redirect to login
  }
  redirectToLogin();
};

const render = (data) => {
  if (plantCountEl) plantCountEl.textContent = `ทั้งหมด ${data.length} Plant`;
  if (!data.length) {
    if (isHydratingPlants) {
      rowsEl.innerHTML = '<tr><td class="empty" colspan="6">กำลังโหลดข้อมูล Plant...</td></tr>';
      return;
    }
    if (plantsLoadError) {
      rowsEl.innerHTML = `<tr><td class="empty" colspan="6">${plantsLoadError}</td></tr>`;
      return;
    }
    rowsEl.innerHTML = '<tr><td class="empty" colspan="6">ไม่พบข้อมูล</td></tr>';
    return;
  }

  rowsEl.innerHTML = data.map((item, idx) => `
    <tr data-index="${idx}" data-id="${item.id}">
      <td><span class="status-dot ${item.status === "offline" ? "offline" : "online"}" title="${item.status === "offline" ? "offline" : "online"}"></span></td>
      <td><div class="img-ph" aria-label="ภาพโรงไฟฟ้า (placeholder)"></div></td>
      <td>${escapeHtml(getPlantSiteId(item))}</td>
      <td>
        <div class="name">${escapeHtml(item.name)}</div>
      </td>
      <td>
        <div class="meter-count-badge">${escapeHtml(String(getPlantMeterCount(item)))}</div>
      </td>
      <td>
        <div class="history-actions">
          <button class="small-btn" data-action="edit" data-id="${item.id}" type="button" aria-label="แก้ไข" title="แก้ไข">⋯</button>
        </div>
      </td>
    </tr>
  `).join("");

  rowsEl.querySelectorAll("tr[data-index]").forEach((tr) => {
    tr.addEventListener("click", () => {
      const idx = Number(tr.dataset.index);
      const plant = data[idx];
      if (!plant) return;
      localStorage.setItem("selectedPlant", JSON.stringify(plant));
      window.location.href = "./plant/index.html";
    });
  });
  rowsEl.querySelectorAll("button[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (!id) return;
      const plant = data.find((p) => p.id === id);
      if (plant) openPlantModal("edit", plant);
    });
  });
};

const setFieldError = (input, hasError) => {
  const field = input?.closest(".field");
  if (!field) return;
  field.classList.toggle("has-error", hasError);
};
const normalizeAddressGroup = (group = {}) => ({
  addressName: readString(group.addressName, group.address_name),
  station: readString(group.station, group.sn),
  address: readString(group.address)
});
const getAddressGroupsFromMeter = (meter = {}) => {
  const groups = Array.isArray(meter.addressGroups)
    ? meter.addressGroups
        .map((group) => normalizeAddressGroup(group))
        .filter((group) => group.addressName || group.station || group.address)
    : [];
  if (groups.length) return groups;
  const legacy = normalizeAddressGroup(meter);
  if (legacy.addressName || legacy.station || legacy.address) return [legacy];
  return [];
};
const getAddressGroupItems = () =>
  Array.from(addressGroupList?.querySelectorAll(".address-group-item") || []);
const getAddressGroupsFromForm = () =>
  getAddressGroupItems().map((item) => ({
    addressName: readString(item.querySelector('input[data-field="addressName"]')?.value),
    station: readString(item.querySelector('input[data-field="station"]')?.value),
    address: readString(item.querySelector('input[data-field="address"]')?.value)
  }));
const updateAddressGroupIndices = () => {
  const items = getAddressGroupItems();
  items.forEach((item, idx) => {
    const indexEl = item.querySelector(".address-group-index");
    if (indexEl) indexEl.textContent = `ชุดที่ ${idx + 1}`;
    const removeBtn = item.querySelector(".address-group-remove");
    if (removeBtn) removeBtn.classList.toggle("hidden", items.length <= 1);
  });
};
const bindAddressGroupItem = (item) => {
  item.querySelectorAll('input[data-field]').forEach((input) => {
    input.addEventListener("input", () => {
      if (input.dataset.field === "station" || input.dataset.field === "address") {
        const cleaned = input.value.replace(/\D+/g, "");
        if (input.value !== cleaned) input.value = cleaned;
      }
      setFieldError(input, !input.value.trim());
    });
  });
  item.querySelector(".address-group-remove")?.addEventListener("click", () => {
    const groupLabel = readString(item.querySelector(".address-group-index")?.textContent) || "ชุด Address นี้";
    const ok = confirm(`ต้องการลบ ${groupLabel} ใช่หรือไม่?`);
    if (!ok) return;
    item.remove();
    if (!getAddressGroupItems().length) {
      appendAddressGroupItem();
    }
    updateAddressGroupIndices();
    updateMeterRequiredStates();
  });
};
const appendAddressGroupItem = (group = {}, { focus = false } = {}) => {
  if (!addressGroupTemplate || !addressGroupList) return;
  const clone = addressGroupTemplate.content.cloneNode(true);
  const item = clone.querySelector(".address-group-item");
  if (!item) return;
  const normalized = normalizeAddressGroup(group);
  const addressNameInput = item.querySelector('input[data-field="addressName"]');
  const stationInput = item.querySelector('input[data-field="station"]');
  const addressInput = item.querySelector('input[data-field="address"]');
  if (addressNameInput) addressNameInput.value = normalized.addressName;
  if (stationInput) stationInput.value = normalized.station;
  if (addressInput) addressInput.value = normalized.address;
  bindAddressGroupItem(item);
  addressGroupList.appendChild(item);
  updateAddressGroupIndices();
  if (focus) addressNameInput?.focus();
};
const setAddressGroupsToForm = (groups = []) => {
  if (!addressGroupList) return;
  addressGroupList.innerHTML = "";
  const normalized = (Array.isArray(groups) ? groups : [])
    .map((group) => normalizeAddressGroup(group))
    .filter((group) => group.addressName || group.station || group.address);
  if (!normalized.length) normalized.push({ addressName: "", station: "", address: "" });
  normalized.forEach((group) => appendAddressGroupItem(group));
  updateMeterRequiredStates();
};
const resetMeterForm = () => {
  if (meterNameInput) meterNameInput.value = "";
  setAddressGroupsToForm();
  editingMeterIndex = null;
  if (meterAddConfirm) meterAddConfirm.textContent = "ตกลง";
  if (meterModalTitle) meterModalTitle.textContent = "เพิ่มมิเตอร์";
  updateMeterRequiredStates();
};
const updateMeterRequiredStates = () => {
  setFieldError(meterNameInput, !meterNameInput?.value.trim());
  getAddressGroupItems().forEach((item) => {
    const addressNameInput = item.querySelector('input[data-field="addressName"]');
    const stationInput = item.querySelector('input[data-field="station"]');
    const addressInput = item.querySelector('input[data-field="address"]');
    setFieldError(addressNameInput, !addressNameInput?.value.trim());
    setFieldError(stationInput, !stationInput?.value.trim());
    setFieldError(addressInput, !addressInput?.value.trim());
  });
};
const closeMeterModal = () => {
  meterModal?.classList.add("hidden");
  isMeterModalOpen = false;
  resetMeterForm();
};
const openMeterModal = () => {
  if (!getAddressGroupItems().length) setAddressGroupsToForm();
  meterModal?.classList.remove("hidden");
  isMeterModalOpen = true;
  updateMeterRequiredStates();
  meterNameInput?.focus();
};
const getMeterPageCount = () =>
  Math.max(1, Math.ceil(pendingMeters.length / metersPerPage));
const renderMeterPager = () => {
  if (!meterPager) return;
  const totalPages = getMeterPageCount();
  if (totalPages <= 1) {
    meterPager.classList.add("hidden");
    meterPager.innerHTML = "";
    return;
  }
  meterPager.classList.remove("hidden");
  meterPager.innerHTML = Array.from({ length: totalPages }, (_, idx) => {
    const page = idx + 1;
    const active = page === meterPage ? "active" : "";
    return `<button class="pager-btn ${active}" type="button" data-page="${page}">${page}</button>`;
  }).join("");
  meterPager.querySelectorAll("button[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = Number(btn.dataset.page);
      if (!page) return;
      meterPage = page;
      renderMeterList();
    });
  });
};
const renderMeterList = () => {
  if (!meterList) return;
  const allowDelete = canDeleteMeters();
  const totalPages = getMeterPageCount();
  if (meterPage > totalPages) meterPage = totalPages;
  if (meterPage < 1) meterPage = 1;
  meterList.classList.toggle("scroll", pendingMeters.length > metersPerPage);
  if (!pendingMeters.length) {
    meterList.innerHTML = '<p class="muted small">ยังไม่มีมิเตอร์ที่เพิ่ม</p>';
    renderMeterPager();
    return;
  }
  const start = (meterPage - 1) * metersPerPage;
  const pageItems = pendingMeters.slice(start, start + metersPerPage);
  meterList.innerHTML = pageItems
    .map((m, idx) => {
      const addressGroups = getAddressGroupsFromMeter(m);
      const groupSummary = addressGroups.length
        ? addressGroups
            .map(
              (group, groupIdx) =>
                `<div class="meta">ชุด ${groupIdx + 1}: ${group.addressName || "-"} | Station: ${group.station || "-"} | เลข Address: ${group.address || "-"}</div>`
            )
            .join("")
        : '<div class="meta">ยังไม่ได้เพิ่มชุด Address</div>';
      return `
      <div class="meter-item">
        <div>
          <div class="title">${m.name}</div>
          ${groupSummary}
        </div>
        <div class="meter-item-actions">
          <button class="meter-edit" type="button" data-action="edit" data-index="${start + idx}">แก้ไข</button>
          ${
            allowDelete
              ? `<button class="meter-remove" type="button" data-action="delete" data-index="${start + idx}">ลบ</button>`
              : ""
          }
        </div>
      </div>
    `
    })
    .join("");
  if (allowDelete) {
    meterList.querySelectorAll("button[data-action='delete']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        if (Number.isNaN(index)) return;
        const target = pendingMeters[index];
        if (!target) return;
        const meterLabel = readString(target.name) || `มิเตอร์ลำดับ ${index + 1}`;
        const ok = confirm(`ต้องการลบมิเตอร์: ${meterLabel} ใช่หรือไม่?`);
        if (!ok) return;
        pendingMeters = pendingMeters.filter((_, i) => i !== index);
        renderMeterList();
      });
    });
  }
  meterList.querySelectorAll("button[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      const meter = pendingMeters[index];
      if (!meter) return;
      editingMeterIndex = index;
      if (meterNameInput) meterNameInput.value = meter.name || "";
      setAddressGroupsToForm(getAddressGroupsFromMeter(meter));
      if (meterAddConfirm) meterAddConfirm.textContent = "อัปเดต";
      if (meterModalTitle) meterModalTitle.textContent = "แก้ไขมิเตอร์";
      updateMeterRequiredStates();
      openMeterModal();
    });
  });
  renderMeterPager();
};

const setPlantLocationHint = (message, isError = false) => {
  if (!plantLocationHint) return;
  plantLocationHint.textContent = message;
  plantLocationHint.style.color = isError ? "#d94646" : "";
};
const setPlantLocationLoading = (loading) => {
  isLocatingPlantLocation = loading;
  if (!plantLocationCurrentBtn) return;
  plantLocationCurrentBtn.disabled = loading;
  plantLocationCurrentBtn.textContent = loading
    ? "กำลังค้นหาตำแหน่ง..."
    : "ค้นหาตำแหน่งปัจจุบัน";
};
const locateCurrentPosition = () => {
  if (isLocatingPlantLocation) return;
  if (!navigator.geolocation) {
    setPlantLocationHint("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง", true);
    return;
  }
  setPlantLocationLoading(true);
  setPlantLocationHint("กำลังขอสิทธิ์ตำแหน่งจากอุปกรณ์...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = Number(position.coords.latitude).toFixed(6);
      const lng = Number(position.coords.longitude).toFixed(6);
      if (plantLocationInput) plantLocationInput.value = `${lat},${lng}`;
      setPlantLocationHint(`ได้ตำแหน่งแล้ว: ${lat},${lng}`);
      setPlantLocationLoading(false);
    },
    (error) => {
      let message = "ไม่สามารถดึงตำแหน่งปัจจุบันได้";
      if (error?.code === 1) message = "ผู้ใช้ปฏิเสธการเข้าถึงตำแหน่ง";
      if (error?.code === 2) message = "ไม่พบข้อมูลตำแหน่งจากอุปกรณ์";
      if (error?.code === 3) message = "ดึงตำแหน่งไม่ทันเวลา (timeout)";
      setPlantLocationHint(message, true);
      setPlantLocationLoading(false);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};

const getPlantNameValue = () => plantNameInput?.value.trim() ?? "";
const canProceedToMeters = () => Boolean(getPlantNameValue());
const isCreatePlantFlow = () => plantModalMode === "create";
const getPlantStepCount = () => (isCreatePlantFlow() ? 2 : 1);
const updatePlantStepAvailability = () => {
  if (!isCreatePlantFlow()) {
    if (plantStepNext) plantStepNext.disabled = false;
    return;
  }
  const canGoStep2 = canProceedToMeters();
  if (plantStepNext) plantStepNext.disabled = !canGoStep2;
};
const setPlantStep = (step, { force = false } = {}) => {
  const totalSteps = getPlantStepCount();
  const isSingleStep = totalSteps === 1;
  const target = Math.min(Math.max(step, 1), totalSteps);
  if (target === 2 && !canProceedToMeters() && !force) {
    alert("กรุณาตั้งชื่อ Plant ก่อน");
    return;
  }
  plantStep = target;
  plantStepPanels.forEach((panel) => {
    const panelStep = Number(panel.dataset.step);
    panel.classList.toggle("hidden", panelStep !== plantStep);
  });
  if (plantStepper) {
    plantStepper.classList.toggle("hidden", isSingleStep);
  }
  if (plantStepLabel) {
    if (isSingleStep) {
      plantStepLabel.textContent = "";
      plantStepLabel.classList.add("hidden");
    } else {
      plantStepLabel.textContent = `ขั้นตอนที่ ${plantStep}/${totalSteps}`;
      plantStepLabel.classList.remove("hidden");
    }
  }
  if (plantStepper) plantStepper.dataset.step = String(plantStep);
  if (plantStepFill) {
    const progress = (plantStep / totalSteps) * 100;
    plantStepFill.style.width = `${progress}%`;
  }
  plantStepper?.querySelectorAll(".modal-step-item").forEach((item) => {
    const itemStep = Number(item.dataset.step);
    item.classList.toggle("hidden", itemStep > totalSteps);
    item.classList.toggle("active", itemStep === plantStep);
    item.classList.toggle("done", itemStep < plantStep);
  });
  plantStepBack?.classList.toggle("hidden", isSingleStep || plantStep !== 2);
  plantSave?.classList.toggle("hidden", isSingleStep ? false : plantStep !== 2);
  plantStepNext?.classList.toggle("hidden", isSingleStep || plantStep !== 1);
  updatePlantStepAvailability();
};

const openPlantModal = (mode = "create", plant = null) => {
  if (!plantModal) return;
  plantModal.classList.remove("hidden");
  isPlantModalOpen = true;
  plantModalMode = mode === "edit" ? "edit" : "create";
  meterPage = 1;
  if (mode === "edit" && plant) {
    editingPlantId = plant.id;
    if (plantModalTitle) plantModalTitle.textContent = "แก้ไข Plant";
    plantDelete?.classList.toggle("hidden", !canDeletePlants());
    if (plantNameInput) plantNameInput.value = plant.name || "";
    if (plantLocationInput) plantLocationInput.value = plant.location || "";
    setPlantLocationHint("");
    const meters = Array.isArray(plant.devices) ? plant.devices : [];
    pendingMeters = meters.map((m) => {
      const addressGroups = getAddressGroupsFromMeter(m);
      const firstGroup = addressGroups[0] || { addressName: "", station: "", address: "" };
      return {
        name: m.name || "",
        address: firstGroup.address || "",
        addressName: firstGroup.addressName || "",
        station: firstGroup.station || m.sn || "",
        addressGroups
      };
    });
  } else {
    editingPlantId = null;
    if (plantModalTitle) plantModalTitle.textContent = "สร้าง Plant";
    plantDelete?.classList.add("hidden");
    if (plantNameInput) plantNameInput.value = "";
    if (plantLocationInput) plantLocationInput.value = "";
    setPlantLocationHint("");
    pendingMeters = [];
  }
  renderMeterList();
  setPlantStep(1, { force: true });
  closeMeterModal();
};
const closePlantModal = () => {
  plantModal?.classList.add("hidden");
  isPlantModalOpen = false;
  plantModalMode = "create";
  if (plantNameInput) plantNameInput.value = "";
  if (plantLocationInput) plantLocationInput.value = "";
  setPlantLocationHint("");
  setPlantLocationLoading(false);
  pendingMeters = [];
  editingPlantId = null;
  plantDelete?.classList.add("hidden");
  renderMeterList();
  setPlantStep(1, { force: true });
  closeMeterModal();
};

const applyFilters = () => {
  const plantText = inputs.plant.value.trim().toLowerCase();

  const filtered = plants.filter((p) => {
    if (!canAccessPlant(p)) return false;
    const siteId = getPlantSiteId(p).toLowerCase();
    const siteName = readString(p.name, p.site_name).toLowerCase();
    const matchesPlant =
      !plantText ||
      siteName.includes(plantText) ||
      (siteId !== "-" && siteId.includes(plantText));
    return matchesPlant;
  });
  render(filtered);
};

const deletePlant = async (id) => {
  if (!canDeletePlants()) {
    alert("สิทธิ์ admin ไม่สามารถลบ Plant ได้");
    return;
  }
  const target = plants.find((p) => p.id === id);
  if (!target) return;
  const ok = confirm(`ต้องการลบ Plant: ${target.name} ใช่หรือไม่?`);
  if (!ok) return;
  try {
    const deleteMode = await deletePlantInApi(target);
    plants = plants.filter((p) => p.id !== id);
    savePlants();
    applyFilters();
    closePlantModal();
    if (deleteMode === "soft") {
      alert("ระบบปิดใช้งาน Plant ที่หลังบ้านแล้ว (is_active = 0) เนื่องจาก API ลบจริงยังไม่พร้อม");
    }
  } catch (error) {
    alert(error?.message || "ลบ Plant ผ่าน API ไม่สำเร็จ");
  }
};

document.getElementById("search").addEventListener("click", applyFilters);
document.getElementById("reset").addEventListener("click", () => {
  Object.values(inputs).forEach((el) => { el.value = ""; });
  applyFilters();
});

logoutBtn?.addEventListener("click", logout);
createPlantBtn?.addEventListener("click", () => openPlantModal("create"));
plantModalClose?.addEventListener("click", closePlantModal);
plantCancel?.addEventListener("click", closePlantModal);
plantModal?.addEventListener("click", (e) => {
  if (e.target === plantModal) closePlantModal();
});
plantDelete?.addEventListener("click", () => {
  if (!editingPlantId) return;
  deletePlant(editingPlantId);
});
plantStepNext?.addEventListener("click", () => setPlantStep(2));
plantStepBack?.addEventListener("click", () => setPlantStep(1, { force: true }));
meterModalClose?.addEventListener("click", closeMeterModal);
meterModal?.addEventListener("click", (e) => {
  if (e.target === meterModal) closeMeterModal();
});

meterAddBtn?.addEventListener("click", () => {
  resetMeterForm();
  openMeterModal();
});
meterAddCancel?.addEventListener("click", closeMeterModal);
addressGroupAddBtn?.addEventListener("click", () => {
  appendAddressGroupItem({}, { focus: true });
  updateMeterRequiredStates();
});
plantNameInput?.addEventListener("input", () => {
  updatePlantStepAvailability();
});
plantLocationCurrentBtn?.addEventListener("click", locateCurrentPosition);
meterNameInput?.addEventListener("input", () => {
  setFieldError(meterNameInput, !meterNameInput.value.trim());
});
meterAddConfirm?.addEventListener("click", () => {
  const name = meterNameInput?.value.trim();
  const addressGroups = getAddressGroupsFromForm();
  const hasAddressError =
    !addressGroups.length ||
    addressGroups.some((group) => !group.addressName || !group.station || !group.address);
  const hasError = !name || hasAddressError;
  updateMeterRequiredStates();
  if (hasError) {
    alert("กรุณากรอกข้อมูลมิเตอร์ให้ครบ");
    return;
  }
  const firstGroup = addressGroups[0] || { addressName: "", station: "", address: "" };
  const payload = {
    name,
    address: firstGroup.address,
    addressName: firstGroup.addressName,
    station: firstGroup.station,
    addressGroups
  };
  if (editingMeterIndex !== null) {
    pendingMeters = pendingMeters.map((m, idx) =>
      idx === editingMeterIndex ? payload : m
    );
  } else {
    pendingMeters = [...pendingMeters, payload];
    meterPage = getMeterPageCount();
  }
  renderMeterList();
  closeMeterModal();
});

plantSave?.addEventListener("click", async () => {
  const isEdit = Boolean(editingPlantId);
  const plantName = plantNameInput?.value.trim();
  const plantLocation = normalizeLocationValue(plantLocationInput?.value);
  if (!plantName) {
    alert("กรุณาตั้งชื่อ Plant");
    return;
  }
  if (!isEdit && !pendingMeters.length) {
    alert("กรุณาเพิ่มมิเตอร์อย่างน้อย 1 รายการ");
    return;
  }
  const devices = pendingMeters.map((m, idx) => {
    const addressGroups = getAddressGroupsFromMeter(m);
    const firstGroup = addressGroups[0] || normalizeAddressGroup(m);
    return {
      name: m.name,
      sn: firstGroup.station || firstGroup.address || `SN-${Date.now()}-${idx}`,
      status: "online",
      address: firstGroup.address,
      addressName: firstGroup.addressName,
      station: firstGroup.station,
      addressGroups
    };
  });
  const originalSaveText = plantSave?.textContent || "บันทึก";
  if (plantSave) {
    plantSave.disabled = true;
    plantSave.textContent = "กำลังบันทึก...";
  }
  try {
    if (isEdit) {
      const current = plants.find((p) => p.id === editingPlantId);
      if (!current) return;
      const updatedFromApi = await updatePlantInApi(
        current,
        plantName,
        plantLocation
      );
      const updated = {
        ...current,
        ...updatedFromApi,
        id: current.id,
        name: updatedFromApi?.name || plantName,
        location: updatedFromApi?.location || plantLocation,
        devices: Array.isArray(current.devices) ? current.devices : [],
        deviceSn: current.deviceSn || updatedFromApi?.deviceSn || ""
      };
      plants = plants.map((p) => (p.id === editingPlantId ? updated : p));
    } else {
      const createdFromApi = await createPlantInApi(plantName, plantLocation);
      const newPlant = {
        ...createdFromApi,
        id: generateId(),
        name: createdFromApi.name || plantName,
        location: createdFromApi.location || plantLocation,
        country: "Thailand",
        deviceType: "Meter",
        deviceSn: devices[0]?.sn || "",
        status: createdFromApi.status || "online",
        devices
      };
      plants = [newPlant, ...plants];
    }
    savePlants();
    applyFilters();
    closePlantModal();
  } catch (error) {
    alert(error?.message || "บันทึก Plant ผ่าน API ไม่สำเร็จ");
  } finally {
    if (plantSave) {
      plantSave.disabled = false;
      plantSave.textContent = originalSaveText;
    }
  }
});

Object.values(inputs).forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFilters();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (isMeterModalOpen) {
    closeMeterModal();
    return;
  }
  if (isPlantModalOpen) closePlantModal();
});

const startApp = async () => {
  const user = await ensureAuthenticated();
  if (!user) return;
  if (plants.length) {
    applyFilters();
  } else {
    render([]);
  }
  updatePlantStepAvailability();
  hydratePlantsFromApi();
};

startApp();
