const backBtn = document.getElementById("back-meter");
backBtn?.addEventListener("click", () => {
  window.location.href = "./plant.html";
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
const chipStatus = document.getElementById("meter-status");
const chipSn = document.getElementById("meter-sn");
const plantRef = document.getElementById("plant-ref");
const metaPlant = document.getElementById("meta-plant");
const metaSn = document.getElementById("meta-sn");
const metaStatus = document.getElementById("meta-status");
const chartBox = document.getElementById("chart-box");
const totalKwhValue = document.getElementById("total-kwh-value");

const periodSwitch = document.getElementById("chart-period-switch");
const periodButtons = Array.from(
  periodSwitch?.querySelectorAll(".period-btn") || []
);
const yearSelect = document.getElementById("chart-year");
const monthSelect = document.getElementById("chart-month");
const daySelect = document.getElementById("chart-day");
const monthWrap = document.getElementById("chart-month-wrap");
const dayWrap = document.getElementById("chart-day-wrap");
const chartLoadBtn = document.getElementById("chart-load-btn");

const energyApiCandidates = ["/api/energy"];
const fallbackPlantName = "CNX_PPA";
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

let selectedPeriod = "day";
const readStrictPositiveId = (value) => {
  if (Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!/^\d+$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const selectedMeterId = (() => {
  const candidates = [
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
const readLooseNumber = (row, keys) => {
  const value = readLooseValue(row, keys);
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
};
const readSolarSeriesValue = (row) => {
  return readLooseNumber(row, [
    "solar_in",
    "solarIn",
    "solar in",
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
    "self use",
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
const selectedEnergyName = readText(
  meterData?.sn,
  meterData?.name,
  plantData?.siteCode,
  plantData?.site_code,
  plantData?.name
) || fallbackPlantName;
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
const formatTotalKwh = (value) => `${formatMetric(value)} kWh`;
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
    .map((row) =>
      toDate(
        readLooseValue(row, ["created_at", "createdAt", "datetime", "timestamp", "ts", "time"])
      )
    )
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
const rowsContainExplicitDeviceId = (rows) =>
  (Array.isArray(rows) ? rows : []).some((row) => {
    const id = readRowDeviceId(row);
    return Number.isFinite(id) && id > 0;
  });
const rowMatchesSelectedMeter = (row, wantedDeviceId, options = {}) => {
  const strictDeviceId = Boolean(options.strictDeviceId);
  const rowDeviceId = readRowDeviceId(row);
  if (
    Number.isFinite(wantedDeviceId) &&
    wantedDeviceId > 0 &&
    Number.isFinite(rowDeviceId)
  ) {
    return rowDeviceId === wantedDeviceId;
  }
  if (strictDeviceId && Number.isFinite(wantedDeviceId) && wantedDeviceId > 0) {
    return false;
  }
  const rowDeviceName = normalizeIdentityToken(
    readLooseValue(row, ["device_name", "deviceName", "meter_name", "meterName", "name"])
  );
  const rowDeviceSn = normalizeIdentityToken(
    readLooseValue(
      row,
      ["device_sn", "deviceSn", "sn", "serial", "modbus_address_in", "modbusAddressIn"]
    )
  );
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
  const hasRowIdentity = Boolean(
    (Number.isFinite(rowDeviceId) && rowDeviceId > 0) ||
      rowDeviceName ||
      rowDeviceSn ||
      rowDeviceTypeKey
  );
  if (selectedMeterTypeKey && rowDeviceTypeKey) {
    return rowDeviceTypeKey === selectedMeterTypeKey;
  }
  if (Number.isFinite(wantedDeviceId) && wantedDeviceId > 0) {
    if (!hasRowIdentity) return true;
    const hasIdentityHints = Boolean(
      selectedMeterNameKey || selectedMeterSnKey || selectedMeterTypeKey
    );
    return !hasIdentityHints;
  }
  return true;
};
const resolveRowDateKey = (row) => {
  const explicit = normalizeDateKey(readLooseValue(row, ["date", "day"]));
  if (explicit) return explicit;
  const stamp = toDate(
    readLooseValue(row, [
      "datetime",
      "timestamp",
      "ts",
      "time",
      "created_at",
      "createdAt"
    ])
  );
  return stamp ? formatDateKey(stamp, chartTimeZone) : "";
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
const rowHasEnergyTotal = (row) =>
  row &&
  typeof row === "object" &&
  !Array.isArray(row) &&
  readEnergyTotalValue(row) !== null;
const extractSeriesRows = (payload) => {
  if (!payload || typeof payload !== "object") return [];
  const queue = [payload];
  const rows = [];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    if (rowHasSeries(current)) rows.push(current);
    Object.values(current).forEach((value) => {
      if (value && typeof value === "object") queue.push(value);
    });
  }
  return rows;
};
const extractEnergyRows = (payload) => {
  if (!payload || typeof payload !== "object") return [];
  const queue = [payload];
  const rows = [];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    if (rowHasEnergyTotal(current)) rows.push(current);
    Object.values(current).forEach((value) => {
      if (value && typeof value === "object") queue.push(value);
    });
  }
  return rows;
};
const normalizeMonthlyEnergyRows = (rows, { year, month, deviceId } = {}) => {
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
        const directStamp = toDate(
          readLooseValue(row, [
            "created_at",
            "createdAt",
            "datetime",
            "timestamp",
            "ts",
            "time"
          ])
        );
        const dateKey = resolveRowDateKey(row);
        const fallbackDate = dateKey ? toDate(`${dateKey}T00:00:00`) : null;
        const stamp = directStamp || fallbackDate;
        const energyTotal = readEnergyTotalValue(row);
        const stampParts = getDatePartsInTimeZone(stamp, chartTimeZone);
        if (!stamp || energyTotal === null) return null;
        if (!stampParts) return null;
        if (Number.isFinite(targetYear) && stampParts.year !== targetYear) return null;
        if (Number.isFinite(targetMonth) && stampParts.month !== targetMonth) return null;
        if (
          !rowMatchesSelectedMeter(row, wantedDeviceId, {
            strictDeviceId: useStrictDeviceId
          })
        ) {
          return null;
        }
        return {
          idx,
          stampMs: stamp.getTime(),
          dateKey: formatDateKey(stamp, chartTimeZone),
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
          max: row.energyTotal
        });
        return;
      }
      current.stampMs = Math.max(current.stampMs, row.stampMs);
      current.min = Math.min(current.min, row.energyTotal);
      current.max = Math.max(current.max, row.energyTotal);
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
        energyKwh: Math.max(0, row.max - row.min)
      }));
  };

  const strictResult = normalizeWithFilterMode(strictDeviceId);
  if (strictResult.length || !strictDeviceId) return strictResult;
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
        const stamp = toDate(
          readLooseValue(row, [
            "created_at",
            "createdAt",
            "datetime",
            "timestamp",
            "ts",
            "time"
          ])
        );
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
  return normalizeWithFilterMode(false);
};
const normalizeChartRows = (
  rows,
  { period = "month", limit = 120, deviceId = selectedMeterId } = {}
) => {
  const wantedDeviceId = Number(deviceId);
  const sourceRows = Array.isArray(rows) ? rows : [];
  const strictDeviceId =
    Number.isFinite(wantedDeviceId) &&
    wantedDeviceId > 0 &&
    rowsContainExplicitDeviceId(sourceRows);

  const normalizeWithFilterMode = (useStrictDeviceId) => {
    const normalized = sourceRows
      .map((row, idx) => {
        if (
          !rowMatchesSelectedMeter(row, wantedDeviceId, {
            strictDeviceId: useStrictDeviceId
          })
        ) {
          return null;
        }
        const stamp = toDate(
          readLooseValue(row, [
            "datetime",
            "timestamp",
            "ts",
            "time",
            "created_at",
            "createdAt"
          ])
        );
        const dateKey = resolveRowDateKey(row);
        return {
          idx,
          stampMs: stamp ? stamp.getTime() : null,
          dateKey,
          label: formatAxisLabel(
            { dateKey, stampMs: stamp ? stamp.getTime() : null },
            period,
            idx
          ),
          solarIn: readSolarSeriesValue(row) ?? 0,
          selfUse: readGridSeriesValue(row) ?? 0
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
      const prev = deduped[deduped.length - 1];
      if (
        prev &&
        prev.dateKey === row.dateKey &&
        prev.solarIn === row.solarIn &&
        prev.selfUse === row.selfUse
      ) {
        return;
      }
      deduped.push(row);
    });

    return limit > 0 ? deduped.slice(-limit) : deduped;
  };

  const strictResult = normalizeWithFilterMode(strictDeviceId);
  if (strictResult.length || !strictDeviceId) return strictResult;
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
  return Array.from(monthly.values())
    .sort((a, b) => (a.year === b.year ? a.month - b.month : a.year - b.year))
    .map((row, idx) => {
      const stamp = toDate(`${row.year}-${pad2(row.month)}-01T00:00:00`);
      return {
        idx,
        stampMs: stamp ? stamp.getTime() : null,
        dateKey: `${row.year}-${pad2(row.month)}-01`,
        label: thaiMonthShort[row.month - 1] || `เดือน ${row.month}`,
        solarIn: row.solarIn,
        selfUse: row.selfUse
      };
    });
};
const escapeText = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const buildPath = (series, xAt, yAt) =>
  series.map((value, idx) => `${idx ? "L" : "M"} ${xAt(idx)} ${yAt(value)}`).join(" ");
const buildDots = (series, xAt, yAt, color) =>
  series
    .map(
      (value, idx) =>
        `<circle cx="${xAt(idx)}" cy="${yAt(value)}" r="3.6" fill="${color}" stroke="#ffffff" stroke-width="1.4"></circle>`
    )
    .join("");
const renderChart = (rows, options = {}) => {
  if (!chartBox) return;
  const isEnergyMode =
    options.mode === "month-energy" ||
    options.mode === "day-energy" ||
    rows.some((row) => Number.isFinite(Number(row?.energyKwh)));
  if (isEnergyMode) {
    const energySeries = rows.map((row) => parseNumber(row.energyKwh));
    const totalStrategy = readText(options.totalStrategy) || "sum";
    const totalEnergy =
      totalStrategy === "delta" && energySeries.length
        ? (() => {
            const maxValue = Math.max(...energySeries);
            const minValue = Math.min(...energySeries);
            const delta = Math.max(0, maxValue - minValue);
            if (delta > 0) return delta;
            return Math.max(0, energySeries[energySeries.length - 1] || 0);
          })()
        : energySeries.reduce((sum, value) => sum + value, 0);
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
    if (totalKwhValue) totalKwhValue.textContent = formatTotalKwh(totalEnergy);
    if (!rows.length) {
      chartBox.textContent = emptyMessage;
      return;
    }

    let min = Math.min(...energySeries);
    let max = Math.max(...energySeries);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const labels = rows.map((row) => row.label);
    const width = 920;
    const height = 300;
    const padLeft = 52;
    const padRight = 18;
    const padTop = 16;
    const padBottom = 46;
    const innerWidth = width - padLeft - padRight;
    const innerHeight = height - padTop - padBottom;
    const xAt = (index) =>
      padLeft +
      (labels.length <= 1 ? innerWidth / 2 : (index * innerWidth) / (labels.length - 1));
    const yAt = (value) => padTop + ((max - value) * innerHeight) / (max - min);

    const ticks = 4;
    const yTicks = Array.from({ length: ticks + 1 }, (_, idx) => {
      const ratio = idx / ticks;
      const value = max - (max - min) * ratio;
      const y = padTop + ratio * innerHeight;
      return { y, value };
    });
    const maxXLabels = 7;
    const xStep = Math.max(1, Math.ceil(labels.length / maxXLabels));
    const xTicks = labels
      .map((label, idx) => ({ label, idx }))
      .filter(({ idx }) => idx % xStep === 0 || idx === labels.length - 1);

    const energyColor = "#0f63d4";
    const energyPath = buildPath(energySeries, xAt, yAt);
    const energyDots = buildDots(energySeries, xAt, yAt, energyColor);
    const latest = energySeries[energySeries.length - 1] || 0;

    chartBox.innerHTML = `
      <div class="meter-chart">
        <div class="meter-chart-legend">
          <span><i style="background:${energyColor}"></i>${escapeText(legendLabel)}</span>
        </div>
        <svg viewBox="0 0 ${width} ${height}" class="meter-chart-svg" role="img" aria-label="${escapeText(
          ariaLabel
        )}">
          <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
          ${yTicks
            .map(
              ({ y, value }) => `
              <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#dbe4f5" stroke-width="1"></line>
              <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${formatMetric(
                value
              )}</text>
            `
            )
            .join("")}
          <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="#93a6c8" stroke-width="1.2"></line>
          ${xTicks
            .map(
              ({ label, idx }) => `
              <text x="${xAt(idx)}" y="${height - 22}" text-anchor="middle" font-size="11" fill="#6b7280">${escapeText(
                label
              )}</text>
            `
            )
            .join("")}
          <path d="${energyPath}" fill="none" stroke="${energyColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
          ${energyDots}
        </svg>
        <div class="meter-chart-summary">
          <span>${escapeText(totalLabel)}: <strong>${formatMetric(totalEnergy)}</strong></span>
          <span>${escapeText(latestLabel)}: <strong>${formatMetric(latest)}</strong></span>
        </div>
      </div>
    `;
    return;
  }

  if (totalKwhValue) totalKwhValue.textContent = formatTotalKwh(
    rows.reduce(
      (sum, row) => sum + parseNumber(row?.solarIn) + parseNumber(row?.selfUse),
      0
    )
  );
  if (!rows.length) {
    chartBox.textContent = "ไม่พบข้อมูลในช่วงที่เลือก";
    return;
  }

  const labels = rows.map((row) => row.label);
  const solarSeries = rows.map((row) => row.solarIn);
  const selfUseSeries = rows.map((row) => row.selfUse);
  const allValues = [...solarSeries, ...selfUseSeries];
  let min = Math.min(...allValues);
  let max = Math.max(...allValues);
  if (min === max) {
    min -= 1;
    max += 1;
  }

  const width = 920;
  const height = 300;
  const padLeft = 52;
  const padRight = 18;
  const padTop = 16;
  const padBottom = 46;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const xAt = (index) =>
    padLeft + (labels.length <= 1 ? innerWidth / 2 : (index * innerWidth) / (labels.length - 1));
  const yAt = (value) => padTop + ((max - value) * innerHeight) / (max - min);

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, idx) => {
    const ratio = idx / ticks;
    const value = max - (max - min) * ratio;
    const y = padTop + ratio * innerHeight;
    return { y, value };
  });
  const maxXLabels = 7;
  const xStep = Math.max(1, Math.ceil(labels.length / maxXLabels));
  const xTicks = labels
    .map((label, idx) => ({ label, idx }))
    .filter(({ idx }) => idx % xStep === 0 || idx === labels.length - 1);

  const solarColor = "#f59e0b";
  const selfUseColor = "#0f63d4";
  const solarPath = buildPath(solarSeries, xAt, yAt);
  const selfUsePath = buildPath(selfUseSeries, xAt, yAt);
  const solarDots = buildDots(solarSeries, xAt, yAt, solarColor);
  const selfUseDots = buildDots(selfUseSeries, xAt, yAt, selfUseColor);

  chartBox.innerHTML = `
    <div class="meter-chart">
      <div class="meter-chart-legend">
        <span><i style="background:${solarColor}"></i>โซลาร์ผลิต (kW)</span>
        <span><i style="background:${selfUseColor}"></i>ใช้ไฟจากการไฟฟ้า (kW)</span>
      </div>
      <svg viewBox="0 0 ${width} ${height}" class="meter-chart-svg" role="img" aria-label="กราฟโซลาร์ผลิตและใช้ไฟจากการไฟฟ้า">
        <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
        ${yTicks
          .map(
            ({ y, value }) => `
            <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#dbe4f5" stroke-width="1"></line>
            <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${formatMetric(
              value
            )}</text>
          `
          )
          .join("")}
        <line x1="${padLeft}" y1="${height - padBottom}" x2="${width - padRight}" y2="${height - padBottom}" stroke="#93a6c8" stroke-width="1.2"></line>
        ${xTicks
          .map(
            ({ label, idx }) => `
            <text x="${xAt(idx)}" y="${height - 22}" text-anchor="middle" font-size="11" fill="#6b7280">${escapeText(
              label
            )}</text>
          `
          )
          .join("")}
        <path d="${solarPath}" fill="none" stroke="${solarColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
        <path d="${selfUsePath}" fill="none" stroke="${selfUseColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
        ${solarDots}
        ${selfUseDots}
      </svg>
      <div class="meter-chart-summary">
        <span>โซลาร์ผลิตล่าสุด: <strong>${formatMetric(solarSeries[solarSeries.length - 1])}</strong></span>
        <span>ใช้ไฟจากการไฟฟ้าล่าสุด: <strong>${formatMetric(selfUseSeries[selfUseSeries.length - 1])}</strong></span>
      </div>
    </div>
  `;
};

const requestRowsFromCandidates = async (queryCandidates, extractor) => {
  const uniqueQueries = [...new Set((Array.isArray(queryCandidates) ? queryCandidates : []).filter(Boolean))];
  const errors = [];
  let hadOkResponse = false;
  for (let b = 0; b < energyApiCandidates.length; b += 1) {
    const base = energyApiCandidates[b];
    for (let i = 0; i < uniqueQueries.length; i += 1) {
      const query = uniqueQueries[i];
      const url = `${base}?${query}`;
      try {
        const response = await fetch(url, {
          method: "GET",
          credentials: "same-origin"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        hadOkResponse = true;
        const payload = await response.json();
        const rows = typeof extractor === "function" ? extractor(payload) : [];
        if (rows.length) return rows;
      } catch (error) {
        errors.push(`${url}: ${error?.message || "unknown error"}`);
      }
    }
  }
  if (hadOkResponse) return [];
  if (errors.length) throw new Error(errors.slice(0, 8).join(" | "));
  return [];
};
const buildMonthQueryCandidates = (year, month) => {
  const monthToken = `${year}-${pad2(month)}`;
  const queryCandidates = [];
  if (Number.isFinite(selectedSiteId) && selectedSiteId > 0) {
    queryCandidates.push(
      `site_id=${encodeURIComponent(selectedSiteId)}&period=month&month=${monthToken}`
    );
    queryCandidates.push(
      `site_id=${encodeURIComponent(
        selectedSiteId
      )}&period=month&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`
    );
  }
  queryCandidates.push(
    `period=month&name=${encodeURIComponent(selectedEnergyName)}&month=${monthToken}`
  );
  return queryCandidates;
};
const fetchMonthRows = async (year, month) => {
  const queryCandidates = buildMonthQueryCandidates(year, month);
  return requestRowsFromCandidates(queryCandidates, extractSeriesRows);
};
const fetchMonthEnergyRows = async (year, month) => {
  const queryCandidates = buildMonthQueryCandidates(year, month);
  return requestRowsFromCandidates(queryCandidates, extractEnergyRows);
};
const buildDayQueryCandidates = (dateKey, year, month, day) => {
  const queryCandidates = [];
  if (Number.isFinite(selectedSiteId) && selectedSiteId > 0) {
    queryCandidates.push(
      `site_id=${encodeURIComponent(selectedSiteId)}&period=day&date=${dateKey}`
    );
    if (Number.isFinite(selectedMeterId) && selectedMeterId > 0) {
      queryCandidates.push(
        `site_id=${encodeURIComponent(
          selectedSiteId
        )}&period=day&date=${dateKey}&device_id=${encodeURIComponent(selectedMeterId)}`
      );
    }
  }
  queryCandidates.push(
    `period=day&name=${encodeURIComponent(selectedEnergyName)}&date=${dateKey}`
  );
  queryCandidates.push(
    `period=day&year=${encodeURIComponent(year)}&month=${encodeURIComponent(
      month
    )}&day=${encodeURIComponent(day)}`
  );
  return queryCandidates;
};
const fetchDayRows = async (dateKey, year, month, day) => {
  return requestRowsFromCandidates(
    buildDayQueryCandidates(dateKey, year, month, day),
    extractSeriesRows
  );
};
const fetchDayEnergyRows = async (dateKey, year, month, day) => {
  return requestRowsFromCandidates(
    buildDayQueryCandidates(dateKey, year, month, day),
    extractEnergyRows
  );
};
const getSelectedYear = () => Number(yearSelect?.value || new Date().getFullYear());
const getSelectedMonth = () => Number(monthSelect?.value || new Date().getMonth() + 1);
const getSelectedDay = () => Number(daySelect?.value || new Date().getDate());
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
  if (totalKwhValue) totalKwhValue.textContent = "-";
  const year = getSelectedYear();
  const month = getSelectedMonth();
  const day = getSelectedDay();

  try {
    let rows = [];
    let chartOptions = {};

    if (selectedPeriod === "year") {
      const raw = [];
      const monthErrors = [];
      for (let m = 1; m <= 12; m += 1) {
        try {
          const monthRows = await fetchMonthRows(year, m);
          raw.push(...monthRows);
        } catch (error) {
          monthErrors.push(`${year}-${pad2(m)}: ${error.message}`);
        }
      }
      if (!raw.length && monthErrors.length) {
        throw new Error(monthErrors.join(" | "));
      }
      const yearlyRows = normalizeChartRows(raw, {
        period: "year",
        limit: 0,
        deviceId: selectedMeterId
      });
      rows = aggregateYearSeriesRowsByMonth(yearlyRows, { year });
      if (!rows.length) {
        rows = yearlyRows;
      }
    }

    if (selectedPeriod === "month") {
      const targetYear = year;
      const targetMonth = month;
      const targetMonthLabel = `${targetYear}-${pad2(targetMonth)}`;
      const raw = await fetchMonthEnergyRows(targetYear, targetMonth);
      rows = normalizeMonthlyEnergyRows(raw, {
        year: targetYear,
        month: targetMonth,
        deviceId: selectedMeterId
      });
      let summaryLabel = `รวมเดือน ${targetMonthLabel}`;
      let ariaLabel = `กราฟพลังงานรายวันจาก energy_total ของเดือน ${targetMonthLabel}`;
      let emptyMessage = `ไม่พบข้อมูลเดือน ${targetMonthLabel}`;
      let useMonthEnergyMode = true;
      if (!rows.length) {
        if (raw.length) {
          const fallbackRows = normalizeMonthlyEnergyRows(raw, {
            deviceId: selectedMeterId
          });
          if (fallbackRows.length) {
            rows = fallbackRows;
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
        if (!rows.length) {
          const rawSeries = await fetchMonthRows(targetYear, targetMonth).catch(
            () => []
          );
          if (rawSeries.length) {
            rows = normalizeChartRows(rawSeries, {
              period: "month",
              limit: 62,
              deviceId: selectedMeterId
            });
            useMonthEnergyMode = false;
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
              deviceId: selectedMeterId
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
    }

    if (selectedPeriod === "day") {
      const target = `${year}-${pad2(month)}-${pad2(day)}`;
      const raw = await fetchDayRows(target, year, month, day);
      rows = normalizeChartRows(raw, {
        period: "day",
        limit: 288,
        deviceId: selectedMeterId
      });
      if (!rows.length) {
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

    renderChart(rows, chartOptions);
  } catch (error) {
    chartBox.textContent = `โหลดกราฟไม่สำเร็จ (${error.message})`;
    if (totalKwhValue) totalKwhValue.textContent = "-";
    console.warn("Failed to load chart", error);
  }
};
const initDateControls = () => {
  if (!yearSelect || !monthSelect || !daySelect) return;
  const nowParts = getDatePartsInTimeZone(new Date(), chartTimeZone);
  const currentYear = Number.isFinite(nowParts?.year)
    ? nowParts.year
    : new Date().getFullYear();
  const currentMonth = Number.isFinite(nowParts?.month)
    ? nowParts.month
    : new Date().getMonth() + 1;
  const currentDay = Number.isFinite(nowParts?.day)
    ? nowParts.day
    : new Date().getDate();

  yearSelect.innerHTML = Array.from({ length: 8 }, (_, idx) => {
    const value = currentYear - 4 + idx;
    return `<option value="${value}">${value}</option>`;
  }).join("");
  yearSelect.value = String(currentYear);

  monthSelect.innerHTML = thaiMonthShort
    .map(
      (label, idx) => `<option value="${idx + 1}">${idx + 1} - ${label}</option>`
    )
    .join("");
  monthSelect.value = String(currentMonth);

  updateDayOptions();
  daySelect.value = String(currentDay);
};

if (!meterData) {
  meterNameEl.textContent = "ไม่พบข้อมูลมิเตอร์";
  chipStatus.textContent = "N/A";
  chipSn.textContent = "-";
  plantRef.textContent = plantData?.name || fallbackPlantName;
  metaPlant.textContent = plantData?.name || fallbackPlantName;
  metaSn.textContent = "-";
  metaStatus.textContent = "-";
} else {
  meterNameEl.textContent = meterData.name || "Meter";
  chipStatus.textContent = meterData.status || "unknown";
  chipSn.textContent = meterData.sn || "-";
  plantRef.textContent = plantData?.name || fallbackPlantName;
  metaPlant.textContent = plantData?.name || fallbackPlantName;
  metaSn.textContent = meterData.sn || "-";
  metaStatus.textContent = meterData.status || "-";
}

initDateControls();
updatePeriodUi();

periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.period;
    if (!target || target === selectedPeriod) return;
    selectedPeriod = target;
    updatePeriodUi();
    loadChartBySelection();
  });
});
yearSelect?.addEventListener("change", () => {
  updateDayOptions();
});
monthSelect?.addEventListener("change", () => {
  updateDayOptions();
});
chartLoadBtn?.addEventListener("click", () => {
  loadChartBySelection();
});

loadChartBySelection();
