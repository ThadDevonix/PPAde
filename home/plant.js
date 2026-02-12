const backBtn = document.getElementById("back-btn");
backBtn?.addEventListener("click", () => {
  window.location.href = "./index.html";
});

const stored = localStorage.getItem("selectedPlant");
let plant = null;
try {
  plant = stored ? JSON.parse(stored) : null;
} catch {
  plant = null;
}

const nameEl = document.getElementById("plant-name");
const deviceRowsEl = document.getElementById("device-rows");

// Billing elements
const billNewBtn = document.getElementById("bill-new-btn");
const billHistoryRows = document.getElementById("bill-history-rows");
const billDetail = document.getElementById("bill-detail");
const billDetailHead = document.getElementById("bill-detail-head");
const billDetailRows = document.getElementById("bill-detail-rows");
const billDetailTitle = document.getElementById("bill-detail-title");
const billDetailClose = document.getElementById("bill-detail-close");
const receiptHistory = document.getElementById("receipt-history");
const receiptTitle = document.getElementById("receipt-title");
const receiptRows = document.getElementById("receipt-rows");
const receiptClose = document.getElementById("receipt-close");
const receiptPreviewModal = document.getElementById("receipt-preview-modal");
const receiptPreviewContent = document.getElementById("receipt-preview-content");
const receiptPreviewClose = document.getElementById("receipt-preview-close");
const receiptPreviewMonth = document.getElementById("receipt-preview-month");
const receiptPreviewDownload = document.getElementById(
  "receipt-preview-download"
);
const billTotalCount = document.getElementById("bill-total-count");
const billLastPeriod = document.getElementById("bill-last-period");
const billLastAmount = document.getElementById("bill-last-amount");
const billAutoDay = document.getElementById("bill-auto-day");
const billAutoNote = document.getElementById("bill-auto-note");
const billScheduleInfo = document.getElementById("bill-schedule-info");
const billCyclePill = document.getElementById("bill-cycle-pill");
const billCutoffPill = document.getElementById("bill-cutoff-pill");
const billScheduleDesc = document.getElementById("bill-schedule-desc");
const billScheduleRemove = document.getElementById("bill-schedule-remove");

// Modal
const billModal = document.getElementById("bill-modal");
const billModalClose = document.getElementById("bill-modal-close");
const billCancel = document.getElementById("bill-cancel");
const billConfirm = document.getElementById("bill-confirm");
const billStart = document.getElementById("bill-start");
const billEnd = document.getElementById("bill-end");
const billRateInput = document.getElementById("bill-rate");
const billType = document.getElementById("bill-type");
const formulaMeterLeft = document.getElementById("formula-meter-left");
const formulaValueLeft = document.getElementById("formula-value-left");
const formulaOperator = document.getElementById("formula-operator");
const formulaMeterRight = document.getElementById("formula-meter-right");
const formulaValueRight = document.getElementById("formula-value-right");
const formulaResultName = document.getElementById("formula-result-name");
const formulaResultValue = document.getElementById("formula-result-value");
const billColumnsList = document.getElementById("bill-columns-list");
const columnsSelectAllBtn = document.getElementById("columns-select-all");
const columnsClearBtn = document.getElementById("columns-clear");
const columnsSelectedCount = document.getElementById("columns-selected-count");
const billCutoff = document.getElementById("bill-cutoff");
const metersBtn = document.getElementById("mode-meters");
const billingBtn = document.getElementById("mode-billing");
const metersPanel = document.getElementById("meters-panel");
const billingPanel = document.getElementById("billing-panel");

const energyApiBase = "https://solarmdb.devonix.co.th/api/energy";
const devicesApiCandidates = [
  "/api/devices",
  "http://localhost:3000/api/devices",
  "http://127.0.0.1:3000/api/devices",
  "https://solarmdb.devonix.co.th/api/devices"
];
const calcMethodLabels = {
  self_use: "Self Use (Meter 1)",
  mdb_net: "MDB In - MDB Out (Meter 2)",
  solar_in: "Solar In (Meter 1)",
  mdb_in: "MDB In (Meter 2)",
  mdb_out: "MDB Out (Meter 2)"
};
const formulaOperators = ["+", "-", "*", "/"];
const formulaFieldDefs = [
  { key: "solar_in", label: "Solar In" },
  { key: "self_use", label: "Self Use" },
  { key: "mdb_in", label: "MDB In" },
  { key: "mdb_out", label: "MDB Out" }
];
const formulaFieldLabelMap = formulaFieldDefs.reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});
const defaultFormulaField = "self_use";
const defaultCalcLabel = "ผลคำนวณ";
const detailColumnDefs = [
  { key: "solar_in", label: "Solar In (kWh)" },
  { key: "self_use", label: "Self Use (kWh)" },
  { key: "mdb_in", label: "MDB In (kWh)" },
  { key: "mdb_out", label: "MDB Out (kWh)" },
  { key: "bill_units", label: "หน่วยคิดบิล (kWh)" }
];

let isModalOpen = false;
let activeDetailId = null;
let isReceiptPreviewOpen = false;
let currentReceiptHtml = "";
let currentReceiptTitle = "";
let currentReceiptContext = null;
let currentReceiptRowsPerPage = 32;
let formulaTerms = [];
let formulaPreviewRequestId = 0;

const pad = (value) => String(value).padStart(2, "0");
const formatDate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const formatMonth = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
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
const parseDateInput = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};
const formatThaiDateShort = (value) => {
  const date = value instanceof Date ? value : parseDateInput(value);
  if (!date) return value || "-";
  return `${date.getDate()} ${thaiMonthShort[date.getMonth()]} ${date.getFullYear()}`;
};
const formatThaiMonthYear = (value) => {
  const date = value instanceof Date ? value : parseDateInput(value);
  if (!date) return "-";
  return date.toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric"
  });
};
const normalizeDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "number") return formatDate(new Date(value));
  if (typeof value === "string") {
    const trimmed = value.trim();
    const isoMatch = trimmed.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];
    if (trimmed.includes("/")) {
      const parts = trimmed.split("/");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[0]}-${pad(parts[1])}-${pad(parts[2])}`;
        }
        return `${parts[2]}-${pad(parts[1])}-${pad(parts[0])}`;
      }
    }
  }
  return null;
};
const listDatesInclusive = (start, end) => {
  const dates = [];
  let current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (current <= last) {
    dates.push(formatDate(current));
    current = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() + 1
    );
  }
  return dates;
};
const listMonthsBetween = (start, end) => {
  const months = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    months.push(formatMonth(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return months;
};
const clampDay = (year, monthIndex, day) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, daysInMonth);
};
const roundTo = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
const formatNumber = (value, digits = 0) =>
  Number(value || 0).toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
const formatCurrency = (value) => `฿${formatNumber(value, 2)}`;
const parseNumber = (value) => {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
};
const readText = (...values) => {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (text) return text;
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
const normalizeSiteToken = (value) => String(value || "").trim().toLowerCase();
const normalizeDeviceStatus = (value) => {
  if (typeof value === "boolean") return value ? "online" : "offline";
  if (typeof value === "number") return value > 0 ? "online" : "offline";
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return "online";
  if (["0", "false", "off", "offline", "down", "error"].includes(text)) {
    return "offline";
  }
  return "online";
};
const extractApiDeviceRows = (payload) => {
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
const normalizeMeterRow = (row) => {
  if (!row || typeof row !== "object") return null;
  const deviceId = Number(row.id ?? row.device_id ?? row.deviceId);
  const siteId = Number(row.site_id ?? row.siteId);
  const name = readText(
    row.device_name,
    row.deviceName,
    row.meter_name,
    row.meterName,
    row.name
  );
  const serial = readText(
    row.modbus_address_in,
    row.modbusAddressIn,
    row.device_sn,
    row.sn,
    row.serial,
    row.modbus_address_out
  );
  return {
    id: Number.isFinite(deviceId) && deviceId > 0 ? deviceId : null,
    siteId: Number.isFinite(siteId) && siteId > 0 ? siteId : null,
    siteCode: readText(row.site_code, row.siteCode),
    siteName: readText(row.site_name, row.siteName),
    name: name || serial || "Meter",
    sn: serial || "-",
    status: normalizeDeviceStatus(
      row.is_active ?? row.active ?? row.isActive ?? row.status
    ),
    deviceType: readText(row.device_type, row.deviceType, row.type) || "METER"
  };
};
const normalizeMeterRows = (rows) => {
  const byKey = new Map();
  rows.forEach((row) => {
    const meter = normalizeMeterRow(row);
    if (!meter) return;
    if (meter.status === "offline") return;
    const key = meter.id
      ? `id:${meter.id}`
      : `${normalizeSiteToken(meter.siteCode)}:${normalizeSiteToken(meter.name)}:${normalizeSiteToken(meter.sn)}`;
    if (!byKey.has(key)) byKey.set(key, meter);
  });
  return Array.from(byKey.values());
};
const buildDevicesApiUrl = (base, search = "") => `${base}${search || ""}`;
const requestDevicesApi = async (search = "") => {
  let lastHttpError = null;
  let lastNetworkError = null;
  for (const base of devicesApiCandidates) {
    const url = buildDevicesApiUrl(base, search);
    try {
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        if (!lastHttpError) {
          lastHttpError = new Error(`GET ${url} failed (${response.status})`);
        }
        continue;
      }
      return response;
    } catch (error) {
      if (!lastNetworkError) lastNetworkError = error;
    }
  }
  if (lastHttpError) throw lastHttpError;
  if (lastNetworkError) throw lastNetworkError;
  throw new Error("GET /api/devices failed");
};
const fetchPlantDevicesFromApi = async (targetPlant) => {
  const siteId = Number(targetPlant?.apiId);
  const siteCode = normalizeSiteToken(targetPlant?.siteCode || targetPlant?.site_code);
  const siteName = normalizeSiteToken(targetPlant?.name);
  const filters = [];
  if (Number.isFinite(siteId) && siteId > 0) {
    filters.push(`?site_id=${encodeURIComponent(siteId)}`);
  }
  filters.push("");

  let rows = [];
  for (const search of filters) {
    const response = await requestDevicesApi(search).catch(() => null);
    if (!response) continue;
    const payload = await response.json().catch(() => null);
    rows = extractApiDeviceRows(payload);
    if (search) break;
    if (rows.length) break;
  }
  if (!rows.length) return [];

  const filtered = rows.filter((row) => {
    const rowSiteId = Number(row?.site_id ?? row?.siteId);
    if (Number.isFinite(siteId) && siteId > 0 && rowSiteId === siteId) return true;
    const rowSiteCode = normalizeSiteToken(row?.site_code ?? row?.siteCode);
    if (siteCode && rowSiteCode && rowSiteCode === siteCode) return true;
    const rowSiteName = normalizeSiteToken(row?.site_name ?? row?.siteName);
    if (siteName && rowSiteName && rowSiteName === siteName) return true;
    return false;
  });
  return normalizeMeterRows(filtered);
};
const getMeterKey = (meter) =>
  String(
    meter?.sn ||
      meter?.serial ||
      meter?.id ||
      meter?.name ||
      ""
  ).trim();
const getMeterLabel = (meter) => {
  if (!meter || typeof meter !== "object") return "Meter";
  const name = meter.name || meter.sn || "Meter";
  if (!meter.sn || meter.name === meter.sn) return name;
  return `${name} (SN: ${meter.sn})`;
};
const getSelectedMetersForFormula = () => [...meterProfiles];
const buildLegacyFormula = (method, meterPool = meterProfiles) => {
  const meters = Array.isArray(meterPool) ? meterPool.filter(Boolean) : [];
  const first = meters[0] || null;
  const second = meters[1] || first;
  const term = (meter, field, operator = "+") => ({
    operator,
    meterKey: getMeterKey(meter),
    meterName: meter?.name || "",
    field
  });
  if (method === "mdb_net") {
    return [term(second, "mdb_in"), term(second, "mdb_out", "-")];
  }
  if (method === "solar_in") return [term(first, "solar_in")];
  if (method === "mdb_in") return [term(second, "mdb_in")];
  if (method === "mdb_out") return [term(second, "mdb_out")];
  return [term(first, "self_use")];
};
const normalizeCalcFormula = (
  formula,
  meterPool = meterProfiles,
  forceDefault = true
) => {
  const meters = Array.isArray(meterPool) ? meterPool.filter(Boolean) : [];
  const meterKeyMap = new Map(
    meters.map((meter) => [getMeterKey(meter), meter]).filter(([key]) => key)
  );
  const fallbackMeter = meters[0] || null;
  const fallbackKey = getMeterKey(fallbackMeter);
  const terms = Array.isArray(formula) ? formula : [];
  const normalized = terms
    .filter((term) => term && typeof term === "object")
    .map((term, index) => {
      const rawMeterKey = String(
        term.meterKey || term.meterSn || term.meter || ""
      ).trim();
      const meterKey = meterKeyMap.has(rawMeterKey)
        ? rawMeterKey
        : rawMeterKey || fallbackKey;
      const meter = meterKeyMap.get(meterKey) || fallbackMeter;
      const field = formulaFieldLabelMap[term.field]
        ? term.field
        : defaultFormulaField;
      const operator =
        index === 0
          ? "+"
          : formulaOperators.includes(term.operator)
            ? term.operator
            : "+";
      return {
        operator,
        meterKey,
        meterName: term.meterName || meter?.name || "",
        field
      };
    });
  if (!normalized.length && forceDefault) {
    normalized.push({
      operator: "+",
      meterKey: fallbackKey,
      meterName: fallbackMeter?.name || "",
      field: defaultFormulaField
    });
  }
  return normalized;
};
const getFormulaForContext = (
  scheduleFormula,
  legacyMethod,
  meterPool = meterProfiles
) => {
  if (Array.isArray(scheduleFormula) && scheduleFormula.length) {
    return normalizeCalcFormula(scheduleFormula, meterPool);
  }
  return normalizeCalcFormula(buildLegacyFormula(legacyMethod, meterPool), meterPool);
};
const formatFormulaLabel = (formula, meterPool = meterProfiles) => {
  const meters = Array.isArray(meterPool) ? meterPool : [];
  const meterKeyMap = new Map(
    meters.map((meter) => [getMeterKey(meter), meter]).filter(([key]) => key)
  );
  const terms = normalizeCalcFormula(formula, meters, false);
  if (!terms.length) return calcMethodLabels.self_use;
  return terms
    .map((term, index) => {
      const meter =
        meterKeyMap.get(term.meterKey) ||
        meters.find((item) => item.name === term.meterName) ||
        null;
      const meterLabel = meter
        ? getMeterLabel(meter)
        : term.meterName || term.meterKey || "Meter";
      const fieldLabel = formulaFieldLabelMap[term.field] || term.field;
      const prefix = index === 0 ? "" : `${term.operator} `;
      return `${prefix}${meterLabel}.${fieldLabel}`;
    })
    .join(" ");
};
const buildFormulaFromInputs = () => {
  const activeMeters = getSelectedMetersForFormula();
  const meterMap = new Map(
    activeMeters.map((meter) => [getMeterKey(meter), meter]).filter(([key]) => key)
  );
  const firstKey = String(formulaMeterLeft?.value || "").trim();
  const secondKey = String(formulaMeterRight?.value || "").trim();
  const firstMeter = meterMap.get(firstKey) || activeMeters[0] || null;
  const secondMeter = meterMap.get(secondKey) || activeMeters[1] || firstMeter;
  const firstField = formulaFieldLabelMap[formulaValueLeft?.value]
    ? formulaValueLeft.value
    : defaultFormulaField;
  const secondField = formulaFieldLabelMap[formulaValueRight?.value]
    ? formulaValueRight.value
    : defaultFormulaField;
  const operator = formulaOperators.includes(formulaOperator?.value)
    ? formulaOperator.value
    : "-";
  return normalizeCalcFormula(
    [
      {
        operator: "+",
        meterKey: getMeterKey(firstMeter),
        meterName: firstMeter?.name || "",
        field: firstField
      },
      {
        operator,
        meterKey: getMeterKey(secondMeter),
        meterName: secondMeter?.name || "",
        field: secondField
      }
    ],
    activeMeters
  );
};
const getFormulaResultName = () => {
  const raw = (formulaResultName?.value || "").trim();
  return raw || defaultCalcLabel;
};
const populateFormulaInputs = (formula, calcLabel = defaultCalcLabel) => {
  const activeMeters = getSelectedMetersForFormula();
  if (!activeMeters.length) return;
  const meterOptions = activeMeters
    .map((meter) => {
      const key = getMeterKey(meter);
      return `<option value="${key}">${getMeterLabel(meter)}</option>`;
    })
    .join("");
  const valueOptions = formulaFieldDefs
    .map((field) => `<option value="${field.key}">${field.label}</option>`)
    .join("");
  if (formulaMeterLeft) formulaMeterLeft.innerHTML = meterOptions;
  if (formulaMeterRight) formulaMeterRight.innerHTML = meterOptions;
  if (formulaValueLeft) formulaValueLeft.innerHTML = valueOptions;
  if (formulaValueRight) formulaValueRight.innerHTML = valueOptions;

  const normalized = normalizeCalcFormula(formula, activeMeters, false);
  const leftTerm = normalized[0] || buildLegacyFormula("self_use", activeMeters)[0];
  const rightTerm =
    normalized[1] ||
    {
      ...leftTerm,
      operator: "-",
      meterKey: getMeterKey(activeMeters[1] || activeMeters[0] || null),
      meterName: (activeMeters[1] || activeMeters[0] || {}).name || ""
    };
  if (formulaMeterLeft) formulaMeterLeft.value = leftTerm.meterKey || getMeterKey(activeMeters[0]);
  if (formulaValueLeft) formulaValueLeft.value = leftTerm.field || defaultFormulaField;
  if (formulaOperator) formulaOperator.value = rightTerm.operator || "-";
  if (formulaMeterRight) formulaMeterRight.value = rightTerm.meterKey || getMeterKey(activeMeters[1] || activeMeters[0]);
  if (formulaValueRight) formulaValueRight.value = rightTerm.field || defaultFormulaField;
  if (formulaResultName) formulaResultName.value = calcLabel || defaultCalcLabel;
  formulaTerms = buildFormulaFromInputs();
};
const updateFormulaResultPreview = async () => {
  if (!formulaResultValue) return;
  const startDate = billStart?.value;
  const endDate = billEnd?.value;
  formulaTerms = buildFormulaFromInputs();
  if (!startDate || !endDate) {
    formulaResultValue.value = "-";
    return;
  }
  const requestId = ++formulaPreviewRequestId;
  formulaResultValue.value = "กำลังคำนวณ...";
  try {
    const { rows } = await getDailyEnergyForRange(startDate, endDate);
    if (requestId !== formulaPreviewRequestId) return;
    if (!rows.length) {
      formulaResultValue.value = "-";
      return;
    }
    const total = roundTo(
      rows.reduce(
        (sum, row) => sum + getBillUnits(row, defaultSchedule.calcMethod, formulaTerms),
        0
      ),
      1
    );
    formulaResultValue.value = `${formatNumber(total, 1)} kWh`;
  } catch {
    if (requestId === formulaPreviewRequestId) {
      formulaResultValue.value = "-";
    }
  }
};
const getFormulaFromInputs = () => {
  formulaTerms = buildFormulaFromInputs();
  return formulaTerms;
};
const inferCalcMethodFromFormula = (formula) => {
  const terms = normalizeCalcFormula(formula, meterProfiles, false);
  if (!terms.length) return defaultSchedule.calcMethod;
  if (terms.length === 1) {
    if (terms[0].field === "self_use") return "self_use";
    if (terms[0].field === "solar_in") return "solar_in";
    if (terms[0].field === "mdb_in") return "mdb_in";
    if (terms[0].field === "mdb_out") return "mdb_out";
  }
  if (
    terms.length === 2 &&
    terms[0].field === "mdb_in" &&
    terms[1].field === "mdb_out" &&
    terms[1].operator === "-"
  ) {
    return "mdb_net";
  }
  return defaultSchedule.calcMethod;
};

const seedFromString = (value) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};
const seededRandom = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const updateColumnSelectedCount = () => {
  if (!columnsSelectedCount || !billColumnsList) return;
  const total = billColumnsList.querySelectorAll('input[type="checkbox"]').length;
  const selected = billColumnsList.querySelectorAll(
    'input[type="checkbox"]:checked'
  ).length;
  columnsSelectedCount.textContent = `${selected}/${total} เลือก`;
};
const applyColumnHandlers = () => {
  if (!billColumnsList) return;
  billColumnsList.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener("change", () => {
      updateColumnSelectedCount();
    });
  });
  updateColumnSelectedCount();
};
const closeModal = () => {
  billModal?.classList.add("hidden");
  isModalOpen = false;
  updateScheduleInfo(schedule.cutoffDay);
};
const hideDetail = () => {
  if (!billDetail) return;
  billDetail.classList.add("hidden");
  activeDetailId = null;
};
const hideReceiptHistory = () => {
  receiptHistory?.classList.add("hidden");
};
const buildReceiptHtml = ({ bill, issueDate, rowsPerPage = 32 }) => {
  const monthStr = formatMonth(issueDate);
  const dailyRows = [...(bill.daily || [])]
    .filter((row) => row?.date)
    .filter((row) => String(row.date).startsWith(monthStr))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((row) => ({
      date: row.date,
      units: parseNumber(row.bill_units)
    }));
  const totalKwh = roundTo(
    dailyRows.reduce((sum, row) => sum + row.units, 0),
    1
  );
  const rate = parseNumber(bill.rate);
  const calculatedAmount = roundTo(totalKwh * rate, 2);
  const totalAmount = calculatedAmount;
  const plantName = plant?.name || "PONIX";
  const issueLabel = formatThaiDateShort(issueDate);
  const periodLabel = formatThaiMonthYear(issueDate);
  const summaryHtml = `
    <div class="receipt-summary simple">
      <div class="box">
        <div class="row"><span>kWh รวม</span><span>${formatNumber(totalKwh, 1)} kWh</span></div>
        <div class="row"><span>${formatNumber(totalKwh, 1)} × ${formatNumber(
    rate,
    2
  )}</span><span>${formatNumber(calculatedAmount, 2)} บาท</span></div>
        <div class="row total"><span>ยอดรวมบิลเดือนนี้</span><span>${formatNumber(totalAmount, 2)} บาท</span></div>
      </div>
    </div>
  `;
  const pageCount = Math.max(1, Math.ceil(dailyRows.length / rowsPerPage));
  const buildRowsHtml = (rows) =>
    rows
      .map((row) => `
        <tr>
          <td class="date-cell">${formatThaiDateShort(row.date)}</td>
          <td class="num-cell">${formatNumber(row.units, 1)}</td>
        </tr>
      `)
      .join("");
  const buildPage = (rows, pageIndex) => `
    <div class="receipt-paper" data-days="${dailyRows.length}" data-page="${pageIndex + 1}" data-pages="${pageCount}">
      <div class="receipt-logo"><span>P</span><span>ONIX</span></div>
      <div class="receipt-title">
        <h2>ใบเสร็จรับเงิน</h2>
        <p>Receipt</p>
      </div>
      <div class="receipt-meta">
        <div class="box">
          <strong>ข้อมูลบริษัท</strong>
          <div>บริษัท: ${plantName}</div>
          <div>หมายเลขใบเสร็จ: ST-${String(bill.billNo).padStart(6, "0")}</div>
        </div>
        <div class="box">
          <strong>รายละเอียดงวด</strong>
          <div>เดือน: ${periodLabel}</div>
          <div>วันที่ออกใบเสร็จ: ${issueLabel}</div>
          <div>อัตรา: ${formatNumber(rate, 2)} บาท/kWh</div>
        </div>
      </div>
      <div class="receipt-divider"></div>
      <div class="receipt-table-area">
        <table class="receipt-table receipt-usage-table">
          <colgroup>
            <col style="width:72%">
            <col style="width:28%">
          </colgroup>
          <thead>
            <tr>
              <th class="date-cell">วันที่</th>
              <th class="num-cell">ใช้ไฟ (kWh)</th>
            </tr>
          </thead>
          <tbody>
            ${buildRowsHtml(rows)}
          </tbody>
        </table>
      </div>
      ${pageIndex === pageCount - 1 ? summaryHtml : ""}
    </div>
  `;
  return Array.from({ length: pageCount }, (_, pageIndex) => {
    const start = pageIndex * rowsPerPage;
    const pageRows = dailyRows.slice(start, start + rowsPerPage);
    return buildPage(pageRows, pageIndex);
  }).join('<div class="page-break"></div>');
};
const openReceiptPreview = ({ bill, issueDate }) => {
  if (!receiptPreviewModal || !receiptPreviewContent) return;
  const periodText = formatThaiMonthYear(issueDate);
  if (receiptPreviewMonth) {
    receiptPreviewMonth.textContent = `เดือน ${periodText}`;
  }
  currentReceiptContext = { bill, issueDate };
  currentReceiptRowsPerPage = 32;
  currentReceiptHtml = buildReceiptHtml({
    bill,
    issueDate,
    rowsPerPage: currentReceiptRowsPerPage
  });
  currentReceiptTitle = `Receipt Bill ${bill.billNo} ${formatMonth(issueDate)}`;
  receiptPreviewContent.classList.add("web-view");
  receiptPreviewContent.innerHTML = currentReceiptHtml;
  receiptPreviewModal.classList.remove("hidden");
  isReceiptPreviewOpen = true;
  sizeReceiptSheet();
  requestAnimationFrame(() => {
    adjustReceiptPagination();
  });
};
const sizeReceiptSheet = () => {
  if (!receiptPreviewContent) return;
  currentReceiptHtml = receiptPreviewContent.innerHTML;
  adjustReceiptPagination();
};
const adjustReceiptPagination = () => {
  if (!receiptPreviewContent || !currentReceiptContext) return;
  const paper = receiptPreviewContent.querySelector(".receipt-paper");
  if (!paper) return;
  const tableArea = paper.querySelector(".receipt-table-area");
  const thead = paper.querySelector(".receipt-table thead");
  if (!tableArea || !thead) return;
  const rowHRaw = getComputedStyle(paper).getPropertyValue("--row-h");
  const rowH = Number.parseFloat(rowHRaw) || 12;
  const tableAreaH = tableArea.clientHeight;
  const headerH = thead.offsetHeight || 18;
  const available = Math.max(0, tableAreaH - headerH);
  const rowsPerPage = Math.max(1, Math.floor(available / rowH));
  if (rowsPerPage === currentReceiptRowsPerPage) return;
  currentReceiptRowsPerPage = rowsPerPage;
  currentReceiptHtml = buildReceiptHtml({
    ...currentReceiptContext,
    rowsPerPage: currentReceiptRowsPerPage
  });
  receiptPreviewContent.innerHTML = currentReceiptHtml;
};
const openReceiptPrint = () => {
  if (!currentReceiptHtml) return;
  const win = window.open("", "_blank");
  if (!win) return;
  const styleHref = new URL("./style.css", window.location.href).href;
  const fontHref =
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
  win.document.write(`
    <html>
      <head>
        <title>${currentReceiptTitle}</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="${fontHref}">
        <link rel="stylesheet" href="${styleHref}">
      </head>
      <body class="pdf-view">${currentReceiptHtml}</body>
    </html>
  `);
  win.document.close();
  const triggerPrint = () => {
    win.focus();
    win.print();
  };
  if (win.document.readyState === "complete") {
    requestAnimationFrame(triggerPrint);
    return;
  }
  win.addEventListener(
    "load",
    () => {
      setTimeout(triggerPrint, 100);
    },
    { once: true }
  );
};
const closeReceiptPreview = () => {
  receiptPreviewModal?.classList.add("hidden");
  isReceiptPreviewOpen = false;
  receiptPreviewContent?.classList.remove("web-view");
  if (receiptPreviewContent) receiptPreviewContent.innerHTML = "";
  currentReceiptHtml = "";
  currentReceiptTitle = "";
  currentReceiptContext = null;
  currentReceiptRowsPerPage = 32;
};
const populateCutoffOptions = () => {
  if (!billCutoff) return;
  billCutoff.innerHTML = Array.from({ length: 31 }, (_, i) => i + 1)
    .map((day) => `<option value="${day}">${day}</option>`)
    .join("");
};

const defaultSchedule = {
  cutoffDay: 5,
  defaultRate: 4.2,
  rateType: "flat",
  calcMethod: "self_use",
  calcFormula: [],
  calcLabel: defaultCalcLabel,
  detailColumns: detailColumnDefs.map((col) => col.key)
};
let schedule = { ...defaultSchedule };
let history = [];
let billSequence = 0;
let meterProfiles = [];
let historyKey = "billingHistory";
let scheduleKey = "billingSchedule";
let sequenceKey = "billingSequence";

const updateScheduleInfo = (cutoffDay = schedule.cutoffDay) => {
  const dayValue = Number(cutoffDay) || defaultSchedule.cutoffDay;
  if (billCyclePill)
    billCyclePill.textContent = `สร้างอัตโนมัติทุกวันที่ ${dayValue}`;
  if (billCutoffPill)
    billCutoffPill.textContent = `ตัดรอบวันที่ ${dayValue}`;
  if (billScheduleDesc)
    billScheduleDesc.textContent = `ระบบจะสร้างบิลอัตโนมัติทุกวันที่ ${dayValue} ของเดือน`;
  if (billAutoDay) billAutoDay.textContent = `${dayValue}`;
  if (billAutoNote) {
    const nextRun = getNextRunDate(dayValue);
    billAutoNote.textContent = `ครั้งถัดไป: ${formatDate(nextRun)}`;
  }
  billScheduleInfo?.classList.remove("hidden");
};

const setDefaultRange = (cutoffDay = schedule.cutoffDay) => {
  if (!billStart || !billEnd) return;
  const today = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  billEnd.value = formatDate(today);
  billStart.value = formatDate(start);
  if (billCutoff) billCutoff.value = String(cutoffDay);
};

const buildMeterProfiles = (meters) => {
  const profileMap = new Map();
  return meters.map((m) => {
    const key = m.sn || m.name || "meter";
    if (!profileMap.has(key)) {
      const rng = seededRandom(seedFromString(key));
      const baseDaily = roundTo(18 + rng() * 12, 1);
      profileMap.set(key, baseDaily);
    }
    return {
      ...m,
      baseDaily: profileMap.get(key)
    };
  });
};

const buildMockEnergyRange = (startStr, endStr, seed) => {
  const start = parseDateInput(startStr);
  const end = parseDateInput(endStr);
  if (!start || !end) return [];
  const dates = listDatesInclusive(start, end);
  const baseDaily = meterProfiles.reduce((sum, m) => sum + (m.baseDaily || 0), 0);
  const rng = seededRandom(seedFromString(seed || `${startStr}-${endStr}`));
  return dates.map((date) => {
    const variance = baseDaily * 0.25;
    const selfUse = roundTo(baseDaily + (rng() * 2 - 1) * variance, 1);
    const solarIn = roundTo(selfUse + rng() * 3, 1);
    const mdbIn = roundTo(Math.max(0, selfUse * 0.18 + rng() * 1.2), 1);
    const mdbOut = roundTo(Math.max(0, mdbIn * 0.4 * rng()), 1);
    return {
      date,
      solar_in: solarIn,
      self_use: selfUse,
      mdb_in: mdbIn,
      mdb_out: mdbOut
    };
  });
};

const extractDailyRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const keys = ["data", "items", "result", "rows", "list", "days"];
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      for (const subKey of keys) {
        if (Array.isArray(value[subKey])) return value[subKey];
      }
    }
  }
  const values = Object.values(payload).find((val) => Array.isArray(val));
  return Array.isArray(values) ? values : [];
};

const normalizeDailyRows = (rows) => {
  const map = new Map();
  rows.forEach((row) => {
    if (!row || typeof row !== "object") return;
    const date = normalizeDateValue(
      row.date ?? row.day ?? row.datetime ?? row.timestamp ?? row.ts
    );
    if (!date) return;
    const solarIn = parseNumber(row.solar_in ?? row.solarIn ?? row.solar);
    const selfUse = parseNumber(row.self_use ?? row.selfUse ?? row.self);
    const mdbIn = parseNumber(row.mdb_in ?? row.mdbIn ?? row.mdb_in_kwh);
    const mdbOut = parseNumber(row.mdb_out ?? row.mdbOut ?? row.mdb_out_kwh);
    map.set(date, {
      date,
      solar_in: solarIn,
      self_use: selfUse,
      mdb_in: mdbIn,
      mdb_out: mdbOut
    });
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};

const fetchEnergyMonth = async (monthStr) => {
  const url = `${energyApiBase}?period=month&month=${monthStr}`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }
  const payload = await response.json();
  const rows = normalizeDailyRows(extractDailyRows(payload));
  return rows;
};

const fetchEnergyRange = async (startStr, endStr) => {
  const start = parseDateInput(startStr);
  const end = parseDateInput(endStr);
  if (!start || !end) return [];
  const months = listMonthsBetween(start, end);
  const results = [];
  for (const month of months) {
    try {
      const rows = await fetchEnergyMonth(month);
      if (rows.length) results.push(...rows);
    } catch {
      // ignore individual month errors
    }
  }
  if (!results.length) return [];
  const map = new Map();
  results.forEach((row) => {
    if (row?.date) map.set(row.date, row);
  });
  return Array.from(map.values())
    .filter((row) => row.date >= startStr && row.date <= endStr)
    .sort((a, b) => a.date.localeCompare(b.date));
};

const getDailyEnergyForRange = async (startStr, endStr) => {
  const apiRows = await fetchEnergyRange(startStr, endStr);
  if (apiRows.length) {
    return { rows: apiRows, source: "api" };
  }
  return {
    rows: buildMockEnergyRange(startStr, endStr, `${startStr}-${endStr}`),
    source: "mock"
  };
};

const buildStorageKey = (prefix) => {
  const safePlant = plant?.name
    ? plant.name.replace(/[^a-zA-Z0-9_-]+/g, "_")
    : "default";
  return `${prefix}:${safePlant}`;
};

const loadSchedule = () => {
  schedule = { ...defaultSchedule };
  try {
    const saved = localStorage.getItem(scheduleKey);
    if (saved) schedule = { ...schedule, ...JSON.parse(saved) };
  } catch {
    schedule = { ...defaultSchedule };
  }
  if (!Array.isArray(schedule.detailColumns) || !schedule.detailColumns.length) {
    schedule.detailColumns = [...defaultSchedule.detailColumns];
  }
  if (!Array.isArray(schedule.calcFormula)) {
    schedule.calcFormula = [];
  }
  if (typeof schedule.calcLabel !== "string" || !schedule.calcLabel.trim()) {
    schedule.calcLabel = defaultCalcLabel;
  }
};
const saveSchedule = () => {
  localStorage.setItem(scheduleKey, JSON.stringify(schedule));
};
const loadHistory = () => {
  history = [];
  try {
    const saved = localStorage.getItem(historyKey);
    if (saved) history = JSON.parse(saved) || [];
  } catch {
    history = [];
  }
  try {
    const seq = localStorage.getItem(sequenceKey);
    if (seq) billSequence = Number(seq) || 0;
  } catch {
    billSequence = 0;
  }
  if (!billSequence && history.length) {
    billSequence = Math.max(...history.map((b) => b.billNo || 0), 0);
  }
};
const saveHistory = () => {
  localStorage.setItem(historyKey, JSON.stringify(history));
  localStorage.setItem(sequenceKey, String(billSequence));
};

const getAutoPeriodForRunDate = (runDate, cutoffDay) => {
  const year = runDate.getFullYear();
  const month = runDate.getMonth();
  const endDay = clampDay(year, month, cutoffDay);
  const periodEnd = new Date(year, month, endDay);
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }
  const prevEndDay = clampDay(prevYear, prevMonth, cutoffDay);
  const periodStart = new Date(prevYear, prevMonth, prevEndDay + 1);
  return { start: periodStart, end: periodEnd };
};

const getNextRunDate = (cutoffDay) => {
  const today = new Date();
  const thisRunDay = clampDay(today.getFullYear(), today.getMonth(), cutoffDay);
  let candidate = new Date(
    today.getFullYear(),
    today.getMonth(),
    thisRunDay
  );
  const { start, end } = getAutoPeriodForRunDate(candidate, cutoffDay);
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const alreadyGenerated = history.some(
    (b) => b.periodStart === startStr && b.periodEnd === endStr
  );
  if (today > candidate || alreadyGenerated) {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextRunDay = clampDay(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      cutoffDay
    );
    candidate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      nextRunDay
    );
  }
  return candidate;
};

const findMeterScopedRow = (row, term) => {
  if (!row || typeof row !== "object" || !term) return null;
  const meterKey = String(term.meterKey || "").trim();
  const meterName = String(term.meterName || "").trim();
  const match = (candidate) => {
    if (!candidate || typeof candidate !== "object") return false;
    const candidateKey = getMeterKey(candidate);
    if (meterKey && candidateKey && candidateKey === meterKey) return true;
    if (meterName && candidate.name && candidate.name === meterName) return true;
    return false;
  };
  const groups = [];
  if (Array.isArray(row.meters)) groups.push(...row.meters);
  if (Array.isArray(row.meter_data)) groups.push(...row.meter_data);
  if (Array.isArray(row.devices)) groups.push(...row.devices);
  const scoped = groups.find(match);
  if (scoped) return scoped;
  if (row.by_meter && typeof row.by_meter === "object") {
    if (meterKey && row.by_meter[meterKey]) return row.by_meter[meterKey];
    const keyed = Object.values(row.by_meter).find(match);
    if (keyed) return keyed;
  }
  return null;
};
const getFormulaTermValue = (row, term) => {
  const source = findMeterScopedRow(row, term) || row;
  return parseNumber(source?.[term.field]);
};
const calculateByFormula = (row, formula) => {
  const terms = normalizeCalcFormula(formula, meterProfiles, false);
  if (!terms.length) return null;
  let result = getFormulaTermValue(row, terms[0]);
  for (let i = 1; i < terms.length; i += 1) {
    const term = terms[i];
    const value = getFormulaTermValue(row, term);
    if (term.operator === "+") result += value;
    if (term.operator === "-") result -= value;
    if (term.operator === "*") result *= value;
    if (term.operator === "/") {
      if (Math.abs(value) < 1e-9) continue;
      result /= value;
    }
  }
  return roundTo(Math.max(0, result), 1);
};
const getBillUnits = (row, method, formula) => {
  const byFormula = calculateByFormula(row, formula);
  if (byFormula !== null) return byFormula;
  const solarIn = parseNumber(row.solar_in);
  const selfUse = parseNumber(row.self_use);
  const mdbIn = parseNumber(row.mdb_in);
  const mdbOut = parseNumber(row.mdb_out);
  let value = selfUse;
  if (method === "mdb_net") value = mdbIn - mdbOut;
  if (method === "solar_in") value = solarIn;
  if (method === "mdb_in") value = mdbIn;
  if (method === "mdb_out") value = mdbOut;
  return roundTo(Math.max(0, value), 1);
};

const buildReceiptDates = (startStr, cutoffDay) => {
  const start = parseDateInput(startStr);
  if (!start) return [];
  const today = new Date();
  const months = listMonthsBetween(start, today);
  const cutoff = Number(cutoffDay) || defaultSchedule.cutoffDay;
  return months
    .map((monthStr) => {
      const [year, month] = monthStr.split("-").map(Number);
      if (!year || !month) return null;
      const day = clampDay(year, month - 1, cutoff);
      return new Date(year, month - 1, day);
    })
    .filter((date) => date && date >= start && date <= today);
};

const getDetailColumns = (columns) => {
  const list = Array.isArray(columns) ? columns : [];
  const active = list.length ? list : defaultSchedule.detailColumns;
  return detailColumnDefs.filter((col) => active.includes(col.key));
};
const renderDetailHeader = (columns) => {
  if (!billDetailHead) return;
  const headerCells = columns
    .map((col) => `<th>${col.label}</th>`)
    .join("");
  billDetailHead.innerHTML = `<th style="width: 140px;">วันที่</th>${headerCells}`;
  if (billDetailRows) {
    const emptyCell = billDetailRows.querySelector("td.empty");
    if (emptyCell) {
      emptyCell.setAttribute("colspan", String(columns.length + 1));
    }
  }
};
const getSelectedDetailColumns = () => {
  if (!billColumnsList) return [];
  return Array.from(
    billColumnsList.querySelectorAll('input[type="checkbox"]:checked')
  ).map((el) => el.value);
};
const renderColumnSelector = (selectedKeys) => {
  if (!billColumnsList) return;
  const active = Array.isArray(selectedKeys) && selectedKeys.length
    ? selectedKeys
    : defaultSchedule.detailColumns;
  billColumnsList.innerHTML = detailColumnDefs
    .map((col) => {
      const checked = active.includes(col.key) ? "checked" : "";
      return `
        <label>
          <input type="checkbox" value="${col.key}" ${checked}>
          <span>${col.label}</span>
        </label>
      `;
    })
    .join("");
  applyColumnHandlers();
};

const createBill = ({
  periodStart,
  periodEnd,
  meters,
  rate,
  rateType,
  calcMethod,
  calcFormula,
  calcLabel,
  cutoffDay,
  detailColumns,
  dailyRows,
  auto = false,
  source = "api"
}) => {
  const normalizedColumns =
    Array.isArray(detailColumns) && detailColumns.length
      ? detailColumns
      : defaultSchedule.detailColumns;
  const normalizedFormula = normalizeCalcFormula(calcFormula, meters);
  const daily = dailyRows.map((row) => ({
    ...row,
    bill_units: getBillUnits(row, calcMethod, normalizedFormula)
  }));
  const totalKwh = roundTo(
    daily.reduce((sum, row) => sum + (row.bill_units || 0), 0),
    1
  );
  const amount = roundTo(totalKwh * rate, 2);
  billSequence += 1;
  const bill = {
    id: `${Date.now()}-${billSequence}`,
    billNo: billSequence,
    createdAt: Date.now(),
    periodStart,
    periodEnd,
    rate: roundTo(rate, 2),
    rateType: rateType || schedule.rateType,
    totalKwh,
    amount,
    auto,
    calcMethod,
    calcFormula: normalizedFormula,
    calcLabel: (calcLabel || defaultCalcLabel).trim(),
    cutoffDay: cutoffDay || schedule.cutoffDay || defaultSchedule.cutoffDay,
    detailColumns: normalizedColumns,
    source,
    meters: meters.map((m) => ({ name: m.name, sn: m.sn })),
    daily
  };
  history = [bill, ...history];
  saveHistory();
  return bill;
};

const renderHistory = () => {
  if (!billHistoryRows) return;
  if (!history.length) {
    billHistoryRows.innerHTML =
      '<tr><td class="empty" colspan="7">ยังไม่มีบิล</td></tr>';
    return;
  }
  billHistoryRows.innerHTML = history
    .map((bill) => {
      const meterText = bill.meters.map((m) => m.name).join(", ");
      const badgeLabel = bill.auto ? "อัตโนมัติ" : "กำหนดเอง";
      const badgeClass = bill.auto ? "auto" : "manual";
      const methodFormula =
        Array.isArray(bill.calcFormula) && bill.calcFormula.length
          ? bill.calcFormula
          : buildLegacyFormula(bill.calcMethod, bill.meters);
      const methodLabel = formatFormulaLabel(methodFormula, bill.meters);
      const formulaName = (bill.calcLabel || defaultCalcLabel).trim();
      const sourceLabel = bill.source === "api" ? "API" : "Mock";
      return `
        <tr data-id="${bill.id}">
          <td>ใบที่ ${bill.billNo}</td>
          <td>${meterText || "-"}</td>
          <td>
            <div>${bill.periodStart} - ${bill.periodEnd}</div>
            <div class="muted small">${formulaName}: ${methodLabel} • ข้อมูล: ${sourceLabel}</div>
            <span class="badge ${badgeClass}">${badgeLabel}</span>
          </td>
          <td>${formatNumber(bill.rate, 2)}</td>
          <td>${formatNumber(bill.totalKwh, 1)}</td>
          <td>${formatCurrency(bill.amount)}</td>
          <td>
            <div class="history-actions">
              <button class="ghost small-btn" data-action="receipt" data-id="${bill.id}" type="button">ประวัติใบเสร็จ</button>
              <button class="ghost small-btn" data-action="detail" data-id="${bill.id}" type="button">ดูรายวัน</button>
              <button class="small-btn btn-danger" data-action="delete" data-id="${bill.id}" type="button">ลบ</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  billHistoryRows.querySelectorAll("button[data-action='detail']").forEach(
    (btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (id) showBillDetail(id);
      });
    }
  );
  billHistoryRows.querySelectorAll("button[data-action='receipt']").forEach(
    (btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (id) showReceiptHistory(id);
      });
    }
  );
  billHistoryRows.querySelectorAll("button[data-action='delete']").forEach(
    (btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (id) deleteBill(id);
      });
    }
  );
};

const showReceiptHistory = (id) => {
  if (!receiptHistory || !receiptRows) return;
  const bill = history.find((b) => b.id === id);
  if (!bill) return;
  hideDetail();
  const cutoffDay =
    bill.cutoffDay || schedule.cutoffDay || defaultSchedule.cutoffDay;
  const dates = buildReceiptDates(bill.periodStart, cutoffDay).sort(
    (a, b) => b - a
  );
  if (receiptTitle) {
    receiptTitle.textContent = `ประวัติใบเสร็จ • ใบที่ ${bill.billNo} • ออกทุกวันที่ ${cutoffDay}`;
  }
  if (!dates.length) {
    receiptRows.innerHTML =
      '<tr><td class="empty" colspan="5">ยังไม่มีประวัติใบเสร็จ</td></tr>';
  } else {
    receiptRows.innerHTML = dates
      .map((date, idx) => {
        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        return `
        <tr>
          <td>งวด ${dates.length - idx} • ${formatMonth(date)}</td>
          <td>${daysInMonth} วัน</td>
          <td>${formatDate(date)}</td>
          <td>
            <button class="small-btn" data-action="download" data-date="${formatDate(
              date
            )}">ดาวน์โหลด</button>
          </td>
          <td>
            <button class="ghost small-btn" data-action="sample" data-date="${formatDate(
              date
            )}">ดูตัวอย่าง</button>
          </td>
        </tr>
      `;
      })
      .join("");
    receiptRows
      .querySelectorAll("button[data-action='download']")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const date = btn.getAttribute("data-date");
          alert(`ดาวน์โหลดใบเสร็จ เดือน ${date || ""}`);
        });
      });
    receiptRows
      .querySelectorAll("button[data-action='sample']")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const issueDate = parseDateInput(btn.getAttribute("data-date") || "");
          if (!issueDate) return;
          openReceiptPreview({ bill, issueDate });
        });
      });
  }
  receiptHistory.classList.remove("hidden");
};

const updateSummary = () => {
  if (billTotalCount) billTotalCount.textContent = `${history.length} ใบ`;
  if (billAutoDay) billAutoDay.textContent = `${schedule.cutoffDay}`;
  if (!history.length) {
    if (billLastPeriod) billLastPeriod.textContent = "-";
    if (billLastAmount) billLastAmount.textContent = "-";
    return;
  }
  const latest = history[0];
  if (billLastPeriod)
    billLastPeriod.textContent = `${latest.periodStart} - ${latest.periodEnd}`;
  if (billLastAmount) billLastAmount.textContent = formatCurrency(latest.amount);
};

const showBillDetail = (id) => {
  if (!billDetail || !billDetailRows) return;
  const bill = history.find((b) => b.id === id);
  if (!bill) return;
  hideReceiptHistory();
  activeDetailId = id;
  billDetailTitle.textContent = `ใบที่ ${bill.billNo} • ${bill.periodStart} - ${bill.periodEnd}`;
  const columns = getDetailColumns(bill.detailColumns).map((col) =>
    col.key === "bill_units"
      ? { ...col, label: `${(bill.calcLabel || defaultCalcLabel).trim()} (kWh)` }
      : col
  );
  renderDetailHeader(columns);
  const totals = bill.daily.reduce(
    (acc, row) => {
      acc.solar_in += parseNumber(row.solar_in);
      acc.self_use += parseNumber(row.self_use);
      acc.mdb_in += parseNumber(row.mdb_in);
      acc.mdb_out += parseNumber(row.mdb_out);
      acc.bill_units += parseNumber(row.bill_units);
      return acc;
    },
    { solar_in: 0, self_use: 0, mdb_in: 0, mdb_out: 0, bill_units: 0 }
  );

  billDetailRows.innerHTML = bill.daily
    .map((row) => {
      const cells = columns
        .map((col) => {
          const value =
            col.key === "bill_units" ? row.bill_units : row[col.key];
          return `<td>${formatNumber(value, 1)}</td>`;
        })
        .join("");
      return `<tr><td>${row.date}</td>${cells}</tr>`;
    })
    .join("");
  const totalCells = columns
    .map((col) => `<td><strong>${formatNumber(totals[col.key], 1)}</strong></td>`)
    .join("");
  billDetailRows.innerHTML += `
    <tr>
      <td><strong>รวม</strong></td>
      ${totalCells}
    </tr>
  `;
  billDetail.classList.remove("hidden");
};

const deleteBill = (id) => {
  const bill = history.find((b) => b.id === id);
  if (!bill) return;
  const ok = confirm(`ต้องการลบบิลใบที่ ${bill.billNo} ใช่หรือไม่?`);
  if (!ok) return;
  history = history.filter((b) => b.id !== id);
  saveHistory();
  renderHistory();
  updateSummary();
  if (activeDetailId === id) hideDetail();
};

const runAutoIfDue = async () => {
  const today = new Date();
  const cutoffDay = schedule.cutoffDay || defaultSchedule.cutoffDay;
  const effectiveDay = clampDay(
    today.getFullYear(),
    today.getMonth(),
    cutoffDay
  );
  if (today.getDate() !== effectiveDay) return;
  const { start, end } = getAutoPeriodForRunDate(today, cutoffDay);
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const alreadyGenerated = history.some(
    (b) => b.periodStart === startStr && b.periodEnd === endStr
  );
  if (alreadyGenerated) return;
  const { rows, source } = await getDailyEnergyForRange(startStr, endStr);
  if (!rows.length) return;
  const calcFormula = getFormulaForContext(
    schedule.calcFormula,
    schedule.calcMethod,
    meterProfiles
  );
  createBill({
    periodStart: startStr,
    periodEnd: endStr,
    meters: meterProfiles,
    rate: schedule.defaultRate,
    rateType: schedule.rateType,
    calcMethod: schedule.calcMethod || defaultSchedule.calcMethod,
    calcFormula,
    calcLabel: schedule.calcLabel || defaultCalcLabel,
    cutoffDay,
    detailColumns: schedule.detailColumns || defaultSchedule.detailColumns,
    auto: true,
    source,
    dailyRows: rows
  });
};

const openModal = () => {
  if (!billModal) return;
  billModal.classList.remove("hidden");
  isModalOpen = true;
  setDefaultRange(schedule.cutoffDay);
  if (billRateInput) billRateInput.value = schedule.defaultRate;
  if (billType && schedule.rateType) billType.value = schedule.rateType;
  renderColumnSelector(schedule.detailColumns);
  formulaTerms = getFormulaForContext(
    schedule.calcFormula,
    schedule.calcMethod,
    getSelectedMetersForFormula()
  );
  populateFormulaInputs(formulaTerms, schedule.calcLabel || defaultCalcLabel);
  updateFormulaResultPreview();
};

const handleConfirm = async () => {
  const selectedMeters = [...meterProfiles];
  if (!selectedMeters.length) {
    alert("ยังไม่มีมิเตอร์ให้ใช้คำนวณ");
    return;
  }
  const startDate = parseDateInput(billStart.value);
  const endDate = parseDateInput(billEnd.value);
  if (!startDate || !endDate) {
    alert("กรุณากรอกช่วงวันที่ให้ครบ");
    return;
  }
  if (startDate > endDate) {
    alert("วันที่เริ่มต้องไม่มากกว่าวันที่สิ้นสุด");
    return;
  }
  const cutoffDay = billCutoff?.value ? Number(billCutoff.value) : 5;
  const rateVal =
    parseFloat(billRateInput.value || `${schedule.defaultRate}`) ||
    schedule.defaultRate;
  const rateTypeVal = billType?.value || schedule.rateType;
  const calcFormula = getFormulaFromInputs();
  if (!calcFormula.length) {
    alert("กรุณากำหนดสูตรคำนวณอย่างน้อย 1 พจน์");
    return;
  }
  const calcLabel = getFormulaResultName();
  const calcMethod = inferCalcMethodFromFormula(calcFormula);
  const selectedDetailColumns = getSelectedDetailColumns();
  const detailColumns = selectedDetailColumns.length
    ? selectedDetailColumns
    : schedule.detailColumns?.length
      ? [...schedule.detailColumns]
      : [...defaultSchedule.detailColumns];
  const periodStart = formatDate(startDate);
  const periodEnd = formatDate(endDate);

  const { rows, source } = await getDailyEnergyForRange(
    periodStart,
    periodEnd
  );
  if (!rows.length) {
    alert("ไม่พบข้อมูลรายวันสำหรับช่วงที่เลือก");
    return;
  }

  const bill = createBill({
    periodStart,
    periodEnd,
    meters: selectedMeters,
    rate: rateVal,
    rateType: rateTypeVal,
    calcMethod,
    calcFormula,
    calcLabel,
    cutoffDay,
    detailColumns,
    auto: false,
    source,
    dailyRows: rows
  });

  schedule = {
    ...schedule,
    cutoffDay,
    defaultRate: rateVal,
    rateType: rateTypeVal,
    calcMethod,
    calcFormula,
    calcLabel,
    detailColumns
  };
  saveSchedule();
  updateScheduleInfo(cutoffDay);
  renderHistory();
  updateSummary();
  closeModal();
  const sourceNote = source === "mock"
    ? "\nหมายเหตุ: ใช้ข้อมูลจำลอง (API ยังดึงไม่ได้)"
    : "";
  alert(
    `สร้างบิลใบที่ ${bill.billNo}\nช่วง ${bill.periodStart} - ${bill.periodEnd}\nพลังงานรวม ${formatNumber(
      bill.totalKwh,
      1
    )} kWh x ฿${formatNumber(bill.rate, 2)} = ${formatCurrency(bill.amount)}${sourceNote}`
  );
};

billModalClose?.addEventListener("click", closeModal);
billCancel?.addEventListener("click", closeModal);
billModal?.addEventListener("click", (e) => {
  if (e.target === billModal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (isReceiptPreviewOpen) {
    closeReceiptPreview();
    return;
  }
  if (isModalOpen) closeModal();
});

billCutoff?.addEventListener("change", () => {
  const cutoffDay = billCutoff?.value ? Number(billCutoff.value) : 5;
  updateScheduleInfo(cutoffDay);
});
[
  formulaMeterLeft,
  formulaValueLeft,
  formulaOperator,
  formulaMeterRight,
  formulaValueRight,
  billStart,
  billEnd
].forEach((el) => {
  el?.addEventListener("change", () => {
    updateFormulaResultPreview();
  });
});
columnsSelectAllBtn?.addEventListener("click", () => {
  if (!billColumnsList) return;
  billColumnsList.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.checked = true;
  });
  updateColumnSelectedCount();
});
columnsClearBtn?.addEventListener("click", () => {
  if (!billColumnsList) return;
  billColumnsList.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.checked = false;
  });
  updateColumnSelectedCount();
});

billDetailClose?.addEventListener("click", hideDetail);
receiptClose?.addEventListener("click", hideReceiptHistory);
receiptPreviewClose?.addEventListener("click", closeReceiptPreview);
receiptPreviewModal?.addEventListener("click", (e) => {
  if (e.target === receiptPreviewModal) closeReceiptPreview();
});
receiptPreviewDownload?.addEventListener("click", () => {
  openReceiptPrint();
});
window.addEventListener("resize", () => {
  if (isReceiptPreviewOpen) sizeReceiptSheet();
});

// toggle meters/billing
const setMode = (isBilling) => {
  if (metersPanel && billingPanel) {
    metersPanel.classList.toggle("hidden", isBilling);
    billingPanel.classList.toggle("hidden", !isBilling);
  }
  if (metersBtn) metersBtn.classList.toggle("active", !isBilling);
  if (billingBtn) billingBtn.classList.toggle("active", isBilling);
  if (!isBilling) {
    closeModal();
    hideDetail();
    hideReceiptHistory();
    closeReceiptPreview();
  }
};

metersBtn?.addEventListener("click", () => setMode(false));
billingBtn?.addEventListener("click", () => setMode(true));

// Use fallback demo data ifไม่มีข้อมูลใน localStorage
if (!plant) {
  plant = {
    name: "Demo Plant 10kW",
    deviceSn: "SN-DEMO-001",
    devices: [
      { name: "Meter A", sn: "SN-DEMO-001-A", status: "online" },
      { name: "Meter B", sn: "SN-DEMO-001-B", status: "online" }
    ]
  };
}

nameEl.textContent = plant.name;

const normalizeLocalMeters = (meters) =>
  normalizeMeterRows(
    (Array.isArray(meters) ? meters : []).map((meter) => ({
      ...meter,
      site_id: meter?.siteId ?? meter?.site_id ?? plant?.apiId,
      device_name: meter?.deviceName ?? meter?.device_name ?? meter?.name,
      modbus_address_in: meter?.sn ?? meter?.serial ?? meter?.modbus_address_in
    }))
  );

let plantMeters = normalizeLocalMeters(plant.devices);
if (!plantMeters.length && !stored) {
  plantMeters = normalizeLocalMeters([
    { name: "Meter A", sn: plant.deviceSn || "-", status: "online" },
    { name: "Meter B", sn: `${plant.deviceSn || "-"}-B`, status: "online" }
  ]);
}

const renderPlantMeters = () => {
  if (!deviceRowsEl) return;
  if (!plantMeters.length) {
    deviceRowsEl.innerHTML = '<tr><td class="empty" colspan="3">ไม่พบมิเตอร์ของ Plant นี้</td></tr>';
    return;
  }
  deviceRowsEl.innerHTML = plantMeters
    .map(
      (meter, idx) => `
      <tr data-idx="${idx}">
        <td><span class="status-dot" title="${escapeHtml(meter.status)}"></span></td>
        <td>${escapeHtml(meter.name)}</td>
        <td>${escapeHtml(meter.sn)}</td>
      </tr>`
    )
    .join("");

  deviceRowsEl.querySelectorAll("tr[data-idx]").forEach((tr) => {
    tr.addEventListener("click", () => {
      const idx = Number(tr.dataset.idx);
      const meter = plantMeters[idx];
      if (!meter) return;
      localStorage.setItem("selectedPlant", JSON.stringify(plant));
      localStorage.setItem("selectedMeter", JSON.stringify(meter));
      window.location.href = "./meter.html";
    });
  });
};

const applyPlantMeters = (meters, { persistPlant = true } = {}) => {
  plantMeters = normalizeLocalMeters(meters);
  plant = { ...plant, devices: plantMeters };
  meterProfiles = buildMeterProfiles(plantMeters);
  if (persistPlant) {
    localStorage.setItem("selectedPlant", JSON.stringify(plant));
  }
  renderPlantMeters();
};

const hydratePlantMetersFromApi = async () => {
  try {
    const apiMeters = await fetchPlantDevicesFromApi(plant);
    if (!apiMeters.length) {
      const hasPlantIdentity =
        (Number.isFinite(Number(plant?.apiId)) && Number(plant.apiId) > 0) ||
        normalizeSiteToken(plant?.siteCode || plant?.site_code) ||
        normalizeSiteToken(plant?.name);
      if (hasPlantIdentity) {
        applyPlantMeters([], { persistPlant: true });
      }
      return;
    }
    applyPlantMeters(apiMeters, { persistPlant: true });
  } catch (error) {
    console.warn("Failed to load devices from API", error);
  }
};

applyPlantMeters(plantMeters, { persistPlant: false });

historyKey = buildStorageKey("billingHistoryV2");
scheduleKey = buildStorageKey("billingScheduleV1");
sequenceKey = buildStorageKey("billingSequenceV1");
loadSchedule();
loadHistory();

const initBilling = async () => {
  updateScheduleInfo(schedule.cutoffDay);
  renderDetailHeader(getDetailColumns(schedule.detailColumns));
  await runAutoIfDue();
  renderHistory();
  updateSummary();
};

billNewBtn?.addEventListener("click", openModal);
billConfirm?.addEventListener("click", () => {
  handleConfirm();
});
billScheduleRemove?.addEventListener("click", () => {
  const ok = confirm("รีเซ็ตการตั้งค่าบิลอัตโนมัติกลับเป็นวันที่ 5 ใช่หรือไม่?");
  if (!ok) return;
  schedule = { ...defaultSchedule };
  saveSchedule();
  updateScheduleInfo(schedule.cutoffDay);
  updateSummary();
});

billModal?.classList.add("hidden");
populateCutoffOptions();
setDefaultRange(schedule.cutoffDay);
const bootstrapPlantPage = async () => {
  setMode(false);
  await hydratePlantMetersFromApi();
  await initBilling();
};
bootstrapPlantPage();
