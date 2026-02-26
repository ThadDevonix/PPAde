const backBtn = document.getElementById("back-meter");
backBtn?.addEventListener("click", () => {
  window.location.href = "../plant/index.html";
});

const meterData = (() => {
  try {
    return JSON.parse(localStorage.getItem("selectedMeter"));
  } catch {
    return null;
  }
})();
const plantData = (() => {
  try {
    return JSON.parse(localStorage.getItem("selectedPlant"));
  } catch {
    return null;
  }
})();

const meterNameEl = document.getElementById("meter-name");
const chartBox = document.getElementById("chart-box");
const totalKwhValue = document.getElementById("total-kwh-value");
const totalKwhLabel = document.getElementById("total-kwh-label");
const totalKwhBox = totalKwhValue?.closest(".meter-total-box");
const meterLiveValue = document.getElementById("meter-live-value");

const periodSwitch = document.getElementById("chart-period-switch");
const periodButtons = Array.from(
  periodSwitch?.querySelectorAll(".period-btn") || []
);
const yearSelect = document.getElementById("chart-year");
const monthSelect = document.getElementById("chart-month");
const daySelect = document.getElementById("chart-day");
const monthWrap = document.getElementById("chart-month-wrap");
const dayWrap = document.getElementById("chart-day-wrap");

const energyApiCandidates = ["/api/energy"];
const deviceEnergyApiCandidates = ["/api/device-energy"];
const dayFallbackEnergyApiCandidates = ["/api/energy"];
const deviceEnergyPayloadCache = new Map();
const deviceEnergyPayloadTtlMs = 30 * 1000;
const deviceEnergyRateLimitCooldownMs = 20 * 1000;
const thaiMonthShort = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค."
];
const thaiMonthFull = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม"
];

let selectedPeriod = "day";
const meterLivePollIntervalMs = 20 * 1000;
let meterLivePollTimer = null;
let meterLiveRequestToken = 0;
let meterLiveInitialized = false;
const readStrictPositiveId = (value) => {
  if (Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) {
    const parsed = Number(text);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  // Accept only explicit ID-like forms to avoid accidentally parsing
  // random numbers from labels/names.
  const match = text.match(/^(?:device|meter|id)-(\d+)$/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const selectedMeterId = (() => {
  const candidates = [
    meterData?.apiId,
    meterData?.device_id,
    meterData?.deviceId,
    meterData?.meter_id,
    meterData?.meterId,
    meterData?.id
  ];
  for (const value of candidates) {
    const id = readStrictPositiveId(value);
    if (Number.isFinite(id) && id > 0) return id;
  }
  return NaN;
})();

const pad2 = (value) => String(value).padStart(2, "0");
const normalizeDateKey = (value) => {
  if (!value) return "";
  const text = String(value).trim();
  const match = text.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
};
const normalizeKeyToken = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const normalizeIdentityToken = (value) => String(value || "").trim().toLowerCase();
const readLooseValue = (row, keys) => {
  if (!row || typeof row !== "object" || Array.isArray(row)) return undefined;
  const wanted = new Set(keys.map(normalizeKeyToken));
  const entries = Object.entries(row);
  for (const [rawKey, value] of entries) {
    if (wanted.has(normalizeKeyToken(rawKey))) return value;
  }
  return undefined;
};
const parseNumber = (value) => {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : 0;
};
const parseFiniteNumber = (value) => {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
};
const collectFiniteNumbers = (values) =>
  (Array.isArray(values) ? values : []).filter((value) => Number.isFinite(value));
const findLastFiniteNumber = (values) => {
  const source = Array.isArray(values) ? values : [];
  for (let idx = source.length - 1; idx >= 0; idx -= 1) {
    const value = source[idx];
    if (Number.isFinite(value)) return value;
  }
  return null;
};
const readLooseNumber = (row, keys) => {
  const value = readLooseValue(row, keys);
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
};
const rowTimestampKeys = [
  "reading_time",
  "readingTime",
  "datetime",
  "timestamp",
  "ts",
  "time",
  "created_at",
  "createdAt"
];
const readRowTimestampValue = (row) => readLooseValue(row, rowTimestampKeys);
const readRowLiveTimestampValue = (row) => {
  const readingTime = readLooseValue(row, ["reading_time", "readingTime"]);
  if (readingTime !== undefined && readingTime !== null && String(readingTime).trim()) {
    return {
      value: readingTime,
      fromReadingTime: true
    };
  }
  return {
    value: readRowTimestampValue(row),
    fromReadingTime: false
  };
};
const toDateFromLiveTimestamp = (row) => {
  const liveStamp = readRowLiveTimestampValue(row);
  const rawValue = liveStamp?.value;
  const parsed = toDate(rawValue);
  if (!liveStamp?.fromReadingTime || typeof rawValue !== "string") return parsed;
  const text = rawValue.trim();
  if (!text || !/z$/i.test(text)) return parsed;
  const localCandidate = toDate(text.replace(/z$/i, ""));
  if (!localCandidate) return parsed;
  if (!parsed) return localCandidate;
  const nowMs = Date.now();
  const parsedMs = parsed.getTime();
  const localMs = localCandidate.getTime();
  const parsedLooksFuture = parsedMs - nowMs > 2 * 60 * 60 * 1000;
  const localNotFarFuture = localMs - nowMs <= 2 * 60 * 60 * 1000;
  // Some devices send local clock time with "Z". Prefer local when UTC parse
  // clearly jumps into the future.
  if (parsedLooksFuture && localNotFarFuture) return localCandidate;
  return parsed;
};
const readSolarSeriesValue = (row) => {
  return readLooseNumber(row, [
    "solar_in",
    "solarIn",
    "value_in",
    "valueIn",
    "solar in",
    "energy_in",
    "energyIn",
    "solar_kw",
    "solarKw",
    "solar",
    "pv",
    "pv_in",
    "pvIn"
  ]);
};
const readGridSeriesValue = (row) => {
  return readLooseNumber(row, [
    "self_use",
    "selfUse",
    "value_out",
    "valueOut",
    "self use",
    "energy_out",
    "energyOut",
    "grid_import",
    "gridImport",
    "egat",
    "utility",
    "utility_in",
    "utilityIn",
    "mdb_in",
    "mdbIn",
    "consumption"
  ]);
};
const readEnergyTotalValue = (row) => {
  const direct = readLooseNumber(row, [
    "energy_total",
    "energyTotal",
    "total_energy",
    "totalEnergy",
    "daily_energy",
    "dailyEnergy",
    "monthly_energy",
    "monthlyEnergy",
    "energy_in",
    "energyIn",
    "energy_out",
    "energyOut",
    "kwh",
    "energy",
    "value",
    "total"
  ]);
  if (direct !== null) return direct;
  const solar = readSolarSeriesValue(row);
  const grid = readGridSeriesValue(row);
  if (solar !== null || grid !== null) {
    return (solar || 0) + (grid || 0);
  }
  return null;
};
const readText = (...values) => {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (text) return text;
  }
  return "";
};
const parseLoosePositiveId = (value) => {
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) return num;
  if (typeof value === "string") {
    const match = value.match(/(\d+)/);
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
};
const selectedSiteId =
  parseLoosePositiveId(meterData?.siteId) ||
  parseLoosePositiveId(meterData?.site_id) ||
  parseLoosePositiveId(plantData?.apiId) ||
  parseLoosePositiveId(plantData?.siteId) ||
  parseLoosePositiveId(plantData?.site_id) ||
  parseLoosePositiveId(plantData?.id);
const selectedSiteCodeKey = normalizeIdentityToken(
  readText(
    plantData?.siteCode,
    plantData?.site_code,
    meterData?.siteCode,
    meterData?.site_code
  )
);
const selectedSiteNameKey = normalizeIdentityToken(
  readText(plantData?.name, meterData?.siteName, meterData?.site_name)
);
const selectedEnergyName = readText(
  meterData?.sn,
  meterData?.name,
  plantData?.siteCode,
  plantData?.site_code,
  plantData?.name
);
const selectedMeterNameKey = normalizeIdentityToken(
  readText(meterData?.name, meterData?.deviceName, meterData?.device_name)
);
const selectedMeterSnKey = normalizeIdentityToken(
  readText(
    meterData?.sn,
    meterData?.serial,
    meterData?.device_sn,
    meterData?.modbus_address_in,
    meterData?.modbusAddressIn
  )
);
const inferMeterTypeKey = (nameKey, snKey) => {
  const raw = `${nameKey || ""} ${snKey || ""}`.trim().toLowerCase();
  if (!raw) return "";
  if (
    raw.includes("solar") ||
    raw.includes("inverter") ||
    raw.includes("panel") ||
    raw.includes("pv")
  ) {
    return "solarpanel";
  }
  if (raw.includes("mdb") || raw.includes("meter")) return "meter";
  return "";
};
const selectedMeterTypeKey =
  normalizeKeyToken(
  readText(meterData?.deviceType, meterData?.device_type, meterData?.type)
  ) || inferMeterTypeKey(selectedMeterNameKey, selectedMeterSnKey);
const chartTimeZone =
  readText(
    meterData?.timezone,
    meterData?.timeZone,
    plantData?.timezone,
    plantData?.timeZone
  ) || "Asia/Bangkok";
const formatMetric = (value) =>
  parseNumber(value).toLocaleString("th-TH", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
const formatYAxisMetric = (value) =>
  Math.round(parseNumber(value)).toLocaleString("th-TH", {
    maximumFractionDigits: 0
  });
const resolveNiceIntegerStep = (range, segments = 4) => {
  const safeRange = Number(range);
  if (!Number.isFinite(safeRange) || safeRange <= 0) return 1;
  const roughStep = safeRange / Math.max(1, segments);
  const exponent = Math.floor(Math.log10(roughStep));
  const base = 10 ** exponent;
  const fraction = roughStep / base;
  if (fraction <= 1) return Math.max(1, base);
  if (fraction <= 2) return Math.max(1, 2 * base);
  if (fraction <= 5) return Math.max(1, 5 * base);
  return Math.max(1, 10 * base);
};
const buildIntegerYAxis = (rawMin, rawMax, segments = 4) => {
  let min = Number(rawMin);
  let max = Number(rawMax);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return {
      min: 0,
      max: 1,
      values: [1, 0]
    };
  }
  if (min > max) {
    const swap = min;
    min = max;
    max = swap;
  }
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  const step = resolveNiceIntegerStep(range, segments);
  let axisMin = Math.floor(min / step) * step;
  let axisMax = Math.ceil(max / step) * step;
  if (axisMin === axisMax) axisMax = axisMin + step;

  const values = [];
  for (let value = axisMax; value >= axisMin - step * 0.5; value -= step) {
    values.push(Math.round(value));
  }
  if (values.length < 2) values.push(Math.round(axisMin));

  return {
    min: axisMin,
    max: axisMax,
    values
  };
};
const formatTotalKwh = (value) => `${formatMetric(value)} kWh`;
const defaultTotalKwhLabel = readText(totalKwhLabel?.textContent) || "Total kWh";
const setTotalKwhSingle = (valueText, labelText = defaultTotalKwhLabel) => {
  if (totalKwhLabel) totalKwhLabel.textContent = labelText || defaultTotalKwhLabel;
  if (!totalKwhValue) return;
  totalKwhBox?.classList.remove("is-dual");
  totalKwhValue.classList.remove("meter-total-dual");
  totalKwhValue.textContent = valueText;
};
const setTotalKwhDual = ({
  energyIn = 0,
  energyOut = 0,
  unit = "kWh",
  summaryLabel = "สรุปพลังงาน"
} = {}) => {
  const resolvedUnit = readText(unit) || "kWh";
  if (totalKwhLabel) totalKwhLabel.textContent = readText(summaryLabel) || "สรุปพลังงาน";
  if (!totalKwhValue) return;
  totalKwhBox?.classList.add("is-dual");
  totalKwhValue.classList.add("meter-total-dual");
  totalKwhValue.innerHTML = `
    <span class="meter-total-card in">
      <span class="k">พลังงานที่ได้รับ</span>
      <span class="v">${escapeText(formatMetric(Math.max(0, parseNumber(energyIn))))} ${escapeText(
    resolvedUnit
  )}</span>
    </span>
    <span class="meter-total-card out">
      <span class="k">พลังงานที่จ่ายออก</span>
      <span class="v">${escapeText(formatMetric(Math.max(0, parseNumber(energyOut))))} ${escapeText(
    resolvedUnit
  )}</span>
    </span>
  `;
};
const datePartFormatterCache = new Map();
const getDatePartFormatter = (timeZone = chartTimeZone) => {
  const zone = readText(timeZone) || "Asia/Bangkok";
  const cacheKey = zone;
  const cached = datePartFormatterCache.get(cacheKey);
  if (cached) return cached;
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  } catch {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  }
  datePartFormatterCache.set(cacheKey, formatter);
  return formatter;
};
const toDate = (value) => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    const ms = asNumber > 1e12 ? asNumber : asNumber * 1000;
    const date = new Date(ms);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};
const getDatePartsInTimeZone = (value, timeZone = chartTimeZone) => {
  const date = value instanceof Date ? value : toDate(value);
  if (!date) return null;
  try {
    const parts = getDatePartFormatter(timeZone).formatToParts(date);
    const byType = {};
    parts.forEach((part) => {
      if (part?.type && part.type !== "literal") byType[part.type] = part.value;
    });
    const year = Number(byType.year);
    const month = Number(byType.month);
    const day = Number(byType.day);
    const hour = Number(byType.hour);
    const minute = Number(byType.minute);
    const second = Number(byType.second);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    return {
      year,
      month,
      day,
      hour: Number.isFinite(hour) ? hour : 0,
      minute: Number.isFinite(minute) ? minute : 0,
      second: Number.isFinite(second) ? second : 0
    };
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds()
    };
  }
};
const formatDateKey = (value, timeZone = chartTimeZone) => {
  const parts = getDatePartsInTimeZone(value, timeZone);
  if (!parts) return "";
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
};
const parseDateKeyParts = (value) => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
};
const summarizeMonthFromRows = (rows) => {
  const parsed = (Array.isArray(rows) ? rows : [])
    .map((row) => parseDateKeyParts(row?.dateKey))
    .filter(Boolean);
  if (!parsed.length) return "";
  const first = parsed[0];
  const last = parsed[parsed.length - 1];
  const sameMonth = parsed.every((item) => item.year === first.year && item.month === first.month);
  if (sameMonth) return `${first.year}-${pad2(first.month)}`;
  return `${first.year}-${pad2(first.month)} ถึง ${last.year}-${pad2(last.month)}`;
};
const summarizeCreatedAtRange = (rows, timeZone = chartTimeZone) => {
  const dates = (Array.isArray(rows) ? rows : [])
    .map((row) => toDate(readRowTimestampValue(row)))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());
  if (!dates.length) return "";
  const first = formatDateKey(dates[0], timeZone);
  const last = formatDateKey(dates[dates.length - 1], timeZone);
  if (!first || !last) return "";
  if (first === last) return first;
  return `${first} ถึง ${last}`;
};
const readRowDeviceId = (row) =>
  parseLoosePositiveId(
    readLooseValue(row, ["device_id", "deviceId", "meter_id", "meterId"])
  );
const readRowSiteId = (row) =>
  parseLoosePositiveId(
    readLooseValue(row, ["site_id", "siteId", "site"])
  );
const readRowSiteCodeKey = (row) =>
  normalizeIdentityToken(readLooseValue(row, ["site_code", "siteCode", "code"]));
const readRowSiteNameKey = (row) =>
  normalizeIdentityToken(readLooseValue(row, ["site_name", "siteName", "plant_name", "plantName"]));
const rowMatchesSelectedSite = (row) => {
  const rowSiteId = readRowSiteId(row);
  if (Number.isFinite(selectedSiteId) && selectedSiteId > 0 && Number.isFinite(rowSiteId)) {
    return rowSiteId === selectedSiteId;
  }

  const rowSiteCodeKey = readRowSiteCodeKey(row);
  if (selectedSiteCodeKey && rowSiteCodeKey) {
    return rowSiteCodeKey === selectedSiteCodeKey;
  }

  const rowSiteNameKey = readRowSiteNameKey(row);
  if (selectedSiteNameKey && rowSiteNameKey) {
    return rowSiteNameKey === selectedSiteNameKey;
  }

  return true;
};
const rowsContainExplicitDeviceId = (rows) =>
  (Array.isArray(rows) ? rows : []).some((row) => {
    const id = readRowDeviceId(row);
    return Number.isFinite(id) && id > 0;
  });
const rowMatchesSelectedMeter = (row, wantedDeviceId, options = {}) => {
  const strictDeviceId = Boolean(options.strictDeviceId);
  const ignoreMeterIdentity = options.ignoreMeterIdentity === true;
  const rowDeviceId = readRowDeviceId(row);
  const rowDeviceName = normalizeIdentityToken(
    readLooseValue(row, ["device_name", "deviceName", "meter_name", "meterName", "name"])
  );
  const rowDeviceSn = normalizeIdentityToken(
    readLooseValue(
      row,
      ["device_sn", "deviceSn", "sn", "serial", "modbus_address_in", "modbusAddressIn"]
    )
  );
  if (!rowMatchesSelectedSite(row)) return false;
  if (Number.isFinite(wantedDeviceId) && wantedDeviceId > 0) {
    if (Number.isFinite(rowDeviceId)) return rowDeviceId === wantedDeviceId;
    if (row?.__queryDeviceScoped === true) {
      const scopedId = parseLoosePositiveId(row.__queryDeviceId);
      if (Number.isFinite(scopedId) && scopedId > 0) return scopedId === wantedDeviceId;
    }
    if (strictDeviceId) return false;
    if (ignoreMeterIdentity) return true;
    if (selectedMeterSnKey && rowDeviceSn) return rowDeviceSn === selectedMeterSnKey;
    if (selectedMeterNameKey && rowDeviceName) return rowDeviceName === selectedMeterNameKey;
    return true;
  }
  if (ignoreMeterIdentity) {
    return true;
  }

  if (selectedMeterNameKey && rowDeviceName) {
    if (
      rowDeviceName === selectedMeterNameKey ||
      rowDeviceName.includes(selectedMeterNameKey) ||
      selectedMeterNameKey.includes(rowDeviceName)
    ) {
      return true;
    }
  }
  if (selectedMeterSnKey && rowDeviceSn) {
    if (
      rowDeviceSn === selectedMeterSnKey ||
      rowDeviceSn.includes(selectedMeterSnKey) ||
      selectedMeterSnKey.includes(rowDeviceSn)
    ) {
      return true;
    }
  }
  const rowDeviceTypeKey = normalizeKeyToken(
    readLooseValue(row, ["device_type", "deviceType", "type"])
  );
  if (selectedMeterTypeKey && rowDeviceTypeKey) {
    return rowDeviceTypeKey === selectedMeterTypeKey;
  }
  return true;
};
const setMeterLiveText = (text) => {
  if (!meterLiveValue) return;
  meterLiveValue.classList.remove("is-live-split");
  meterLiveValue.textContent = readText(text) || "-";
};
const setMeterLiveDual = ({ energyInText = "-", energyOutText = "-", timeText = "" } = {}) => {
  if (!meterLiveValue) return;
  meterLiveValue.classList.add("is-live-split");
  meterLiveValue.textContent = "";

  const inRow = document.createElement("span");
  inRow.className = "meter-live-row in";
  const inTag = document.createElement("span");
  inTag.className = "tag";
  inTag.textContent = "IN";
  const inValue = document.createElement("span");
  inValue.className = "value";
  inValue.textContent = energyInText;
  inRow.append(inTag, inValue);

  const outRow = document.createElement("span");
  outRow.className = "meter-live-row out";
  const outTag = document.createElement("span");
  outTag.className = "tag";
  outTag.textContent = "OUT";
  const outValue = document.createElement("span");
  outValue.className = "value";
  outValue.textContent = energyOutText;
  outRow.append(outTag, outValue);

  meterLiveValue.append(inRow, outRow);
  if (timeText) {
    const stamp = document.createElement("span");
    stamp.className = "meter-live-time";
    stamp.textContent = `อัปเดต ${timeText}`;
    meterLiveValue.append(stamp);
  }
};
const buildLiveQueryCandidates = () => {
  const queries = [];
  const hasMeterId = Number.isFinite(selectedMeterId) && selectedMeterId > 0;
  if (Number.isFinite(selectedSiteId) && selectedSiteId > 0) {
    if (hasMeterId) {
      queries.push(
        `site_id=${encodeURIComponent(selectedSiteId)}&device_id=${encodeURIComponent(
          selectedMeterId
        )}&period=live`
      );
      queries.push(
        `site_id=${encodeURIComponent(selectedSiteId)}&period=live&device_id=${encodeURIComponent(
          selectedMeterId
        )}`
      );
      return queries;
    }
    queries.push(`site_id=${encodeURIComponent(selectedSiteId)}&period=live`);
  }
  if (hasMeterId) {
    queries.push(`period=live&device_id=${encodeURIComponent(selectedMeterId)}`);
    return queries;
  }
  if (selectedEnergyName) {
    queries.push(`period=live&name=${encodeURIComponent(selectedEnergyName)}`);
  }
  return queries;
};
const extractLiveRows = (payload, context = {}) => {
  const scopedDeviceId = parseLoosePositiveId(context.scopedDeviceId);
  const annotateScopedRow = (row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return row;
    if (!Number.isFinite(scopedDeviceId) || scopedDeviceId <= 0) return row;
    return {
      ...row,
      __queryDeviceScoped: true,
      __queryDeviceId: scopedDeviceId
    };
  };
  const directRows = [];
  if (!payload || typeof payload !== "object") return [];
  const queue = [payload];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    if (rowHasEnergyInOut(current) || rowHasEnergyTotal(current)) {
      directRows.push(annotateScopedRow(current));
    }
    Object.values(current).forEach((value) => {
      if (value && typeof value === "object") queue.push(value);
    });
  }
  if (directRows.length) {
    const rowsWithTimestamp = directRows.filter((row) => {
      const stamp = toDateFromLiveTimestamp(row);
      return Boolean(stamp);
    });
    return rowsWithTimestamp.length ? rowsWithTimestamp : directRows;
  }
  const seriesRows = extractSeriesRows(payload, context);
  if (seriesRows.length) return seriesRows;
  const energyRows = extractEnergyRows(payload, context);
  if (energyRows.length) return energyRows;
  return [];
};
const resolveLatestLiveRow = (rows) => {
  const sourceRows = Array.isArray(rows) ? rows : [];
  if (!sourceRows.length) return null;
  const wantedDeviceId = Number(selectedMeterId);
  const strictDeviceId =
    Number.isFinite(wantedDeviceId) &&
    wantedDeviceId > 0 &&
    rowsContainExplicitDeviceId(sourceRows);

  const filterByMeter = (useStrictDeviceId) =>
    sourceRows.filter((row) =>
      rowMatchesSelectedMeter(row, wantedDeviceId, {
        strictDeviceId: useStrictDeviceId
      })
    );

  let scopedRows = filterByMeter(strictDeviceId);
  if (!scopedRows.length && strictDeviceId) {
    scopedRows = filterByMeter(false);
  }
  const candidates = scopedRows.length ? scopedRows : sourceRows;
  let latestWithStamp = null;
  let latestStampMs = -Infinity;
  let latestWithoutStamp = null;
  candidates.forEach((row) => {
    const hasAnyMetric =
      parseFiniteNumber(readSolarSeriesValue(row)) !== null ||
      parseFiniteNumber(readGridSeriesValue(row)) !== null ||
      parseFiniteNumber(readEnergyTotalValue(row)) !== null;
    if (!hasAnyMetric) return;
    latestWithoutStamp = row;
    const stamp = toDateFromLiveTimestamp(row);
    const stampMs = stamp ? stamp.getTime() : NaN;
    if (Number.isFinite(stampMs) && stampMs >= latestStampMs) {
      latestWithStamp = row;
      latestStampMs = stampMs;
    }
  });
  return latestWithStamp || latestWithoutStamp;
};
const resolveLatestLiveSummary = (rows) => {
  const latestLiveRow = resolveLatestLiveRow(rows);
  if (latestLiveRow) {
    const energyIn = parseFiniteNumber(readSolarSeriesValue(latestLiveRow));
    const energyOut = parseFiniteNumber(readGridSeriesValue(latestLiveRow));
    const energyTotal = parseFiniteNumber(readEnergyTotalValue(latestLiveRow));
    const stamp = toDateFromLiveTimestamp(latestLiveRow);
    const stampMs = stamp ? stamp.getTime() : null;
    if (energyIn !== null || energyOut !== null) {
      return {
        mode: "dual",
        energyIn,
        energyOut,
        stampMs
      };
    }
    if (energyTotal !== null) {
      return {
        mode: "single",
        energyKwh: energyTotal,
        stampMs
      };
    }
  }
  const seriesRows = normalizeChartRows(rows, {
    period: "day",
    limit: 0,
    deviceId: selectedMeterId,
    forceDualMetrics: true
  });
  const latestSeries = [...seriesRows]
    .reverse()
    .find((row) => parseFiniteNumber(row?.solarIn) !== null || parseFiniteNumber(row?.selfUse) !== null);
  if (latestSeries) {
    return {
      mode: "dual",
      energyIn: parseFiniteNumber(latestSeries.solarIn),
      energyOut: parseFiniteNumber(latestSeries.selfUse),
      stampMs: Number.isFinite(Number(latestSeries.stampMs)) ? Number(latestSeries.stampMs) : null
    };
  }
  const energyRows = normalizeDailyEnergyRows(rows, { deviceId: selectedMeterId });
  const latestEnergy = [...energyRows]
    .reverse()
    .find((row) => parseFiniteNumber(row?.energyKwh) !== null);
  if (latestEnergy) {
    return {
      mode: "single",
      energyKwh: parseFiniteNumber(latestEnergy.energyKwh),
      stampMs: Number.isFinite(Number(latestEnergy.stampMs)) ? Number(latestEnergy.stampMs) : null
    };
  }
  return null;
};
const formatLiveStamp = (stampMs) => {
  if (!Number.isFinite(Number(stampMs))) return "";
  const parts = getDatePartsInTimeZone(Number(stampMs), chartTimeZone);
  if (!parts) return "";
  return `${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
};
const applyMeterLiveSummary = (summary) => {
  if (!summary || typeof summary !== "object") {
    setMeterLiveText("-");
    return;
  }
  const timeText = formatLiveStamp(summary.stampMs);
  if (summary.mode === "dual") {
    const inText =
      summary.energyIn === null || summary.energyIn === undefined
        ? "-"
        : `${formatMetric(Math.max(0, summary.energyIn))} kWh`;
    const outText =
      summary.energyOut === null || summary.energyOut === undefined
        ? "-"
        : `${formatMetric(Math.max(0, summary.energyOut))} kWh`;
    setMeterLiveDual({
      energyInText: inText,
      energyOutText: outText,
      timeText
    });
    return;
  }
  if (summary.mode === "single" && summary.energyKwh !== null && summary.energyKwh !== undefined) {
    const suffix = timeText ? ` • ${timeText}` : "";
    setMeterLiveText(`${formatMetric(Math.max(0, summary.energyKwh))} kWh${suffix}`);
    return;
  }
  setMeterLiveText("-");
};
const refreshMeterLiveSummary = async () => {
  if (!meterLiveValue) return;
  const token = Date.now() + Math.random();
  meterLiveRequestToken = token;
  if (!meterLiveInitialized) setMeterLiveText("กำลังโหลด...");
  try {
    const queries = buildLiveQueryCandidates();
    if (!queries.length) {
      setMeterLiveText("-");
      meterLiveInitialized = true;
      return;
    }
    const rows = await requestRowsFromCandidates(
      queries,
      extractLiveRows,
      energyApiCandidates
    );
    if (meterLiveRequestToken !== token) return;
    const summary = resolveLatestLiveSummary(rows);
    applyMeterLiveSummary(summary);
    meterLiveInitialized = true;
  } catch {
    if (meterLiveRequestToken !== token) return;
    setMeterLiveText("-");
    meterLiveInitialized = true;
  }
};
const stopMeterLivePolling = () => {
  if (!meterLivePollTimer) return;
  window.clearInterval(meterLivePollTimer);
  meterLivePollTimer = null;
};
const startMeterLivePolling = () => {
  if (!meterLiveValue) return;
  stopMeterLivePolling();
  refreshMeterLiveSummary();
  meterLivePollTimer = window.setInterval(() => {
    if (document.hidden) return;
    refreshMeterLiveSummary();
  }, meterLivePollIntervalMs);
};
const resolveRowDateKey = (row) => {
  const explicit = normalizeDateKey(readLooseValue(row, ["date", "day"]));
  if (explicit) return explicit;
  const stamp = toDate(readRowTimestampValue(row));
  return stamp ? formatDateKey(stamp, chartTimeZone) : "";
};
const resolveYearMonthIndexFromLabel = (value) => {
  const text = readText(value);
  if (!text) return null;
  const normalized = text.toLowerCase();
  const numericMatch = normalized.match(/(\d{1,2})/);
  if (numericMatch) {
    const month = Number(numericMatch[1]);
    if (Number.isFinite(month) && month >= 1 && month <= 12) return month;
  }
  const fullIndex = thaiMonthFull.findIndex((label) => normalized.includes(label.toLowerCase()));
  if (fullIndex >= 0) return fullIndex + 1;
  const shortIndex = thaiMonthShort.findIndex((label) => normalized.includes(label.toLowerCase()));
  if (shortIndex >= 0) return shortIndex + 1;
  return null;
};
const resolveDayIndexFromLabel = (value) => {
  const text = readText(value);
  if (!text) return null;
  const numericMatch = text.match(/(\d{1,2})/);
  if (!numericMatch) return null;
  const day = Number(numericMatch[1]);
  return Number.isFinite(day) && day >= 1 && day <= 31 ? day : null;
};
const resolveRowDayForMonth = (row) => {
  const direct = Number(
    readLooseValue(row, ["day", "day_no", "dayNo", "day_of_month", "dayOfMonth"])
  );
  if (Number.isFinite(direct) && direct >= 1 && direct <= 31) return Math.trunc(direct);
  return resolveDayIndexFromLabel(
    readLooseValue(row, ["label", "day_label", "dayLabel"])
  );
};
const resolveRowMonthForYear = (row) => {
  const direct = Number(
    readLooseValue(row, ["month", "month_no", "monthNo", "month_index", "monthIndex"])
  );
  if (Number.isFinite(direct) && direct >= 1 && direct <= 12) return Math.trunc(direct);
  return resolveYearMonthIndexFromLabel(
    readLooseValue(row, ["label", "month_label", "monthLabel"])
  );
};
const resolveRowYearForYear = (row, fallbackYear = NaN) => {
  const direct = Number(readLooseValue(row, ["year"]));
  if (Number.isFinite(direct) && direct > 0) return Math.trunc(direct);
  const explicitDateKey = normalizeDateKey(readLooseValue(row, ["date", "day"]));
  const explicitParts = parseDateKeyParts(explicitDateKey);
  if (Number.isFinite(explicitParts?.year)) return Number(explicitParts.year);
  const stamp = toDate(readRowTimestampValue(row));
  const stampParts = getDatePartsInTimeZone(stamp, chartTimeZone);
  if (Number.isFinite(stampParts?.year)) return Number(stampParts.year);
  if (Number.isFinite(Number(fallbackYear)) && Number(fallbackYear) > 0) {
    return Math.trunc(Number(fallbackYear));
  }
  return NaN;
};
const formatAxisLabel = ({ dateKey, stampMs }, period, idx) => {
  const keyParts = parseDateKeyParts(dateKey);
  if (period === "day") {
    const date = stampMs ? new Date(stampMs) : toDate(dateKey);
    if (date) {
      const parts = getDatePartsInTimeZone(date, chartTimeZone);
      if (parts) return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
    }
    return dateKey || `#${idx + 1}`;
  }
  if (period === "month") {
    if (keyParts) return `${pad2(keyParts.day)}/${pad2(keyParts.month)}`;
    const parts = getDatePartsInTimeZone(stampMs, chartTimeZone);
    if (parts) return `${pad2(parts.day)}/${pad2(parts.month)}`;
    return dateKey || `#${idx + 1}`;
  }
  if (period === "year") {
    if (keyParts) return `${pad2(keyParts.day)} ${thaiMonthShort[keyParts.month - 1]}`;
    const parts = getDatePartsInTimeZone(stampMs, chartTimeZone);
    if (parts) return `${pad2(parts.day)} ${thaiMonthShort[parts.month - 1]}`;
    return dateKey || `#${idx + 1}`;
  }
  return dateKey || `#${idx + 1}`;
};
const rowHasSeries = (row) =>
  row &&
  typeof row === "object" &&
  !Array.isArray(row) &&
  (readSolarSeriesValue(row) !== null || readGridSeriesValue(row) !== null);
const rowHasEnergyInOut = (row) =>
  row &&
  typeof row === "object" &&
  !Array.isArray(row) &&
  (readLooseNumber(row, ["energy_in", "energyIn", "value_in", "valueIn"]) !== null ||
    readLooseNumber(row, ["energy_out", "energyOut", "value_out", "valueOut"]) !== null);
const rowsContainEnergyInOut = (rows) =>
  (Array.isArray(rows) ? rows : []).some((row) => rowHasEnergyInOut(row));
const rowHasEnergyTotal = (row) =>
  row &&
  typeof row === "object" &&
  !Array.isArray(row) &&
  readEnergyTotalValue(row) !== null;
const rowHasTemporalHint = (row) =>
  row &&
  typeof row === "object" &&
  !Array.isArray(row) &&
  Boolean(
    readRowTimestampValue(row) ||
      readLooseValue(row, ["date", "day", "label", "hour", "month", "year"])
  );
const extractSummaryMeta = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  const candidates = [];
  if (!Array.isArray(payload)) candidates.push(payload);
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    candidates.push(payload.data);
  }
  if (payload.result && typeof payload.result === "object" && !Array.isArray(payload.result)) {
    candidates.push(payload.result);
  }
  for (let idx = 0; idx < candidates.length; idx += 1) {
    const candidate = candidates[idx];
    const summary = candidate?.summary;
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) continue;
    const unit = readText(readLooseValue(summary, ["unit"]));
    const energyIn = readLooseNumber(summary, [
      "energy_in",
      "energyIn",
      "value_in",
      "valueIn"
    ]);
    const energyOut = readLooseNumber(summary, [
      "energy_out",
      "energyOut",
      "value_out",
      "valueOut"
    ]);
    if (unit || energyIn !== null || energyOut !== null) {
      return { unit, energyIn, energyOut };
    }
  }
  return null;
};
const attachSummaryMetaToRows = (rows, meta) => {
  if (Array.isArray(rows) && meta && typeof meta === "object") {
    rows.__summaryMeta = meta;
  }
  return rows;
};
const extractTimeseriesRows = (payload, scopedDeviceId = null) => {
  if (!payload || typeof payload !== "object") return [];
  const queue = [payload];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    const period = normalizeIdentityToken(readLooseValue(current, ["period"]));
    const timeseries = Array.isArray(current.timeseries) ? current.timeseries : [];
    const hasPeriodHint = period === "day" || period === "month" || period === "year";
    const hasDateHint = Boolean(
      readLooseValue(current, ["date", "day", "month", "year"])
    );
    if (timeseries.length && (hasPeriodHint || hasDateHint)) {
      const baseDate = normalizeDateKey(readLooseValue(current, ["date", "day"]));
      const baseMonthTokenRaw = readText(readLooseValue(current, ["month"]));
      const baseMonthTokenMatch = baseMonthTokenRaw.match(/^(\d{4})-(\d{2})$/);
      const baseYear = parseLoosePositiveId(readLooseValue(current, ["year"]));
      const baseSiteId = parseLoosePositiveId(readLooseValue(current, ["site_id", "siteId"]));
      const summaryMeta = extractSummaryMeta(current);
      return timeseries
        .filter((row) => row && typeof row === "object" && !Array.isArray(row))
        .map((row) => {
          const next = { ...row };
          const existingDate = normalizeDateKey(readLooseValue(next, ["date", "day"]));
          let dateKey = existingDate || baseDate;
          if (!dateKey && period === "month" && baseMonthTokenMatch) {
            const rowDay = resolveRowDayForMonth(next);
            if (Number.isFinite(rowDay) && rowDay >= 1 && rowDay <= 31) {
              dateKey = `${baseMonthTokenMatch[1]}-${baseMonthTokenMatch[2]}-${pad2(
                Math.trunc(rowDay)
              )}`;
            }
          }
          if (!dateKey && period === "year") {
            const rowMonth = resolveRowMonthForYear(next);
            const rowYear = Number.isFinite(baseYear)
              ? Math.trunc(baseYear)
              : resolveRowYearForYear(next);
            if (
              Number.isFinite(rowMonth) &&
              rowMonth >= 1 &&
              rowMonth <= 12 &&
              Number.isFinite(rowYear) &&
              rowYear > 0
            ) {
              dateKey = `${Math.trunc(rowYear)}-${pad2(Math.trunc(rowMonth))}-01`;
            }
          }
          if (dateKey && !existingDate) next.date = dateKey;
          const existingStamp = readRowTimestampValue(next);
          if (!existingStamp && dateKey && period === "day") {
            const rawHour = Number(readLooseValue(next, ["hour"]));
            const label = readText(readLooseValue(next, ["label", "time", "time_label", "timeLabel"]));
            let hh = Number.isFinite(rawHour) ? Math.trunc(rawHour) : NaN;
            let mm = 0;
            if (!Number.isFinite(hh)) {
              const match = label.match(/(\d{1,2}):(\d{2})/);
              if (match) {
                hh = Number(match[1]);
                mm = Number(match[2]);
              }
            }
            if (Number.isFinite(hh) && hh >= 0 && hh <= 23) {
              const safeMinute = Number.isFinite(mm) && mm >= 0 && mm <= 59 ? mm : 0;
              next.datetime = `${dateKey}T${pad2(hh)}:${pad2(safeMinute)}:00`;
            }
          }
          if (baseSiteId && !readLooseValue(next, ["site_id", "siteId"])) {
            next.site_id = baseSiteId;
          }
          if (summaryMeta?.unit && !readLooseValue(next, ["unit"])) {
            next.unit = summaryMeta.unit;
          }
          if (summaryMeta?.energyIn !== null && summaryMeta?.energyIn !== undefined) {
            next.summary_energy_in = summaryMeta.energyIn;
          }
          if (summaryMeta?.energyOut !== null && summaryMeta?.energyOut !== undefined) {
            next.summary_energy_out = summaryMeta.energyOut;
          }
          if (Number.isFinite(scopedDeviceId) && scopedDeviceId > 0) {
            next.__queryDeviceScoped = true;
            next.__queryDeviceId = scopedDeviceId;
          }
          return next;
        });
    }
    Object.values(current).forEach((value) => {
      if (value && typeof value === "object") queue.push(value);
    });
  }
  return [];
};
const extractSeriesRows = (payload, context = {}) => {
  if (!payload || typeof payload !== "object") return [];
  const scopedDeviceId = parseLoosePositiveId(context.scopedDeviceId);
  const timeseriesRows = extractTimeseriesRows(payload, scopedDeviceId);
  if (timeseriesRows.length) return timeseriesRows;
  const queue = [payload];
  const rows = [];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    if (rowHasSeries(current) && rowHasTemporalHint(current)) {
      if (Number.isFinite(scopedDeviceId) && scopedDeviceId > 0) {
        rows.push({
          ...current,
          __queryDeviceScoped: true,
          __queryDeviceId: scopedDeviceId
        });
      } else {
        rows.push(current);
      }
    }
    Object.values(current).forEach((value) => {
      if (value && typeof value === "object") queue.push(value);
    });
  }
  return rows;
};
const extractEnergyRows = (payload, context = {}) => {
  if (!payload || typeof payload !== "object") return [];
  const scopedDeviceId = parseLoosePositiveId(context.scopedDeviceId);
  const timeseriesRows = extractTimeseriesRows(payload, scopedDeviceId);
  if (timeseriesRows.length) return timeseriesRows;
  const queue = [payload];
  const rows = [];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    if (rowHasEnergyTotal(current) && rowHasTemporalHint(current)) {
      if (Number.isFinite(scopedDeviceId) && scopedDeviceId > 0) {
        rows.push({
          ...current,
          __queryDeviceScoped: true,
          __queryDeviceId: scopedDeviceId
        });
      } else {
        rows.push(current);
      }
    }
    Object.values(current).forEach((value) => {
      if (value && typeof value === "object") queue.push(value);
    });
  }
  return rows;
};
const normalizeMonthlyEnergyRows = (
  rows,
  { year, month, deviceId, ignoreMeterIdentity = false } = {}
) => {
  const targetYear = Number(year);
  const targetMonth = Number(month);
  const wantedDeviceId = Number(deviceId);
  const sourceRows = Array.isArray(rows) ? rows : [];
  const strictDeviceId =
    Number.isFinite(wantedDeviceId) &&
    wantedDeviceId > 0 &&
    rowsContainExplicitDeviceId(sourceRows);

  const normalizeWithFilterMode = (useStrictDeviceId) => {
    const normalized = sourceRows
      .map((row, idx) => {
        const dayIndex = resolveRowDayForMonth(row);
        const resolvedDateKey = (() => {
          const direct = resolveRowDateKey(row);
          if (direct) return direct;
          if (
            Number.isFinite(targetYear) &&
            Number.isFinite(targetMonth) &&
            Number.isFinite(dayIndex) &&
            dayIndex >= 1 &&
            dayIndex <= 31
          ) {
            return `${targetYear}-${pad2(targetMonth)}-${pad2(dayIndex)}`;
          }
          return "";
        })();
        const directStamp = toDate(readRowTimestampValue(row));
        const fallbackDate = resolvedDateKey
          ? toDate(`${resolvedDateKey}T00:00:00`)
          : null;
        const stamp = directStamp || fallbackDate;
        const energyTotal = readEnergyTotalValue(row);
        const stampParts = getDatePartsInTimeZone(stamp, chartTimeZone);
        const dateParts = parseDateKeyParts(resolvedDateKey);
        const resolvedYear = Number.isFinite(stampParts?.year)
          ? Number(stampParts.year)
          : Number(dateParts?.year);
        const resolvedMonth = Number.isFinite(stampParts?.month)
          ? Number(stampParts.month)
          : Number(dateParts?.month);
        if (!stamp || energyTotal === null) return null;
        if (
          Number.isFinite(targetYear) &&
          Number.isFinite(resolvedYear) &&
          resolvedYear !== targetYear
        ) {
          return null;
        }
        if (
          Number.isFinite(targetMonth) &&
          Number.isFinite(resolvedMonth) &&
          resolvedMonth !== targetMonth
        ) {
          return null;
        }
        if (
          !rowMatchesSelectedMeter(row, wantedDeviceId, {
            strictDeviceId: useStrictDeviceId,
            ignoreMeterIdentity
          })
        ) {
          return null;
        }
        return {
          idx,
          stampMs: stamp.getTime(),
          dateKey: resolvedDateKey || formatDateKey(stamp, chartTimeZone),
          energyTotal
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.stampMs - b.stampMs);

    const perDay = new Map();
    normalized.forEach((row) => {
      const current = perDay.get(row.dateKey);
      if (!current) {
        perDay.set(row.dateKey, {
          dateKey: row.dateKey,
          stampMs: row.stampMs,
          min: row.energyTotal,
          max: row.energyTotal,
          count: 1
        });
        return;
      }
      current.stampMs = Math.max(current.stampMs, row.stampMs);
      current.min = Math.min(current.min, row.energyTotal);
      current.max = Math.max(current.max, row.energyTotal);
      current.count += 1;
    });

    return Array.from(perDay.values())
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .map((row, idx) => ({
        idx,
        stampMs: row.stampMs,
        dateKey: row.dateKey,
        label: formatAxisLabel(
          { dateKey: row.dateKey, stampMs: row.stampMs },
          "month",
          idx
        ),
        energyKwh: row.count > 1
          ? Math.max(0, row.max - row.min)
          : Math.max(0, row.max)
      }));
  };

  const strictResult = normalizeWithFilterMode(strictDeviceId);
  if (strictResult.length || !strictDeviceId) return strictResult;
  if (Number.isFinite(wantedDeviceId) && wantedDeviceId > 0) return [];
  return normalizeWithFilterMode(false);
};
const normalizeDailyEnergyRows = (rows, { dateKey, deviceId } = {}) => {
  const targetDate = normalizeDateKey(dateKey);
  const wantedDeviceId = Number(deviceId);
  const sourceRows = Array.isArray(rows) ? rows : [];
  const strictDeviceId =
    Number.isFinite(wantedDeviceId) &&
    wantedDeviceId > 0 &&
    rowsContainExplicitDeviceId(sourceRows);

  const normalizeWithFilterMode = (useStrictDeviceId) => {
    const normalized = sourceRows
      .map((row, idx) => {
        const explicitDateKey = resolveRowDateKey(row);
        const stamp = toDate(readRowTimestampValue(row));
        const pointDateKey = explicitDateKey || (stamp ? formatDateKey(stamp, chartTimeZone) : "");
        const energyTotal = readEnergyTotalValue(row);
        if (energyTotal === null) return null;
        if (targetDate && pointDateKey && normalizeDateKey(pointDateKey) !== targetDate) {
          return null;
        }
        if (
          !rowMatchesSelectedMeter(row, wantedDeviceId, {
            strictDeviceId: useStrictDeviceId
          })
        ) {
          return null;
        }
        const stampMs = stamp ? stamp.getTime() : null;
        return {
          idx,
          stampMs,
          dateKey: pointDateKey || targetDate,
          energyKwh: Math.max(0, energyTotal)
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.stampMs === null && b.stampMs === null) return a.idx - b.idx;
        if (a.stampMs === null) return 1;
        if (b.stampMs === null) return -1;
        return a.stampMs - b.stampMs;
      });
    return normalized.map((row, idx) => ({
      ...row,
      label: formatAxisLabel(
        {
          dateKey: row.dateKey,
          stampMs: row.stampMs
        },
        "day",
        idx
      )
    }));
  };

  const strictResult = normalizeWithFilterMode(strictDeviceId);
  if (strictResult.length || !strictDeviceId) return strictResult;
  if (Number.isFinite(wantedDeviceId) && wantedDeviceId > 0) return [];
  return normalizeWithFilterMode(false);
};
const normalizeChartRows = (
  rows,
  {
    period = "month",
    limit = 120,
    deviceId = selectedMeterId,
    ignoreMeterIdentity = false,
    forceDualMetrics = false,
    fallbackYear = NaN,
    fallbackMonth = NaN
  } = {}
) => {
  const wantedDeviceId = Number(deviceId);
  const sourceRows = Array.isArray(rows) ? rows : [];
  const strictDeviceId =
    Number.isFinite(wantedDeviceId) &&
    wantedDeviceId > 0 &&
    rowsContainExplicitDeviceId(sourceRows);
  const shouldForceSingleMetric =
    Number.isFinite(wantedDeviceId) && wantedDeviceId > 0 && !forceDualMetrics;
  const preferSolarMetric = selectedMeterTypeKey.includes("solar");

  const normalizeWithFilterMode = (useStrictDeviceId) => {
    const normalized = sourceRows
      .map((row, idx) => {
        if (
          !rowMatchesSelectedMeter(row, wantedDeviceId, {
            strictDeviceId: useStrictDeviceId,
            ignoreMeterIdentity
          })
        ) {
          return null;
        }
        let dateKey = resolveRowDateKey(row);
        if (!dateKey && period === "month") {
          const dayValue = resolveRowDayForMonth(row);
          if (
            Number.isFinite(dayValue) &&
            dayValue >= 1 &&
            dayValue <= 31 &&
            Number.isFinite(Number(fallbackYear)) &&
            Number(fallbackYear) > 0 &&
            Number.isFinite(Number(fallbackMonth)) &&
            Number(fallbackMonth) >= 1 &&
            Number(fallbackMonth) <= 12
          ) {
            dateKey = `${Math.trunc(Number(fallbackYear))}-${pad2(
              Math.trunc(Number(fallbackMonth))
            )}-${pad2(dayValue)}`;
          }
        }
        if (!dateKey && period === "year") {
          const monthValue = resolveRowMonthForYear(row);
          const yearValue = resolveRowYearForYear(row, fallbackYear);
          if (
            Number.isFinite(monthValue) &&
            monthValue >= 1 &&
            monthValue <= 12 &&
            Number.isFinite(yearValue) &&
            yearValue > 0
          ) {
            dateKey = `${yearValue}-${pad2(monthValue)}-01`;
          }
        }
        const directStamp = toDate(readRowTimestampValue(row));
        const stamp = directStamp || (dateKey ? toDate(`${dateKey}T00:00:00`) : null);
        const rawSolarValue = readSolarSeriesValue(row);
        const rawSelfUseValue = readGridSeriesValue(row);
        let solarInValue = rawSolarValue;
        let selfUseValue = rawSelfUseValue;
        if (shouldForceSingleMetric) {
          const hasSolarValue = rawSolarValue !== null;
          const hasSelfUseValue = rawSelfUseValue !== null;
          const useSolarValue =
            (preferSolarMetric && (hasSolarValue || !hasSelfUseValue)) ||
            (!hasSelfUseValue && hasSolarValue);
          if (useSolarValue) {
            selfUseValue = null;
          } else {
            solarInValue = null;
          }
        } else {
          solarInValue = rawSolarValue ?? 0;
          selfUseValue = rawSelfUseValue ?? 0;
        }
        return {
          idx,
          stampMs: stamp ? stamp.getTime() : null,
          dateKey,
          label: formatAxisLabel(
            { dateKey, stampMs: stamp ? stamp.getTime() : null },
            period,
            idx
          ),
          solarIn: solarInValue,
          selfUse: selfUseValue
        };
      })
      .filter(Boolean);

    normalized.sort((a, b) => {
      const left = a.stampMs;
      const right = b.stampMs;
      if (left === null && right === null) return a.idx - b.idx;
      if (left === null) return 1;
      if (right === null) return -1;
      return left - right;
    });

    const deduped = [];
    normalized.forEach((row) => {
      const prevIdx = deduped.length - 1;
      const prev = deduped[prevIdx];
      if (
        prev &&
        prev.dateKey === row.dateKey &&
        prev.solarIn === row.solarIn &&
        prev.selfUse === row.selfUse
      ) {
        // Keep the latest timestamp for identical values so "live updated time"
        // reflects the most recent API reading instead of the first duplicate.
        deduped[prevIdx] = row;
        return;
      }
      deduped.push(row);
    });

    return limit > 0 ? deduped.slice(-limit) : deduped;
  };

  const strictResult = normalizeWithFilterMode(strictDeviceId);
  if (strictResult.length || !strictDeviceId) return strictResult;
  if (Number.isFinite(wantedDeviceId) && wantedDeviceId > 0) return [];
  return normalizeWithFilterMode(false);
};
const aggregateYearSeriesRowsByMonth = (rows, { year } = {}) => {
  const targetYear = Number(year);
  const monthly = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    if (!row || typeof row !== "object") return;
    const keyParts = parseDateKeyParts(row.dateKey);
    let pointYear = NaN;
    let pointMonth = NaN;
    if (keyParts) {
      pointYear = keyParts.year;
      pointMonth = keyParts.month;
    } else {
      const stampValue =
        Number.isFinite(Number(row.stampMs)) && Number(row.stampMs) > 0
          ? Number(row.stampMs)
          : row.dateKey;
      const stampParts = getDatePartsInTimeZone(stampValue, chartTimeZone);
      if (!stampParts) return;
      pointYear = stampParts.year;
      pointMonth = stampParts.month;
    }
    if (!Number.isFinite(pointYear) || !Number.isFinite(pointMonth)) return;
    if (Number.isFinite(targetYear) && pointYear !== targetYear) return;
    if (pointMonth < 1 || pointMonth > 12) return;
    const monthKey = `${pointYear}-${pad2(pointMonth)}`;
    const current = monthly.get(monthKey) || {
      year: pointYear,
      month: pointMonth,
      solarIn: 0,
      selfUse: 0
    };
    current.solarIn += parseNumber(row.solarIn);
    current.selfUse += parseNumber(row.selfUse);
    monthly.set(monthKey, current);
  });
  const firstRow = Array.from(monthly.values())[0];
  const resolvedYear =
    Number.isFinite(targetYear) && targetYear > 0
      ? targetYear
      : Number(firstRow?.year) > 0
        ? Number(firstRow.year)
        : new Date().getFullYear();
  return Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1;
    const monthKey = `${resolvedYear}-${pad2(month)}`;
    const row = monthly.get(monthKey) || null;
    const stamp = toDate(`${resolvedYear}-${pad2(month)}-01T00:00:00`);
    return {
      idx,
      stampMs: stamp ? stamp.getTime() : null,
      dateKey: `${resolvedYear}-${pad2(month)}-01`,
      label: thaiMonthShort[month - 1] || `เดือน ${month}`,
      solarIn: row ? row.solarIn : null,
      selfUse: row ? row.selfUse : null
    };
  });
};
const fullDayHourLabels = Array.from({ length: 24 }, (_, hour) => `${pad2(hour)}:00`);
const parseHourFromValue = (value) => {
  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) {
    const normalized = Math.trunc(asNumber);
    if (normalized >= 0 && normalized <= 23) return normalized;
  }
  const text = readText(value);
  if (!text) return null;
  const match = text.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;
  return Math.trunc(hour);
};
const resolveHourFromRow = (row) => {
  if (!row || typeof row !== "object") return null;
  const directHour = parseHourFromValue(readLooseValue(row, ["hour"]));
  if (Number.isFinite(directHour)) return directHour;

  const labelHour = parseHourFromValue(row.label);
  if (Number.isFinite(labelHour)) return labelHour;

  const stampValue =
    Number.isFinite(Number(row.stampMs)) && Number(row.stampMs) > 0
      ? Number(row.stampMs)
      : readRowTimestampValue(row);
  const parts = getDatePartsInTimeZone(stampValue, chartTimeZone);
  if (!parts || !Number.isFinite(parts.hour)) return null;
  const hour = Math.trunc(parts.hour);
  return hour >= 0 && hour <= 23 ? hour : null;
};
const resolveDayKeyForHourRows = (rows, fallbackDateKey = "") => {
  const fallback = normalizeDateKey(fallbackDateKey);
  if (fallback) return fallback;
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = normalizeDateKey(
      row?.dateKey || readLooseValue(row, ["date", "day"])
    );
    if (key) return key;
  }
  return "";
};
const buildHourStampMs = (dateKey, hour) => {
  const normalizedDate = normalizeDateKey(dateKey);
  if (!normalizedDate) return null;
  const stamp = toDate(`${normalizedDate}T${pad2(hour)}:00:00`);
  return stamp ? stamp.getTime() : null;
};
const resolveVisibleHourLimitForDateKey = (dateKey) => {
  const normalizedDate = normalizeDateKey(dateKey);
  if (!normalizedDate) return null;
  const todayKey = formatDateKey(new Date(), chartTimeZone);
  if (!todayKey || normalizedDate !== todayKey) return null;
  const nowParts = getDatePartsInTimeZone(new Date(), chartTimeZone);
  const hour = Number(nowParts?.hour);
  if (!Number.isFinite(hour)) return null;
  const normalizedHour = Math.trunc(hour);
  if (normalizedHour < 0 || normalizedHour > 23) return null;
  return normalizedHour;
};
const normalizeRowsForFullDayXAxis = (rows, options = {}) => {
  const mode = options.mode === "energy" ? "energy" : "series";
  const sourceRows = Array.isArray(rows) ? rows : [];
  if (!sourceRows.length) return [];

  const axisHourLabels = fullDayHourLabels;
  const targetDateKey = resolveDayKeyForHourRows(sourceRows, options.dateKey);
  const visibleHourLimit = resolveVisibleHourLimitForDateKey(targetDateKey);
  const buckets = Array.from({ length: axisHourLabels.length }, () => []);
  sourceRows.forEach((row) => {
    const hour = resolveHourFromRow(row);
    if (!Number.isFinite(hour)) return;
    if (hour < 0 || hour > 23) return;
    buckets[hour].push(row);
  });

  if (mode === "energy") {
    return axisHourLabels.map((label, hour) => {
      const isFutureHour =
        Number.isFinite(visibleHourLimit) && hour > visibleHourLimit;
      const bucket = buckets[hour];
      let chosen = null;
      if (!isFutureHour) {
        bucket.forEach((row) => {
          if (!chosen) {
            chosen = row;
            return;
          }
          const left = Number(chosen?.stampMs);
          const right = Number(row?.stampMs);
          if (Number.isFinite(right) && (!Number.isFinite(left) || right >= left)) {
            chosen = row;
          }
        });
      }
      const rawStamp = Number(chosen?.stampMs);
      const stampMs =
        Number.isFinite(rawStamp) && rawStamp > 0
          ? rawStamp
          : buildHourStampMs(targetDateKey, hour);
      const dateKey = normalizeDateKey(chosen?.dateKey) || targetDateKey;
      const energyValue = parseFiniteNumber(chosen?.energyKwh);
      return {
        idx: hour,
        stampMs,
        dateKey,
        label,
        energyKwh: Number.isFinite(energyValue) ? Math.max(0, energyValue) : null
      };
    });
  }

  return axisHourLabels.map((label, hour) => {
    const isFutureHour =
      Number.isFinite(visibleHourLimit) && hour > visibleHourLimit;
    const bucket = buckets[hour];
    let solarSum = 0;
    let solarCount = 0;
    let selfUseSum = 0;
    let selfUseCount = 0;
    let latestStampMs = null;
    let dateKey = targetDateKey;

    if (!isFutureHour) {
      bucket.forEach((row) => {
        const solarValue = parseFiniteNumber(row?.solarIn);
        if (Number.isFinite(solarValue)) {
          solarSum += solarValue;
          solarCount += 1;
        }
        const selfUseValue = parseFiniteNumber(row?.selfUse);
        if (Number.isFinite(selfUseValue)) {
          selfUseSum += selfUseValue;
          selfUseCount += 1;
        }
        const rawStamp = Number(row?.stampMs);
        if (Number.isFinite(rawStamp) && rawStamp > 0) {
          latestStampMs = Number.isFinite(latestStampMs)
            ? Math.max(latestStampMs, rawStamp)
            : rawStamp;
        }
        if (!dateKey) {
          const rowDateKey = normalizeDateKey(row?.dateKey);
          if (rowDateKey) dateKey = rowDateKey;
        }
      });
    }

    return {
      idx: hour,
      stampMs: Number.isFinite(latestStampMs) ? latestStampMs : buildHourStampMs(dateKey, hour),
      dateKey,
      label,
      solarIn: solarCount > 0 ? solarSum / solarCount : null,
      selfUse: selfUseCount > 0 ? selfUseSum / selfUseCount : null
    };
  });
};
const normalizeRowsForFullMonthXAxis = (rows, options = {}) => {
  const mode = options.mode === "energy" ? "energy" : "series";
  const targetYear = Number(options.year);
  const targetMonth = Number(options.month);
  if (!Number.isFinite(targetYear) || !Number.isFinite(targetMonth)) {
    return Array.isArray(rows) ? rows : [];
  }
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
  if (!Number.isFinite(daysInMonth) || daysInMonth < 1) {
    return Array.isArray(rows) ? rows : [];
  }

  const sourceRows = Array.isArray(rows) ? rows : [];
  const byDay = new Map();
  sourceRows.forEach((row) => {
    if (!row || typeof row !== "object") return;
    const keyParts = parseDateKeyParts(row.dateKey);
    const stampParts = keyParts
      ? null
      : getDatePartsInTimeZone(row.stampMs || row.dateKey, chartTimeZone);
    const parts = keyParts || stampParts;
    if (!parts) return;
    if (parts.year !== targetYear || parts.month !== targetMonth) return;
    const day = Number(parts.day);
    if (!Number.isFinite(day) || day < 1 || day > daysInMonth) return;
    const current = byDay.get(day);
    if (!current) {
      byDay.set(day, row);
      return;
    }
    const left = Number(current?.stampMs);
    const right = Number(row?.stampMs);
    if (Number.isFinite(right) && (!Number.isFinite(left) || right >= left)) {
      byDay.set(day, row);
    }
  });

  return Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    const dateKey = `${targetYear}-${pad2(targetMonth)}-${pad2(day)}`;
    const fallbackStamp = toDate(`${dateKey}T00:00:00`);
    const row = byDay.get(day);
    const rawStamp = Number(row?.stampMs);
    const stampMs =
      Number.isFinite(rawStamp) && rawStamp > 0
        ? rawStamp
        : fallbackStamp
          ? fallbackStamp.getTime()
          : null;
    if (mode === "energy") {
      const energyValue = parseFiniteNumber(row?.energyKwh);
      return {
        idx,
        stampMs,
        dateKey,
        label: String(day),
        energyKwh: Number.isFinite(energyValue) ? Math.max(0, energyValue) : null
      };
    }
    const solarValue = parseFiniteNumber(row?.solarIn);
    const selfUseValue = parseFiniteNumber(row?.selfUse);
    return {
      idx,
      stampMs,
      dateKey,
      label: String(day),
      solarIn: Number.isFinite(solarValue) ? solarValue : null,
      selfUse: Number.isFinite(selfUseValue) ? selfUseValue : null
    };
  });
};
const escapeText = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const buildSmoothSegmentPath = (points, tension = 0.18) => {
  if (!Array.isArray(points) || !points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let idx = 1; idx < points.length; idx += 1) {
    const prev = points[idx - 1];
    const current = points[idx];
    const prevAnchor = points[idx - 2] || prev;
    const nextAnchor = points[idx + 1] || current;
    const cp1x = prev.x + (current.x - prevAnchor.x) * tension;
    const cp1y = prev.y + (current.y - prevAnchor.y) * tension;
    const cp2x = current.x - (nextAnchor.x - prev.x) * tension;
    const cp2y = current.y - (nextAnchor.y - prev.y) * tension;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
  }
  return path;
};
const buildSeriesSegments = (series, xAt, yAt) => {
  const segments = [];
  let currentSegment = [];
  (Array.isArray(series) ? series : []).forEach((value, idx) => {
    const numericValue = parseFiniteNumber(value);
    if (!Number.isFinite(numericValue)) {
      if (currentSegment.length) segments.push(currentSegment);
      currentSegment = [];
      return;
    }
    currentSegment.push({
      x: xAt(idx),
      y: yAt(numericValue)
    });
  });
  if (currentSegment.length) segments.push(currentSegment);
  return segments;
};
const buildPath = (series, xAt, yAt) => {
  return buildSeriesSegments(series, xAt, yAt)
    .map((segment) => buildSmoothSegmentPath(segment))
    .join(" ")
    .trim();
};
const buildAreaPath = (series, xAt, yAt, baselineY) => {
  const baseline = Number(baselineY);
  if (!Number.isFinite(baseline)) return "";
  return buildSeriesSegments(series, xAt, yAt)
    .map((segment) => {
      const first = segment[0];
      const last = segment[segment.length - 1];
      if (!first || !last) return "";
      const smoothLine = buildSmoothSegmentPath(segment);
      if (!smoothLine) return "";
      return `${smoothLine} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
    })
    .filter(Boolean)
    .join(" ")
    .trim();
};
const buildDots = (series, xAt, yAt, color, tooltipBuilder = null) =>
  series
    .map((value, idx) => {
      const numericValue = parseFiniteNumber(value);
      if (!Number.isFinite(numericValue)) return "";
      const tooltipText =
        typeof tooltipBuilder === "function"
          ? readText(tooltipBuilder(numericValue, idx))
          : "";
      const pointIndexAttr = ` data-point-index="${idx}"`;
      const tooltipAttr = tooltipText
        ? ` class="meter-chart-point" data-tooltip="${escapeText(tooltipText)}"`
        : "";
      return `<circle cx="${xAt(idx)}" cy="${yAt(numericValue)}" r="3.6" fill="${color}" stroke="#ffffff" stroke-width="1.4"${pointIndexAttr}${tooltipAttr}></circle>`;
    })
    .join("");
const getOrCreatePointTooltip = (chartRoot) => {
  if (!chartRoot) return null;
  let tooltip = chartRoot.querySelector(".meter-point-tooltip");
  if (tooltip) return tooltip;
  tooltip = document.createElement("div");
  tooltip.className = "meter-point-tooltip";
  chartRoot.appendChild(tooltip);
  return tooltip;
};
const positionTooltipByAnchor = (anchorLeft, anchorTop, chartRoot, tooltip) => {
  if (!chartRoot || !tooltip) return false;
  const leftValue = Number(anchorLeft);
  const topValue = Number(anchorTop);
  if (!Number.isFinite(leftValue) || !Number.isFinite(topValue)) return false;

  const chartRect = chartRoot.getBoundingClientRect();
  if (!chartRect || chartRect.width <= 0 || chartRect.height <= 0) return false;

  const tooltipRect = tooltip.getBoundingClientRect();
  const tooltipWidth = Math.max(0, Number(tooltipRect?.width) || 0);
  const tooltipHeight = Math.max(0, Number(tooltipRect?.height) || 0);
  const edgePadding = 8;
  const pointGap = 12;

  let left = leftValue - tooltipWidth / 2;
  left = clampInRange(left, edgePadding, Math.max(edgePadding, chartRect.width - tooltipWidth - edgePadding));

  let top = topValue - tooltipHeight - pointGap;
  if (top < edgePadding) {
    top = topValue + pointGap;
  }
  if (top + tooltipHeight > chartRect.height - edgePadding) {
    top = Math.max(edgePadding, chartRect.height - tooltipHeight - edgePadding);
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.transform = "none";
  return true;
};
const positionPointTooltip = (event, chartRoot, tooltip) => {
  if (!event || !chartRoot || !tooltip) return;
  const rect = chartRoot.getBoundingClientRect();
  const left = event.clientX - rect.left;
  const top = event.clientY - rect.top;
  positionTooltipByAnchor(left, top, chartRoot, tooltip);
};
const positionPointTooltipAtPoint = (point, chartRoot, tooltip) => {
  if (!point || !chartRoot || !tooltip) return false;
  const pointRect = point.getBoundingClientRect();
  const chartRect = chartRoot.getBoundingClientRect();
  if (!pointRect || !chartRect) return false;
  const left = pointRect.left + pointRect.width / 2 - chartRect.left;
  const top = pointRect.top + pointRect.height / 2 - chartRect.top;
  if (!Number.isFinite(left) || !Number.isFinite(top)) return false;
  return positionTooltipByAnchor(left, top, chartRoot, tooltip);
};
const clampInRange = (value, min, max) => {
  const numericValue = Number(value);
  const numericMin = Number(min);
  const numericMax = Number(max);
  if (!Number.isFinite(numericValue)) return numericMin;
  if (!Number.isFinite(numericMin) && !Number.isFinite(numericMax)) return numericValue;
  if (!Number.isFinite(numericMin)) return Math.min(numericValue, numericMax);
  if (!Number.isFinite(numericMax)) return Math.max(numericValue, numericMin);
  if (numericMin > numericMax) return clampInRange(numericValue, numericMax, numericMin);
  return Math.min(Math.max(numericValue, numericMin), numericMax);
};
const bindChartPointTooltip = () => {
  const chartRoot = chartBox?.querySelector(".meter-chart");
  if (!chartRoot) return;
  const chartSvg = chartRoot.querySelector(".meter-chart-svg");
  const points = Array.from(chartRoot.querySelectorAll(".meter-chart-point[data-tooltip]"));
  const pointCoordinates = points
    .map((point) => {
      const cx = Number(point?.getAttribute("cx"));
      const cy = Number(point?.getAttribute("cy"));
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
      return { point, cx, cy };
    })
    .filter(Boolean);
  const tooltip = points.length ? getOrCreatePointTooltip(chartRoot) : null;
  const crosshairVertical = chartSvg?.querySelector(".meter-crosshair-v");
  const crosshairHorizontal = chartSvg?.querySelector(".meter-crosshair-h");
  const plotLeft = Number(chartSvg?.dataset?.plotLeft);
  const plotRight = Number(chartSvg?.dataset?.plotRight);
  const plotTop = Number(chartSvg?.dataset?.plotTop);
  const plotBottom = Number(chartSvg?.dataset?.plotBottom);
  const canDrawCrosshair =
    Boolean(chartSvg && crosshairVertical && crosshairHorizontal) &&
    Number.isFinite(plotLeft) &&
    Number.isFinite(plotRight) &&
    Number.isFinite(plotTop) &&
    Number.isFinite(plotBottom);

  const hideTooltip = () => {
    tooltip?.classList.remove("is-visible");
  };
  const hideCrosshair = () => {
    crosshairVertical?.classList.remove("is-visible");
    crosshairHorizontal?.classList.remove("is-visible");
  };
  const isInsidePlotArea = (x, y) =>
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= plotLeft &&
    x <= plotRight &&
    y >= plotTop &&
    y <= plotBottom;
  const findNearestPoint = (x, y) => {
    if (!pointCoordinates.length) return null;
    let nearest = null;
    let shortestDistanceSq = Number.POSITIVE_INFINITY;
    pointCoordinates.forEach((entry) => {
      const dx = entry.cx - x;
      const dy = entry.cy - y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < shortestDistanceSq) {
        shortestDistanceSq = distanceSq;
        nearest = entry;
      }
    });
    return nearest;
  };
  const buildTooltipTextForPoint = (point) => {
    const fallbackText = readText(point?.dataset?.tooltip);
    const pointIndex = readText(point?.dataset?.pointIndex);
    if (!pointIndex) return fallbackText;

    const sameIndexTexts = points
      .filter((item) => readText(item?.dataset?.pointIndex) === pointIndex)
      .map((item) => readText(item?.dataset?.tooltip))
      .filter(Boolean);

    if (!sameIndexTexts.length) return fallbackText;
    if (sameIndexTexts.length === 1) return sameIndexTexts[0];

    let timeLabel = "";
    const metricLines = [];
    sameIndexTexts.forEach((text) => {
      const parts = text
        .split("|")
        .map((part) => readText(part))
        .filter(Boolean);
      if (!parts.length) return;
      const head = parts[0];
      if (!timeLabel && head.startsWith("เวลา")) timeLabel = head;
      if (parts.length > 1) {
        metricLines.push(parts.slice(1).join(" | "));
      } else if (!head.startsWith("เวลา")) {
        metricLines.push(head);
      }
    });

    const uniqueMetrics = [...new Set(metricLines.filter(Boolean))];
    const lines = [];
    if (timeLabel) lines.push(timeLabel);
    lines.push(...uniqueMetrics);
    return lines.length ? lines.join("\n") : sameIndexTexts.join("\n");
  };
  const showTooltipForPoint = (point, event) => {
    if (!tooltip || !point || !event) return;
    const text = buildTooltipTextForPoint(point);
    if (!text) {
      hideTooltip();
      return;
    }
    tooltip.textContent = text;
    const positionedOnPoint = positionPointTooltipAtPoint(point, chartRoot, tooltip);
    if (!positionedOnPoint) positionPointTooltip(event, chartRoot, tooltip);
    tooltip.classList.add("is-visible");
  };
  const setCrosshair = (x, y) => {
    if (!canDrawCrosshair) return;
    const crossX = clampInRange(x, plotLeft, plotRight);
    const crossY = clampInRange(y, plotTop, plotBottom);
    crosshairVertical.setAttribute("x1", String(crossX));
    crosshairVertical.setAttribute("x2", String(crossX));
    crosshairVertical.setAttribute("y1", String(plotTop));
    crosshairVertical.setAttribute("y2", String(plotBottom));
    crosshairHorizontal.setAttribute("x1", String(plotLeft));
    crosshairHorizontal.setAttribute("x2", String(plotRight));
    crosshairHorizontal.setAttribute("y1", String(crossY));
    crosshairHorizontal.setAttribute("y2", String(crossY));
    crosshairVertical.classList.add("is-visible");
    crosshairHorizontal.classList.add("is-visible");
  };
  const positionCrosshairByMouse = (event) => {
    if (!canDrawCrosshair || !event || !chartSvg) return;
    const rect = chartSvg.getBoundingClientRect();
    const viewBox = chartSvg.viewBox?.baseVal;
    if (!rect || !viewBox || rect.width <= 0 || rect.height <= 0) return;
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const svgX = viewBox.x + (offsetX / rect.width) * viewBox.width;
    const svgY = viewBox.y + (offsetY / rect.height) * viewBox.height;
    if (!isInsidePlotArea(svgX, svgY)) {
      hideTooltip();
      hideCrosshair();
      return;
    }
    const nearest = findNearestPoint(svgX, svgY);
    if (nearest) {
      setCrosshair(nearest.cx, nearest.cy);
      showTooltipForPoint(nearest.point, event);
      return;
    }
    setCrosshair(svgX, svgY);
    hideTooltip();
  };

  chartSvg?.addEventListener("mouseenter", positionCrosshairByMouse);
  chartSvg?.addEventListener("mousemove", positionCrosshairByMouse);
  chartSvg?.addEventListener("mouseleave", () => {
    hideTooltip();
    hideCrosshair();
  });

  if (!points.length || !tooltip) return;

  const showTooltip = (event, point) => {
    const cx = Number(point?.getAttribute("cx"));
    const cy = Number(point?.getAttribute("cy"));
    if (Number.isFinite(cx) && Number.isFinite(cy)) setCrosshair(cx, cy);
    showTooltipForPoint(point, event);
  };

  points.forEach((point) => {
    point.addEventListener("mouseenter", (event) => showTooltip(event, point));
    point.addEventListener("mousemove", (event) => showTooltip(event, point));
  });
};
const resolveChartViewWidth = (viewHeight) => {
  const renderedHeight = 360;
  const targetHeight = Number(viewHeight);
  const svgHeight =
    Number.isFinite(targetHeight) && targetHeight > 0 ? targetHeight : renderedHeight;

  const rectWidth = Number(chartBox?.getBoundingClientRect?.().width);
  const clientWidth = Number(chartBox?.clientWidth);
  const offsetWidth = Number(chartBox?.offsetWidth);
  const measuredWidth =
    [rectWidth, clientWidth, offsetWidth].find(
      (value) => Number.isFinite(value) && value > 0
    ) || 0;

  let horizontalPadding = 0;
  if (typeof window !== "undefined" && chartBox) {
    try {
      const computed = window.getComputedStyle(chartBox);
      horizontalPadding =
        parseNumber(computed.paddingLeft) + parseNumber(computed.paddingRight);
    } catch {
      horizontalPadding = 0;
    }
  }

  const viewportWidth =
    typeof window !== "undefined" ? Number(window.innerWidth) : 0;
  const fallbackWidth = Number.isFinite(viewportWidth) && viewportWidth > 0
    ? viewportWidth - 64
    : 960;
  const targetWidth = measuredWidth > 0
    ? measuredWidth - horizontalPadding
    : fallbackWidth;
  const safeTargetWidth = Math.max(320, targetWidth);
  return Math.round((safeTargetWidth * svgHeight) / renderedHeight);
};
const renderChart = (rows, options = {}) => {
  if (!chartBox) return;
  const isDualEnergyMode =
    options.mode === "day-energy-dual" || options.mode === "period-energy-dual";
  const isEnergyMode =
    options.mode === "month-energy" ||
    options.mode === "day-energy" ||
    rows.some((row) => Number.isFinite(Number(row?.energyKwh)));
  if (isEnergyMode) {
    const forceFullDayXAxis = options.forceFullDayXAxis === true;
    const energySeries = rows.map((row) => parseFiniteNumber(row?.energyKwh));
    const energyValues = collectFiniteNumbers(energySeries);
    const totalStrategy = readText(options.totalStrategy) || "sum";
    const totalEnergy =
      totalStrategy === "delta" && energyValues.length
        ? (() => {
            const maxValue = Math.max(...energyValues);
            const minValue = Math.min(...energyValues);
            const delta = Math.max(0, maxValue - minValue);
            if (delta > 0) return delta;
            return Math.max(0, findLastFiniteNumber(energySeries) || 0);
          })()
        : energyValues.reduce((sum, value) => sum + value, 0);
    const emptyMessage =
      readText(options.emptyMessage) ||
      (options.mode === "day-energy"
        ? "ไม่พบข้อมูลรายวัน"
        : "ไม่พบข้อมูลเดือนที่เลือก");
    const totalLabel =
      readText(options.totalLabel) ||
      (options.mode === "day-energy" ? "ผลิตวันนี้" : "รวมพลังงาน");
    const latestLabel =
      readText(options.latestLabel) ||
      (options.mode === "day-energy" ? "ล่าสุดสะสม" : "ล่าสุดต่อวัน");
    const legendLabel =
      readText(options.legendLabel) ||
      (options.mode === "day-energy"
        ? "พลังงานสะสมรายวัน (kWh)"
        : "พลังงานรายวัน (kWh)");
    const ariaLabel =
      readText(options.ariaLabel) || "กราฟพลังงานรายวันจาก energy_total ของเดือนที่เลือก";
    setTotalKwhSingle(formatTotalKwh(totalEnergy));
    if (!rows.length || !energyValues.length) {
      chartBox.textContent = emptyMessage;
      return;
    }

    let min = Math.min(...energyValues);
    let max = Math.max(...energyValues);
    const yAxis = buildIntegerYAxis(min, max, 4);
    min = yAxis.min;
    max = yAxis.max;
    const labels = rows.map((row) => row.label);
    const height = 340;
    const width = resolveChartViewWidth(height);
    const padLeft = 48;
    const padRight = 14;
    const padTop = 14;
    const padBottom = 48;
    const innerWidth = width - padLeft - padRight;
    const innerHeight = height - padTop - padBottom;
    const xAt = (index) =>
      padLeft +
      (labels.length <= 1 ? innerWidth / 2 : (index * innerWidth) / (labels.length - 1));
    const yAt = (value) => padTop + ((max - value) * innerHeight) / (max - min);

    const yTicks = yAxis.values.map((value) => ({
      value,
      y: yAt(value)
    }));
    const maxXLabels = 7;
    const xStep = Math.max(1, Math.ceil(labels.length / maxXLabels));
    const xTicks = forceFullDayXAxis
      ? labels.map((label, idx) => ({ label, idx }))
      : labels
        .map((label, idx) => ({ label, idx }))
        .filter(({ idx }) => idx % xStep === 0 || idx === labels.length - 1);
    const xTickFontSize = forceFullDayXAxis ? 9 : 11;

    const energyColor = "#0f63d4";
    const energyPath = buildPath(energySeries, xAt, yAt);
    const baselineY = height - padBottom;
    const energyAreaPath = buildAreaPath(energySeries, xAt, yAt, baselineY);
    const energyDots = buildDots(
      energySeries,
      xAt,
      yAt,
      energyColor,
      (value, idx) => `เวลา ${labels[idx]} | ${formatMetric(value)} kWh`
    );
    const latest = findLastFiniteNumber(energySeries) || 0;

    chartBox.innerHTML = `
      <div class="meter-chart">
        <div class="meter-chart-legend">
          <span><i style="background:${energyColor}"></i>${escapeText(legendLabel)}</span>
        </div>
        <svg viewBox="0 0 ${width} ${height}" class="meter-chart-svg" data-plot-left="${padLeft}" data-plot-right="${width - padRight}" data-plot-top="${padTop}" data-plot-bottom="${height - padBottom}" role="img" aria-label="${escapeText(
          ariaLabel
        )}">
          <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
          ${yTicks
            .map(
              ({ y, value }) => `
              <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#dbe4f5" stroke-width="1"></line>
              <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${formatYAxisMetric(
                value
              )}</text>
            `
            )
            .join("")}
          <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="#93a6c8" stroke-width="1.2"></line>
          ${xTicks
            .map(
              ({ label, idx }) => `
              <text x="${xAt(idx)}" y="${height - 22}" text-anchor="middle" font-size="${xTickFontSize}" fill="#6b7280">${escapeText(
                label
              )}</text>
            `
            )
            .join("")}
          <defs>
            <linearGradient id="energy-area-gradient" x1="0" y1="${padTop}" x2="0" y2="${baselineY}" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="${energyColor}" stop-opacity="0.12"></stop>
              <stop offset="100%" stop-color="${energyColor}" stop-opacity="0.01"></stop>
            </linearGradient>
          </defs>
          ${energyAreaPath
            ? `<path d="${energyAreaPath}" fill="url(#energy-area-gradient)" stroke="none" pointer-events="none"></path>`
            : ""}
          <path d="${energyPath}" fill="none" stroke="${energyColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
          ${energyDots}
          <line class="meter-crosshair-line meter-crosshair-v" x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}"></line>
          <line class="meter-crosshair-line meter-crosshair-h" x1="${padLeft}" y1="${padTop}" x2="${width - padRight}" y2="${padTop}"></line>
        </svg>
        <div class="meter-chart-summary">
          <span>${escapeText(totalLabel)}: <strong>${formatMetric(totalEnergy)}</strong></span>
          <span>${escapeText(latestLabel)}: <strong>${formatMetric(latest)}</strong></span>
        </div>
      </div>
    `;
    bindChartPointTooltip();
    return;
  }

  if (!rows.length) {
    chartBox.textContent = "ไม่พบข้อมูลในช่วงที่เลือก";
    return;
  }

  const forceFullDayXAxis = options.forceFullDayXAxis === true;
  const labels = rows.map((row) => row.label);
  const solarSeries = rows.map((row) => parseFiniteNumber(row?.solarIn));
  const selfUseSeries = rows.map((row) => parseFiniteNumber(row?.selfUse));
  const shouldRenderSingleSeries =
    Number.isFinite(selectedMeterId) && selectedMeterId > 0 && !isDualEnergyMode;
  if (shouldRenderSingleSeries) {
    const isSolarMeterType = selectedMeterTypeKey.includes("solar");
    const solarFinite = collectFiniteNumbers(solarSeries);
    const selfUseFinite = collectFiniteNumbers(selfUseSeries);
    const hasSolarNonZero = solarFinite.some((value) => Math.abs(value) > 0);
    const hasSelfUseNonZero = selfUseFinite.some((value) => Math.abs(value) > 0);
    const preferSolarSeries =
      (isSolarMeterType && solarFinite.length > 0) ||
      (hasSolarNonZero && !hasSelfUseNonZero) ||
      (solarFinite.length > 0 && !selfUseFinite.length);
    const singleSeriesConfig = preferSolarSeries
      ? {
          series: solarSeries,
          color: "#f59e0b",
          label: "โซลาร์ผลิต (kW)",
          metricLabel: "โซลาร์ผลิต",
          ariaLabel: "กราฟโซลาร์ผลิตของมิเตอร์ที่เลือก"
        }
      : {
          series: selfUseSeries,
          color: "#0f63d4",
          label: selectedMeterTypeKey.includes("meter")
            ? "ใช้ไฟจากการไฟฟ้า (kW)"
            : "ค่ามิเตอร์ (kW)",
          metricLabel: selectedMeterTypeKey.includes("meter")
            ? "ใช้ไฟจากการไฟฟ้า"
            : "ค่ามิเตอร์",
          ariaLabel: selectedMeterTypeKey.includes("meter")
            ? "กราฟใช้ไฟจากการไฟฟ้าของมิเตอร์ที่เลือก"
            : "กราฟค่ามิเตอร์ของมิเตอร์ที่เลือก"
        };
    const singleSeries = singleSeriesConfig.series;
    const singleValues = collectFiniteNumbers(singleSeries);
    setTotalKwhSingle(
      formatTotalKwh(singleSeries.reduce((sum, value) => sum + parseNumber(value), 0))
    );
    if (!singleValues.length) {
      chartBox.textContent = "ไม่พบข้อมูลในช่วงที่เลือก";
      return;
    }

    let min = Math.min(...singleValues);
    let max = Math.max(...singleValues);
    const yAxis = buildIntegerYAxis(min, max, 4);
    min = yAxis.min;
    max = yAxis.max;

    const height = 340;
    const width = resolveChartViewWidth(height);
    const padLeft = 48;
    const padRight = 14;
    const padTop = 14;
    const padBottom = 48;
    const innerWidth = width - padLeft - padRight;
    const innerHeight = height - padTop - padBottom;
    const xAt = (index) =>
      padLeft +
      (labels.length <= 1 ? innerWidth / 2 : (index * innerWidth) / (labels.length - 1));
    const yAt = (value) => padTop + ((max - value) * innerHeight) / (max - min);
    const yTicks = yAxis.values.map((value) => ({
      value,
      y: yAt(value)
    }));
    const maxXLabels = 7;
    const xStep = Math.max(1, Math.ceil(labels.length / maxXLabels));
    const xTicks = forceFullDayXAxis
      ? labels.map((label, idx) => ({ label, idx }))
      : labels
        .map((label, idx) => ({ label, idx }))
        .filter(({ idx }) => idx % xStep === 0 || idx === labels.length - 1);
    const xTickFontSize = forceFullDayXAxis ? 9 : 11;
    const baselineY = height - padBottom;
    const singlePath = buildPath(singleSeries, xAt, yAt);
    const singleAreaPath = buildAreaPath(singleSeries, xAt, yAt, baselineY);
    const singleDots = buildDots(
      singleSeries,
      xAt,
      yAt,
      singleSeriesConfig.color,
      (value, idx) => `เวลา ${labels[idx]} | ${singleSeriesConfig.metricLabel} ${formatMetric(value)} kW`
    );

    chartBox.innerHTML = `
      <div class="meter-chart">
        <div class="meter-chart-legend">
          <span><i style="background:${singleSeriesConfig.color}"></i>${escapeText(
            singleSeriesConfig.label
          )}</span>
        </div>
        <svg viewBox="0 0 ${width} ${height}" class="meter-chart-svg" data-plot-left="${padLeft}" data-plot-right="${width - padRight}" data-plot-top="${padTop}" data-plot-bottom="${height - padBottom}" role="img" aria-label="${escapeText(
          singleSeriesConfig.ariaLabel
        )}">
          <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
          ${yTicks
            .map(
              ({ y, value }) => `
              <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#dbe4f5" stroke-width="1"></line>
              <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${formatYAxisMetric(
                value
              )}</text>
            `
            )
            .join("")}
          <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="#93a6c8" stroke-width="1.2"></line>
          ${xTicks
            .map(
              ({ label, idx }) => `
              <text x="${xAt(idx)}" y="${height - 22}" text-anchor="middle" font-size="${xTickFontSize}" fill="#6b7280">${escapeText(
                label
              )}</text>
            `
            )
            .join("")}
          <defs>
            <linearGradient id="single-area-gradient" x1="0" y1="${padTop}" x2="0" y2="${baselineY}" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="${singleSeriesConfig.color}" stop-opacity="0.1"></stop>
              <stop offset="100%" stop-color="${singleSeriesConfig.color}" stop-opacity="0.01"></stop>
            </linearGradient>
          </defs>
          ${singleAreaPath
            ? `<path d="${singleAreaPath}" fill="url(#single-area-gradient)" stroke="none" pointer-events="none"></path>`
            : ""}
          <path d="${singlePath}" fill="none" stroke="${singleSeriesConfig.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
          ${singleDots}
          <line class="meter-crosshair-line meter-crosshair-v" x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}"></line>
          <line class="meter-crosshair-line meter-crosshair-h" x1="${padLeft}" y1="${padTop}" x2="${width - padRight}" y2="${padTop}"></line>
        </svg>
      </div>
    `;
    bindChartPointTooltip();
    return;
  }

  const derivedEnergyInTotal = rows.reduce((sum, row) => sum + parseNumber(row?.solarIn), 0);
  const derivedEnergyOutTotal = rows.reduce((sum, row) => sum + parseNumber(row?.selfUse), 0);
  const summaryEnergyInTotal = parseFiniteNumber(options.energyInTotal);
  const summaryEnergyOutTotal = parseFiniteNumber(options.energyOutTotal);
  const dualMetricUnit = readText(options.metricUnit) || "kWh";
  const resolvedEnergyInTotal =
    summaryEnergyInTotal !== null ? Math.max(0, summaryEnergyInTotal) : Math.max(0, derivedEnergyInTotal);
  const resolvedEnergyOutTotal =
    summaryEnergyOutTotal !== null ? Math.max(0, summaryEnergyOutTotal) : Math.max(0, derivedEnergyOutTotal);
  if (isDualEnergyMode) {
    setTotalKwhDual({
      energyIn: resolvedEnergyInTotal,
      energyOut: resolvedEnergyOutTotal,
      unit: dualMetricUnit,
      summaryLabel: readText(options.totalLabel) || "สรุปพลังงาน"
    });
  } else {
    setTotalKwhSingle(formatTotalKwh(derivedEnergyInTotal + derivedEnergyOutTotal));
  }
  const allValues = collectFiniteNumbers([...solarSeries, ...selfUseSeries]);
  if (!allValues.length) {
    chartBox.textContent = "ไม่พบข้อมูลในช่วงที่เลือก";
    return;
  }
  let min = Math.min(...allValues);
  let max = Math.max(...allValues);
  const yAxis = buildIntegerYAxis(min, max, 4);
  min = yAxis.min;
  max = yAxis.max;

  const height = 340;
  const width = resolveChartViewWidth(height);
  const padLeft = 48;
  const padRight = 14;
  const padTop = 14;
  const padBottom = 48;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const xAt = (index) =>
    padLeft + (labels.length <= 1 ? innerWidth / 2 : (index * innerWidth) / (labels.length - 1));
  const yAt = (value) => padTop + ((max - value) * innerHeight) / (max - min);

  const yTicks = yAxis.values.map((value) => ({
    value,
    y: yAt(value)
  }));
  const maxXLabels = 7;
  const xStep = Math.max(1, Math.ceil(labels.length / maxXLabels));
  const xTicks = forceFullDayXAxis
    ? labels.map((label, idx) => ({ label, idx }))
    : labels
      .map((label, idx) => ({ label, idx }))
      .filter(({ idx }) => idx % xStep === 0 || idx === labels.length - 1);
  const xTickFontSize = forceFullDayXAxis ? 9 : 11;

  const solarColor = "#f59e0b";
  const selfUseColor = "#0f63d4";
  const dualLeftLabel = readText(options.leftLegendLabel) || "พลังงานที่ได้รับ";
  const dualRightLabel = readText(options.rightLegendLabel) || "พลังงานที่จ่ายออก";
  const leftLegendLabel = isDualEnergyMode
    ? `${dualLeftLabel} (${dualMetricUnit})`
    : "โซลาร์ผลิต (kW)";
  const rightLegendLabel = isDualEnergyMode
    ? `${dualRightLabel} (${dualMetricUnit})`
    : "ใช้ไฟจากการไฟฟ้า (kW)";
  const leftMetricLabel = isDualEnergyMode ? dualLeftLabel : "โซลาร์ผลิต";
  const rightMetricLabel = isDualEnergyMode ? dualRightLabel : "ใช้ไฟจากการไฟฟ้า";
  const dualAriaLabel =
    readText(options.ariaLabel) || `กราฟพลังงานที่ได้รับและพลังงานที่จ่ายออก (${dualMetricUnit})`;
  const chartAriaLabel = isDualEnergyMode
    ? dualAriaLabel
    : "กราฟโซลาร์ผลิตและใช้ไฟจากการไฟฟ้า";
  const metricUnit = isDualEnergyMode ? dualMetricUnit : "kW";
  const solarPath = buildPath(solarSeries, xAt, yAt);
  const selfUsePath = buildPath(selfUseSeries, xAt, yAt);
  const baselineY = height - padBottom;
  const solarAreaPath = buildAreaPath(solarSeries, xAt, yAt, baselineY);
  const selfUseAreaPath = buildAreaPath(selfUseSeries, xAt, yAt, baselineY);
  const solarDots = buildDots(
    solarSeries,
    xAt,
    yAt,
    solarColor,
    (value, idx) => `เวลา ${labels[idx]} | ${leftMetricLabel} ${formatMetric(value)} ${metricUnit}`
  );
  const selfUseDots = buildDots(
    selfUseSeries,
    xAt,
    yAt,
    selfUseColor,
    (value, idx) => `เวลา ${labels[idx]} | ${rightMetricLabel} ${formatMetric(value)} ${metricUnit}`
  );
  chartBox.innerHTML = `
      <div class="meter-chart">
        <div class="meter-chart-legend">
          <span><i style="background:${solarColor}"></i>${escapeText(leftLegendLabel)}</span>
          <span><i style="background:${selfUseColor}"></i>${escapeText(rightLegendLabel)}</span>
        </div>
      <svg viewBox="0 0 ${width} ${height}" class="meter-chart-svg" data-plot-left="${padLeft}" data-plot-right="${width - padRight}" data-plot-top="${padTop}" data-plot-bottom="${height - padBottom}" role="img" aria-label="${escapeText(
        chartAriaLabel
      )}">
        <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
        ${yTicks
          .map(
            ({ y, value }) => `
            <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#dbe4f5" stroke-width="1"></line>
            <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${formatYAxisMetric(
              value
            )}</text>
          `
          )
          .join("")}
        <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="#93a6c8" stroke-width="1.2"></line>
        ${xTicks
          .map(
            ({ label, idx }) => `
            <text x="${xAt(idx)}" y="${height - 22}" text-anchor="middle" font-size="${xTickFontSize}" fill="#6b7280">${escapeText(
              label
            )}</text>
          `
          )
          .join("")}
        <defs>
          <linearGradient id="solar-area-gradient" x1="0" y1="${padTop}" x2="0" y2="${baselineY}" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="${solarColor}" stop-opacity="0.1"></stop>
            <stop offset="100%" stop-color="${solarColor}" stop-opacity="0.01"></stop>
          </linearGradient>
          <linearGradient id="grid-area-gradient" x1="0" y1="${padTop}" x2="0" y2="${baselineY}" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="${selfUseColor}" stop-opacity="0.08"></stop>
            <stop offset="100%" stop-color="${selfUseColor}" stop-opacity="0.01"></stop>
          </linearGradient>
        </defs>
        ${solarAreaPath
          ? `<path d="${solarAreaPath}" fill="url(#solar-area-gradient)" stroke="none" pointer-events="none"></path>`
          : ""}
        ${selfUseAreaPath
          ? `<path d="${selfUseAreaPath}" fill="url(#grid-area-gradient)" stroke="none" pointer-events="none"></path>`
          : ""}
        <path d="${solarPath}" fill="none" stroke="${solarColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="${selfUsePath}" fill="none" stroke="${selfUseColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
        ${solarDots}
        ${selfUseDots}
        <line class="meter-crosshair-line meter-crosshair-v" x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${height - padBottom}"></line>
        <line class="meter-crosshair-line meter-crosshair-h" x1="${padLeft}" y1="${padTop}" x2="${width - padRight}" y2="${padTop}"></line>
      </svg>
    </div>
  `;
  bindChartPointTooltip();
};

const requestRowsFromCandidates = async (
  queryCandidates,
  extractor,
  apiCandidates = energyApiCandidates
) => {
  const uniqueQueries = [...new Set((Array.isArray(queryCandidates) ? queryCandidates : []).filter(Boolean))];
  const baseCandidates = Array.isArray(apiCandidates) && apiCandidates.length
    ? apiCandidates
    : energyApiCandidates;
  const errors = [];
  let hadOkResponse = false;
  let hadRateLimitedResponse = false;
  let scopedRowsWithoutExplicitDevice = [];
  for (let b = 0; b < baseCandidates.length; b += 1) {
    const base = baseCandidates[b];
    let isRateLimitedBase = false;
    for (let i = 0; i < uniqueQueries.length; i += 1) {
      if (isRateLimitedBase) break;
      const query = uniqueQueries[i];
      const url = `${base}?${query}`;
      try {
        const response = await fetch(url, {
          method: "GET",
          credentials: "same-origin"
        });
        if (!response.ok) {
          if (response.status === 429) {
            hadRateLimitedResponse = true;
            isRateLimitedBase = true;
            continue;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        hadOkResponse = true;
        const payload = await response.json();
        const params = new URLSearchParams(query);
        const scopedDeviceId = parseLoosePositiveId(
          params.get("device_id") || params.get("meter_id")
        );
        const rows = typeof extractor === "function"
          ? extractor(payload, {
              query,
              url,
              scopedDeviceId
            })
          : [];
        if (rows.length) {
          const scopedByDevice = Number.isFinite(scopedDeviceId) && scopedDeviceId > 0;
          if (scopedByDevice && !rowsContainExplicitDeviceId(rows)) {
            if (!scopedRowsWithoutExplicitDevice.length) {
              scopedRowsWithoutExplicitDevice = rows;
            }
            continue;
          }
          return rows;
        }
      } catch (error) {
        const message = `${error?.message || "unknown error"}`;
        errors.push(`${url}: ${message}`);
      }
    }
  }
  if (scopedRowsWithoutExplicitDevice.length) return scopedRowsWithoutExplicitDevice;
  if (hadOkResponse) return [];
  if (hadRateLimitedResponse) return [];
  if (errors.length) throw new Error(errors.slice(0, 8).join(" | "));
  return [];
};
const buildYearQueryCandidates = (year) => {
  const queryCandidates = [];
  const hasMeterId = Number.isFinite(selectedMeterId) && selectedMeterId > 0;
  const hasEnergyName = Boolean(selectedEnergyName);
  if (Number.isFinite(selectedSiteId) && selectedSiteId > 0) {
    if (hasMeterId) {
      queryCandidates.push(
        `site_id=${encodeURIComponent(
          selectedSiteId
        )}&device_id=${encodeURIComponent(selectedMeterId)}&period=year&year=${encodeURIComponent(year)}`
      );
      queryCandidates.push(
        `site_id=${encodeURIComponent(
          selectedSiteId
        )}&period=year&year=${encodeURIComponent(year)}&device_id=${encodeURIComponent(
          selectedMeterId
        )}`
      );
    } else {
      queryCandidates.push(
        `site_id=${encodeURIComponent(selectedSiteId)}&period=year&year=${encodeURIComponent(year)}`
      );
      queryCandidates.push(
        `site_id=${encodeURIComponent(selectedSiteId)}&period=month&year=${encodeURIComponent(year)}`
      );
    }
  }
  if (hasMeterId) {
    if (hasEnergyName) {
      queryCandidates.push(
        `period=year&name=${encodeURIComponent(
          selectedEnergyName
        )}&year=${encodeURIComponent(year)}&device_id=${encodeURIComponent(selectedMeterId)}`
      );
    }
    queryCandidates.push(
      `period=year&device_id=${encodeURIComponent(selectedMeterId)}&year=${encodeURIComponent(
        year
      )}`
    );
  } else if (hasEnergyName) {
    queryCandidates.push(
      `period=year&name=${encodeURIComponent(selectedEnergyName)}&year=${encodeURIComponent(year)}`
    );
  }
  return queryCandidates;
};
const buildMonthQueryCandidates = (year, month) => {
  const monthToken = `${year}-${pad2(month)}`;
  const queryCandidates = [];
  const hasMeterId = Number.isFinite(selectedMeterId) && selectedMeterId > 0;
  const hasEnergyName = Boolean(selectedEnergyName);
  if (Number.isFinite(selectedSiteId) && selectedSiteId > 0) {
    if (hasMeterId) {
      queryCandidates.push(
        `site_id=${encodeURIComponent(
          selectedSiteId
        )}&device_id=${encodeURIComponent(selectedMeterId)}&period=month&month=${monthToken}`
      );
      queryCandidates.push(
        `site_id=${encodeURIComponent(
          selectedSiteId
        )}&device_id=${encodeURIComponent(
          selectedMeterId
        )}&period=month&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`
      );
      queryCandidates.push(
        `site_id=${encodeURIComponent(
          selectedSiteId
        )}&period=month&month=${monthToken}&device_id=${encodeURIComponent(selectedMeterId)}`
      );
    } else {
      queryCandidates.push(
        `site_id=${encodeURIComponent(selectedSiteId)}&period=month&month=${monthToken}`
      );
      queryCandidates.push(
        `site_id=${encodeURIComponent(
          selectedSiteId
        )}&period=month&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`
      );
    }
  }
  if (hasMeterId) {
    if (hasEnergyName) {
      queryCandidates.push(
        `period=month&name=${encodeURIComponent(
          selectedEnergyName
        )}&month=${monthToken}&device_id=${encodeURIComponent(selectedMeterId)}`
      );
    }
    queryCandidates.push(
      `period=month&device_id=${encodeURIComponent(selectedMeterId)}&month=${monthToken}`
    );
  } else if (hasEnergyName) {
    queryCandidates.push(
      `period=month&name=${encodeURIComponent(selectedEnergyName)}&month=${monthToken}`
    );
  }
  return queryCandidates;
};
const resolveTargetYear = (value) => {
  const year = Number(value);
  if (!Number.isFinite(year) || year <= 0) return NaN;
  return Math.trunc(year);
};
const resolveTargetMonth = (value) => {
  const month = Number(value);
  if (!Number.isFinite(month) || month < 1 || month > 12) return NaN;
  return Math.trunc(month);
};
const buildMonthToken = (year, month) => {
  const safeYear = resolveTargetYear(year);
  const safeMonth = resolveTargetMonth(month);
  if (!Number.isFinite(safeYear) || !Number.isFinite(safeMonth)) return "";
  return `${safeYear}-${pad2(safeMonth)}`;
};
const getDeviceEnergyPayloadCacheKey = (period, token) => {
  const safePeriod = readText(period).toLowerCase();
  const safeToken = readText(token);
  if (!safePeriod || !safeToken || !Number.isFinite(selectedMeterId) || selectedMeterId <= 0) {
    return "";
  }
  return `${Math.trunc(selectedMeterId)}|${safePeriod}|${safeToken}`;
};
const fetchDeviceEnergyPayloadByQueries = async (queries, cacheKey) => {
  const uniqueQueries = [...new Set((Array.isArray(queries) ? queries : []).filter(Boolean))];
  if (!uniqueQueries.length) return null;
  const now = Date.now();
  const cached = cacheKey ? deviceEnergyPayloadCache.get(cacheKey) : null;
  if (cached) {
    if (Number.isFinite(cached.rateLimitedUntil) && cached.rateLimitedUntil > now) {
      return null;
    }
    if (cached.payload && now - Number(cached.cachedAt || 0) <= deviceEnergyPayloadTtlMs) {
      return cached.payload;
    }
  }

  let wasRateLimited = false;
  for (let idx = 0; idx < deviceEnergyApiCandidates.length; idx += 1) {
    const base = deviceEnergyApiCandidates[idx];
    let isRateLimitedBase = false;
    for (let qIdx = 0; qIdx < uniqueQueries.length; qIdx += 1) {
      if (isRateLimitedBase) break;
      const query = uniqueQueries[qIdx];
      const url = `${base}?${query}`;
      try {
        const response = await fetch(url, {
          method: "GET",
          credentials: "same-origin"
        });
        if (!response.ok) {
          if (response.status === 429) {
            wasRateLimited = true;
            isRateLimitedBase = true;
          }
          continue;
        }
        const payload = await response.json().catch(() => null);
        if (payload && typeof payload === "object") {
          if (cacheKey) {
            deviceEnergyPayloadCache.set(cacheKey, {
              payload,
              cachedAt: Date.now(),
              rateLimitedUntil: 0
            });
          }
          return payload;
        }
      } catch {
        // ignore network errors and continue with next candidate
      }
    }
  }

  if (cacheKey && wasRateLimited) {
    deviceEnergyPayloadCache.set(cacheKey, {
      payload: null,
      cachedAt: now,
      rateLimitedUntil: now + deviceEnergyRateLimitCooldownMs
    });
  }
  return null;
};
const buildCanonicalMonthDeviceEnergyQueries = (year, month) => {
  if (!Number.isFinite(selectedMeterId) || selectedMeterId <= 0) return [];
  const monthToken = buildMonthToken(year, month);
  const safeYear = resolveTargetYear(year);
  const safeMonth = resolveTargetMonth(month);
  const queries = [];
  if (monthToken) {
    queries.push(
      `device_id=${encodeURIComponent(selectedMeterId)}&period=month&month=${encodeURIComponent(
        monthToken
      )}`
    );
  }
  if (Number.isFinite(safeYear) && Number.isFinite(safeMonth)) {
    queries.push(
      `device_id=${encodeURIComponent(selectedMeterId)}&period=month&year=${encodeURIComponent(
        safeYear
      )}&month=${encodeURIComponent(safeMonth)}`
    );
  }
  return queries;
};
const buildCanonicalYearDeviceEnergyQueries = (year) => {
  if (!Number.isFinite(selectedMeterId) || selectedMeterId <= 0) return [];
  const safeYear = resolveTargetYear(year);
  if (!Number.isFinite(safeYear)) return [];
  return [
    `device_id=${encodeURIComponent(selectedMeterId)}&period=year&year=${encodeURIComponent(
      safeYear
    )}`
  ];
};
const fetchMonthDevicePayload = async (year, month) => {
  const monthToken = buildMonthToken(year, month);
  if (!monthToken) return null;
  const queries = buildCanonicalMonthDeviceEnergyQueries(year, month);
  const cacheKey = getDeviceEnergyPayloadCacheKey("month", monthToken);
  return fetchDeviceEnergyPayloadByQueries(queries, cacheKey);
};
const fetchYearDevicePayload = async (year) => {
  const safeYear = resolveTargetYear(year);
  if (!Number.isFinite(safeYear)) return null;
  const queries = buildCanonicalYearDeviceEnergyQueries(safeYear);
  const cacheKey = getDeviceEnergyPayloadCacheKey("year", String(safeYear));
  return fetchDeviceEnergyPayloadByQueries(queries, cacheKey);
};
const fetchMonthRows = async (year, month) => {
  const monthDevicePayload = await fetchMonthDevicePayload(year, month);
  const summaryMeta = extractSummaryMeta(monthDevicePayload);
  const monthRows = monthDevicePayload
    ? extractSeriesRows(monthDevicePayload, {
        scopedDeviceId: selectedMeterId
      })
    : [];
  if (monthRows.length) return attachSummaryMetaToRows(monthRows, summaryMeta);
  const queryCandidates = buildMonthQueryCandidates(year, month);
  return requestRowsFromCandidates(queryCandidates, extractSeriesRows);
};
const fetchMonthEnergyRows = async (year, month) => {
  const monthDevicePayload = await fetchMonthDevicePayload(year, month);
  const summaryMeta = extractSummaryMeta(monthDevicePayload);
  const monthEnergyRows = monthDevicePayload
    ? extractEnergyRows(monthDevicePayload, {
        scopedDeviceId: selectedMeterId
      })
    : [];
  if (monthEnergyRows.length) return attachSummaryMetaToRows(monthEnergyRows, summaryMeta);
  const queryCandidates = buildMonthQueryCandidates(year, month);
  return requestRowsFromCandidates(queryCandidates, extractEnergyRows);
};
const fetchYearRows = async (year) => {
  const yearDevicePayload = await fetchYearDevicePayload(year);
  const summaryMeta = extractSummaryMeta(yearDevicePayload);
  const yearRows = yearDevicePayload
    ? extractSeriesRows(yearDevicePayload, {
        scopedDeviceId: selectedMeterId
      })
    : [];
  if (yearRows.length) return attachSummaryMetaToRows(yearRows, summaryMeta);
  const queryCandidates = buildYearQueryCandidates(year);
  return requestRowsFromCandidates(queryCandidates, extractSeriesRows);
};
const buildPrimaryMonthQueryForYearFallback = (year, month) => {
  const monthToken = `${year}-${pad2(month)}`;
  const hasMeterId = Number.isFinite(selectedMeterId) && selectedMeterId > 0;
  const hasEnergyName = Boolean(selectedEnergyName);
  if (Number.isFinite(selectedSiteId) && selectedSiteId > 0) {
    if (hasMeterId) {
      return `site_id=${encodeURIComponent(
        selectedSiteId
      )}&device_id=${encodeURIComponent(selectedMeterId)}&period=month&month=${monthToken}`;
    }
    return `site_id=${encodeURIComponent(selectedSiteId)}&period=month&month=${monthToken}`;
  }
  if (hasMeterId) {
    if (hasEnergyName) {
      return `period=month&name=${encodeURIComponent(
        selectedEnergyName
      )}&month=${monthToken}&device_id=${encodeURIComponent(selectedMeterId)}`;
    }
    return `period=month&device_id=${encodeURIComponent(selectedMeterId)}&month=${monthToken}`;
  }
  if (hasEnergyName) {
    return `period=month&name=${encodeURIComponent(selectedEnergyName)}&month=${monthToken}`;
  }
  return "";
};
const fetchYearRowsByMonthFallback = async (year) => {
  const collected = [];
  for (let month = 1; month <= 12; month += 1) {
    const primaryQuery = buildPrimaryMonthQueryForYearFallback(year, month);
    const rows = await requestRowsFromCandidates([primaryQuery], extractSeriesRows);
    if (rows.length) collected.push(...rows);
  }
  return collected;
};
const buildDayQueryCandidates = (dateKey, year, month, day) => {
  const queryCandidates = [];
  const hasMeterId = Number.isFinite(selectedMeterId) && selectedMeterId > 0;
  const hasEnergyName = Boolean(selectedEnergyName);
  if (Number.isFinite(selectedSiteId) && selectedSiteId > 0) {
    if (hasMeterId) {
      queryCandidates.push(
        `site_id=${encodeURIComponent(
        selectedSiteId
      )}&period=day&date=${dateKey}&device_id=${encodeURIComponent(selectedMeterId)}`
      );
      queryCandidates.push(
        `site_id=${encodeURIComponent(
          selectedSiteId
        )}&period=day&year=${encodeURIComponent(year)}&month=${encodeURIComponent(
          month
        )}&day=${encodeURIComponent(day)}&device_id=${encodeURIComponent(selectedMeterId)}`
      );
    } else {
      queryCandidates.push(
        `site_id=${encodeURIComponent(selectedSiteId)}&period=day&date=${dateKey}`
      );
    }
  }
  if (hasMeterId) {
    if (hasEnergyName) {
      queryCandidates.push(
        `period=day&name=${encodeURIComponent(
          selectedEnergyName
        )}&date=${dateKey}&device_id=${encodeURIComponent(selectedMeterId)}`
      );
    }
    queryCandidates.push(
      `period=day&year=${encodeURIComponent(year)}&month=${encodeURIComponent(
        month
      )}&day=${encodeURIComponent(day)}&device_id=${encodeURIComponent(selectedMeterId)}`
    );
    queryCandidates.push(
      `period=day&device_id=${encodeURIComponent(selectedMeterId)}&date=${dateKey}`
    );
  } else if (hasEnergyName) {
    queryCandidates.push(
      `period=day&name=${encodeURIComponent(selectedEnergyName)}&date=${dateKey}`
    );
    queryCandidates.push(
      `period=day&year=${encodeURIComponent(year)}&month=${encodeURIComponent(
        month
      )}&day=${encodeURIComponent(day)}`
    );
  }
  return queryCandidates;
};
const resolveDayTargetDateKey = (dateKey, year, month, day) => {
  const normalized = normalizeDateKey(dateKey);
  if (normalized) return normalized;
  const safeYear = Number(year);
  const safeMonth = Number(month);
  const safeDay = Number(day);
  if (
    Number.isFinite(safeYear) &&
    Number.isFinite(safeMonth) &&
    Number.isFinite(safeDay) &&
    safeYear > 0 &&
    safeMonth >= 1 &&
    safeMonth <= 12 &&
    safeDay >= 1 &&
    safeDay <= 31
  ) {
    return `${Math.trunc(safeYear)}-${pad2(Math.trunc(safeMonth))}-${pad2(Math.trunc(safeDay))}`;
  }
  return "";
};
const buildCanonicalDayDeviceEnergyQuery = (dateKey, year, month, day) => {
  const targetDateKey = resolveDayTargetDateKey(dateKey, year, month, day);
  if (!targetDateKey || !Number.isFinite(selectedMeterId) || selectedMeterId <= 0) return "";
  return `device_id=${encodeURIComponent(selectedMeterId)}&period=day&date=${targetDateKey}`;
};
const getDayDevicePayloadCacheKey = (dateKey, year, month, day) => {
  const targetDateKey = resolveDayTargetDateKey(dateKey, year, month, day);
  return getDeviceEnergyPayloadCacheKey("day", targetDateKey);
};
const fetchDayDevicePayload = async (dateKey, year, month, day) => {
  if (!Number.isFinite(selectedMeterId) || selectedMeterId <= 0) return null;
  const query = buildCanonicalDayDeviceEnergyQuery(dateKey, year, month, day);
  if (!query) return null;
  const cacheKey = getDayDevicePayloadCacheKey(dateKey, year, month, day);
  return fetchDeviceEnergyPayloadByQueries([query], cacheKey);
};
const fetchDayRows = async (dateKey, year, month, day) => {
  const dayDevicePayload = await fetchDayDevicePayload(dateKey, year, month, day);
  const daySummaryMeta = extractSummaryMeta(dayDevicePayload);
  const dayDeviceRows = dayDevicePayload
    ? extractSeriesRows(dayDevicePayload, {
        scopedDeviceId: selectedMeterId
      })
    : [];
  if (dayDeviceRows.length) return attachSummaryMetaToRows(dayDeviceRows, daySummaryMeta);
  return requestRowsFromCandidates(
    buildDayQueryCandidates(dateKey, year, month, day),
    extractSeriesRows,
    dayFallbackEnergyApiCandidates
  );
};
const fetchDayEnergyRows = async (dateKey, year, month, day) => {
  const dayDevicePayload = await fetchDayDevicePayload(dateKey, year, month, day);
  const daySummaryMeta = extractSummaryMeta(dayDevicePayload);
  const dayDeviceRows = dayDevicePayload
    ? extractEnergyRows(dayDevicePayload, {
        scopedDeviceId: selectedMeterId
      })
    : [];
  if (dayDeviceRows.length) return attachSummaryMetaToRows(dayDeviceRows, daySummaryMeta);
  return requestRowsFromCandidates(
    buildDayQueryCandidates(dateKey, year, month, day),
    extractEnergyRows,
    dayFallbackEnergyApiCandidates
  );
};
const getSelectedYear = () => Number(yearSelect?.value || new Date().getFullYear());
const getSelectedMonth = () => Number(monthSelect?.value || new Date().getMonth() + 1);
const getSelectedDay = () => Number(daySelect?.value || new Date().getDate());
const getCurrentDateControlParts = () => {
  const nowParts = getDatePartsInTimeZone(new Date(), chartTimeZone);
  const fallbackNow = new Date();
  return {
    year: Number.isFinite(nowParts?.year) ? nowParts.year : fallbackNow.getFullYear(),
    month: Number.isFinite(nowParts?.month) ? nowParts.month : fallbackNow.getMonth() + 1,
    day: Number.isFinite(nowParts?.day) ? nowParts.day : fallbackNow.getDate()
  };
};
const resetDateControlsToCurrent = () => {
  if (!yearSelect || !monthSelect || !daySelect) return;
  const { year, month, day } = getCurrentDateControlParts();
  if (!Array.from(yearSelect.options).some((option) => option.value === String(year))) {
    yearSelect.insertAdjacentHTML("beforeend", `<option value="${year}">${year}</option>`);
  }
  yearSelect.value = String(year);
  monthSelect.value = String(month);
  updateDayOptions();
  daySelect.value = String(day);
};
const buildSingleDayEnergyPoint = (row, fallbackDateKey) => {
  if (!row || typeof row !== "object") return null;
  const dateKey = normalizeDateKey(row.dateKey) || normalizeDateKey(fallbackDateKey);
  if (!dateKey) return null;
  const dateParts = parseDateKeyParts(dateKey);
  const fallbackStamp = toDate(`${dateKey}T12:00:00`);
  const stampMsRaw = Number(row.stampMs);
  const stampMs =
    Number.isFinite(stampMsRaw) && stampMsRaw > 0
      ? stampMsRaw
      : fallbackStamp
      ? fallbackStamp.getTime()
      : null;
  return {
    idx: 0,
    dateKey,
    stampMs,
    label: dateParts ? `${pad2(dateParts.day)}/${pad2(dateParts.month)}` : dateKey,
    energyKwh: Math.max(0, parseNumber(row.energyKwh))
  };
};
const updateDayOptions = () => {
  if (!daySelect) return;
  const year = getSelectedYear();
  const month = getSelectedMonth();
  const prev = getSelectedDay();
  const days = new Date(year, month, 0).getDate();
  daySelect.innerHTML = Array.from({ length: days }, (_, idx) => {
    const day = idx + 1;
    return `<option value="${day}">${day}</option>`;
  }).join("");
  daySelect.value = String(Math.min(prev, days));
};
const updatePeriodUi = () => {
  periodButtons.forEach((button) => {
    const isActive = button.dataset.period === selectedPeriod;
    button.classList.toggle("active", isActive);
  });
  monthWrap?.classList.toggle("hidden", selectedPeriod === "year");
  dayWrap?.classList.toggle("hidden", selectedPeriod !== "day");
};
const loadChartBySelection = async () => {
  if (!chartBox) return;
  chartBox.textContent = "กำลังโหลดกราฟ...";
  setTotalKwhSingle("-");
  const year = getSelectedYear();
  const month = getSelectedMonth();
  const day = getSelectedDay();

  try {
    let rows = [];
    let chartOptions = {};
    const hasSelectedMeterId =
      Number.isFinite(selectedMeterId) && selectedMeterId > 0;
    const useSiteMonthAggregate =
      !hasSelectedMeterId && Number.isFinite(selectedSiteId) && selectedSiteId > 0;
    const monthDeviceIdFilter = selectedMeterId;

    if (selectedPeriod === "year") {
      let raw = await fetchYearRows(year);
      if (!raw.length) {
        raw = await fetchYearRowsByMonthFallback(year);
      }
      const rawYearMeta = raw && typeof raw === "object" ? raw.__summaryMeta : null;
      const hasYearEnergyInOut = rowsContainEnergyInOut(raw);
      const yearMetricUnit = readText(
        rawYearMeta?.unit,
        readLooseValue(raw?.[0], ["unit"])
      ) || "kWh";
      const yearlyRows = normalizeChartRows(raw, {
        period: "year",
        limit: 0,
        deviceId: monthDeviceIdFilter,
        ignoreMeterIdentity: useSiteMonthAggregate,
        forceDualMetrics: hasYearEnergyInOut,
        fallbackYear: year
      });
      rows = aggregateYearSeriesRowsByMonth(yearlyRows, { year });
      if (!rows.length) {
        rows = yearlyRows;
      }
      if (rows.length) {
        chartOptions = {
          ...chartOptions,
          forceFullDayXAxis: true
        };
        if (hasYearEnergyInOut) {
          chartOptions = {
            ...chartOptions,
            mode: "period-energy-dual",
            totalLabel: `สรุปพลังงานปี ${year}`,
            leftLegendLabel: "พลังงานที่ได้รับ",
            rightLegendLabel: "พลังงานที่จ่ายออก",
            metricUnit: yearMetricUnit,
            energyInTotal: rawYearMeta?.energyIn,
            energyOutTotal: rawYearMeta?.energyOut,
            ariaLabel: `กราฟพลังงานที่ได้รับและพลังงานที่จ่ายออก ปี ${year}`
          };
        }
      }
    }

    if (selectedPeriod === "month") {
      const targetYear = year;
      const targetMonth = month;
      const targetMonthLabel = `${targetYear}-${pad2(targetMonth)}`;
      const rawSeries = await fetchMonthRows(targetYear, targetMonth).catch(
        () => []
      );
      const rawMonthMeta =
        rawSeries && typeof rawSeries === "object" ? rawSeries.__summaryMeta : null;
      const hasMonthEnergyInOut = rowsContainEnergyInOut(rawSeries);
      const monthMetricUnit = readText(
        rawMonthMeta?.unit,
        readLooseValue(rawSeries?.[0], ["unit"])
      ) || "kWh";
      rows = normalizeChartRows(rawSeries, {
        period: "month",
        limit: 62,
        deviceId: monthDeviceIdFilter,
        ignoreMeterIdentity: useSiteMonthAggregate,
        forceDualMetrics: hasMonthEnergyInOut,
        fallbackYear: targetYear,
        fallbackMonth: targetMonth
      });
      let summaryLabel = `รวมเดือน ${targetMonthLabel}`;
      let ariaLabel = `กราฟพลังงานรายวันจาก energy_total ของเดือน ${targetMonthLabel}`;
      let emptyMessage = `ไม่พบข้อมูลเดือน ${targetMonthLabel}`;
      let useMonthEnergyMode = false;
      if (!rows.length) {
        const raw = await fetchMonthEnergyRows(targetYear, targetMonth).catch(
          () => []
        );
        rows = normalizeMonthlyEnergyRows(raw, {
          year: targetYear,
          month: targetMonth,
          deviceId: monthDeviceIdFilter,
          ignoreMeterIdentity: useSiteMonthAggregate
        });
        useMonthEnergyMode = rows.length > 0;
        if (raw.length) {
          if (!hasSelectedMeterId) {
            const fallbackRows = normalizeMonthlyEnergyRows(raw, {
              deviceId: monthDeviceIdFilter,
              ignoreMeterIdentity: useSiteMonthAggregate
            });
            if (fallbackRows.length) {
              rows = fallbackRows;
              useMonthEnergyMode = true;
              const fallbackMonth = summarizeMonthFromRows(fallbackRows);
              if (fallbackMonth) {
                summaryLabel = `รวมเดือน ${fallbackMonth}`;
                ariaLabel = `กราฟพลังงานรายวันจาก energy_total ของเดือน ${fallbackMonth}`;
              } else {
                summaryLabel = "รวมช่วงข้อมูลล่าสุด";
                ariaLabel = "กราฟพลังงานรายวันจาก energy_total (ช่วงข้อมูลล่าสุด)";
              }
              emptyMessage = "ไม่พบข้อมูลของมิเตอร์ที่เลือก";
            } else {
              const range = summarizeCreatedAtRange(raw, chartTimeZone);
              emptyMessage = range
                ? `API มีข้อมูลช่วง ${range} แต่ยังไม่ตรงมิเตอร์ที่เลือก`
                : "API มีข้อมูล แต่ยังไม่ตรงมิเตอร์ที่เลือก";
            }
          }
        }
        if (!rows.length) {
          const fallbackDate = `${targetYear}-${pad2(targetMonth)}-${pad2(day)}`;
          const dayRows = await fetchDayRows(
            fallbackDate,
            targetYear,
            targetMonth,
            day
          ).catch(() => []);
          if (dayRows.length) {
            rows = normalizeChartRows(dayRows, {
              period: "day",
              limit: 288,
              deviceId: monthDeviceIdFilter,
              ignoreMeterIdentity: useSiteMonthAggregate
            });
            useMonthEnergyMode = false;
          }
        }
      }
      if (useMonthEnergyMode) {
        chartOptions = {
          mode: "month-energy",
          totalLabel: summaryLabel,
          latestLabel: "ล่าสุดต่อวัน",
          emptyMessage,
          ariaLabel
        };
      } else {
        chartOptions = {};
      }
      if (!useMonthEnergyMode && rows.length && hasMonthEnergyInOut) {
        chartOptions = {
          ...chartOptions,
          mode: "period-energy-dual",
          totalLabel: `สรุปพลังงานเดือน ${targetMonthLabel}`,
          leftLegendLabel: "พลังงานที่ได้รับ",
          rightLegendLabel: "พลังงานที่จ่ายออก",
          metricUnit: monthMetricUnit,
          energyInTotal: rawMonthMeta?.energyIn,
          energyOutTotal: rawMonthMeta?.energyOut,
          ariaLabel: `กราฟพลังงานที่ได้รับและพลังงานที่จ่ายออก เดือน ${targetMonthLabel}`
        };
      }
      if (rows.length) {
        rows = normalizeRowsForFullMonthXAxis(rows, {
          year: targetYear,
          month: targetMonth,
          mode: useMonthEnergyMode ? "energy" : "series"
        });
        chartOptions = {
          ...chartOptions,
          forceFullDayXAxis: true
        };
      }
    }

    if (selectedPeriod === "day") {
      const target = `${year}-${pad2(month)}-${pad2(day)}`;
      const raw = await fetchDayRows(target, year, month, day);
      const rawDayMeta = raw && typeof raw === "object" ? raw.__summaryMeta : null;
      const hasExplicitEnergyInOut = rowsContainEnergyInOut(raw);
      const dayMetricUnit = readText(
        rawDayMeta?.unit,
        readLooseValue(raw?.[0], ["unit"])
      ) || "kWh";
      rows = normalizeChartRows(raw, {
        period: "day",
        limit: 288,
        deviceId: selectedMeterId,
        forceDualMetrics: hasExplicitEnergyInOut
      });
      if (rows.length && hasExplicitEnergyInOut) {
        chartOptions = {
          mode: "day-energy-dual",
          totalLabel: "สรุปพลังงานวันนี้",
          leftLegendLabel: "พลังงานที่ได้รับ",
          rightLegendLabel: "พลังงานที่จ่ายออก",
          metricUnit: dayMetricUnit,
          energyInTotal: rawDayMeta?.energyIn,
          energyOutTotal: rawDayMeta?.energyOut,
          ariaLabel: `กราฟพลังงานที่ได้รับและพลังงานที่จ่ายออก วันที่ ${target}`
        };
      }
      const hasSeriesValues = rows.some(
        (row) =>
          parseFiniteNumber(row?.solarIn) !== null ||
          parseFiniteNumber(row?.selfUse) !== null
      );
      if (!rows.length || !hasSeriesValues) {
        const rawEnergy = await fetchDayEnergyRows(
          target,
          year,
          month,
          day
        ).catch(() => []);
        if (rawEnergy.length) {
          rows = normalizeDailyEnergyRows(rawEnergy, {
            dateKey: target,
            deviceId: selectedMeterId
          });
          chartOptions = {
            mode: "day-energy",
            totalStrategy: "delta",
            totalLabel: `ผลิตวันที่ ${target}`,
            latestLabel: "ล่าสุดสะสม",
            legendLabel: "พลังงานสะสมรายวัน (kWh)",
            emptyMessage: `ไม่พบข้อมูลวันที่ ${target}`,
            ariaLabel: `กราฟพลังงานสะสมรายวันวันที่ ${target}`
          };
        }
      }
      if (!rows.length) {
        const monthEnergy = await fetchMonthEnergyRows(year, month).catch(() => []);
        if (monthEnergy.length) {
          const monthRows = normalizeMonthlyEnergyRows(monthEnergy, {
            year,
            month,
            deviceId: selectedMeterId
          });
          const matchedDayRow = monthRows.find(
            (row) => normalizeDateKey(row?.dateKey) === target
          );
          const singlePoint = buildSingleDayEnergyPoint(matchedDayRow, target);
          if (singlePoint) {
            rows = [singlePoint];
            chartOptions = {
              mode: "day-energy",
              totalStrategy: "sum",
              totalLabel: `ผลิตวันที่ ${target}`,
              latestLabel: "พลังงานของวัน",
              legendLabel: "พลังงานผลิตรายวัน (kWh)",
              emptyMessage: `ไม่พบข้อมูลวันที่ ${target}`,
              ariaLabel: `กราฟพลังงานผลิตรายวันวันที่ ${target}`
            };
          }
        }
      }
    }

    if (selectedPeriod === "day" && rows.length) {
      const dayKey = `${year}-${pad2(month)}-${pad2(day)}`;
      const isDayEnergyRows =
        chartOptions.mode === "day-energy" ||
        rows.some((row) => Number.isFinite(Number(row?.energyKwh)));
      rows = normalizeRowsForFullDayXAxis(rows, {
        mode: isDayEnergyRows ? "energy" : "series",
        dateKey: dayKey
      });
      chartOptions = {
        ...chartOptions,
        forceFullDayXAxis: true
      };
    }

    renderChart(rows, chartOptions);
  } catch (error) {
    chartBox.textContent = `โหลดกราฟไม่สำเร็จ (${error.message})`;
    setTotalKwhSingle("-");
    console.warn("Failed to load chart", error);
  }
};
const initDateControls = () => {
  if (!yearSelect || !monthSelect || !daySelect) return;
  const { year: currentYear } = getCurrentDateControlParts();

  yearSelect.innerHTML = Array.from({ length: 8 }, (_, idx) => {
    const value = currentYear - 4 + idx;
    return `<option value="${value}">${value}</option>`;
  }).join("");
  yearSelect.value = String(currentYear);

  monthSelect.innerHTML = thaiMonthFull
    .map((label, idx) => `<option value="${idx + 1}">${label}</option>`)
    .join("");
  resetDateControlsToCurrent();
};

if (!meterData) {
  meterNameEl.textContent = "ไม่พบข้อมูลมิเตอร์";
} else {
  meterNameEl.textContent = meterData.name || "Meter";
}

initDateControls();
updatePeriodUi();

periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.period;
    if (!target || target === selectedPeriod) return;
    selectedPeriod = target;
    if (target === "day" || target === "month" || target === "year") {
      resetDateControlsToCurrent();
    }
    updatePeriodUi();
    loadChartBySelection();
  });
});
yearSelect?.addEventListener("change", () => {
  updateDayOptions();
  loadChartBySelection();
});
monthSelect?.addEventListener("change", () => {
  updateDayOptions();
  loadChartBySelection();
});
daySelect?.addEventListener("change", () => {
  loadChartBySelection();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  refreshMeterLiveSummary();
});
window.addEventListener("beforeunload", stopMeterLivePolling);

loadChartBySelection();
startMeterLivePolling();
