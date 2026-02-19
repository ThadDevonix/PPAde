/* eslint-disable no-unused-vars -- shared globals for split plant page scripts */
// Billing elements
const billNewBtn = document.getElementById("bill-new-btn");
const billQueuePanel = document.getElementById("bill-queue-panel");
const billQueueTitle = document.getElementById("bill-queue-title");
const billQueueRows = document.getElementById("bill-queue-rows");
const billHistoryPanel = document.getElementById("bill-history-panel");
const billHistoryRows = document.getElementById("bill-history-rows");
const receiptHistory = document.getElementById("receipt-history");
const receiptTitle = document.getElementById("receipt-title");
const receiptRows = document.getElementById("receipt-rows");
const receiptClose = document.getElementById("receipt-close");
const autoRoundModal = document.getElementById("auto-round-modal");
const autoRoundModalTitle = document.getElementById("auto-round-modal-title");
const autoRoundModalRows = document.getElementById("auto-round-modal-rows");
const autoRoundModalClose = document.getElementById("auto-round-modal-close");
const autoRoundModalCloseFooter = document.getElementById(
  "auto-round-modal-close-footer"
);
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
const billHistoryTitle = document.getElementById("bill-history-title");
const billFlowManualBtn = document.getElementById("bill-flow-manual");
const billFlowAutoBtn = document.getElementById("bill-flow-auto");

// Modal
const billModal = document.getElementById("bill-modal");
const billModalClose = document.getElementById("bill-modal-close");
const billModalTitle = document.getElementById("bill-modal-title");
const billCancel = document.getElementById("bill-cancel");
const billConfirm = document.getElementById("bill-confirm");
const billStart = document.getElementById("bill-start");
const billEnd = document.getElementById("bill-end");
const billRateInput = document.getElementById("bill-rate");
const billType = document.getElementById("bill-type");
const calcModeSingleBtn = document.getElementById("calc-mode-single");
const calcModeFormulaBtn = document.getElementById("calc-mode-formula");
const formulaInlineGrid = document.getElementById("formula-inline-grid");
const formulaMeterLeft = document.getElementById("formula-meter-left");
const formulaValueLeft = document.getElementById("formula-value-left");
const formulaMeterLeftLabel = document.getElementById("formula-meter-left-label");
const formulaValueLeftLabel = document.getElementById("formula-value-left-label");
const formulaOperator = document.getElementById("formula-operator");
const formulaOpCell = document.getElementById("formula-op-cell");
const formulaMeterRight = document.getElementById("formula-meter-right");
const formulaValueRight = document.getElementById("formula-value-right");
const formulaMeterRightCell = document.getElementById("formula-meter-right-cell");
const formulaValueRightCell = document.getElementById("formula-value-right-cell");
const formulaResultNameCell = document.getElementById("formula-result-name-cell");
const formulaResultValueCell = document.getElementById("formula-result-value-cell");
const formulaResultName = document.getElementById("formula-result-name");
const formulaResultValue = document.getElementById("formula-result-value");
const billColumnsList = document.getElementById("bill-columns-list");
const columnsSelectAllBtn = document.getElementById("columns-select-all");
const columnsClearBtn = document.getElementById("columns-clear");
const columnsSelectedCount = document.getElementById("columns-selected-count");
const billCutoff = document.getElementById("bill-cutoff");
const billCutoffField = document.getElementById("bill-cutoff-field");
const billDateRangeField = document.getElementById("bill-date-range-field");
const billAutoPreviewField = document.getElementById("bill-auto-preview-field");
const billAutoPreview = document.getElementById("bill-auto-preview");
const metersBtn = document.getElementById("mode-meters");
const billingBtn = document.getElementById("mode-billing");
const metersPanel = document.getElementById("meters-panel");
const billingPanel = document.getElementById("billing-panel");

const deviceEnergyApiCandidates = [
  "/api/device-energy",
  "http://localhost:3000/api/device-energy",
  "http://127.0.0.1:3000/api/device-energy",
  "https://solarmdb.devonix.co.th/api/device-energy"
];
const devicesApiCandidates = [
  "/api/devices",
  "http://localhost:3000/api/devices",
  "http://127.0.0.1:3000/api/devices",
  "https://solarmdb.devonix.co.th/api/devices"
];
const calcMethodLabels = {
  energy_in: "energy_in",
  energy_out: "energy_out",
  energy_net: "energy_in - energy_out",
  self_use: "energy_out",
  mdb_net: "energy_in - energy_out",
  solar_in: "energy_in",
  mdb_in: "energy_in",
  mdb_out: "energy_out"
};
const formulaOperators = ["+", "-", "*", "/"];
const formulaFieldDefs = [
  { key: "energy_in", label: "energy_in" },
  { key: "energy_out", label: "energy_out" }
];
const formulaFieldLabelMap = formulaFieldDefs.reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});
const formulaFieldAliasMap = {
  solar_in: "energy_in",
  self_use: "energy_out",
  mdb_in: "energy_in",
  mdb_out: "energy_out"
};
const defaultFormulaField = "energy_out";
const defaultCalcLabel = "ผลคำนวณ";
const detailColumnDefs = [
  { key: "energy_in", label: "energy_in (kWh)" },
  { key: "energy_out", label: "energy_out (kWh)" },
  { key: "bill_units", label: "หน่วยคิดบิล (kWh)" }
];

let isModalOpen = false;
let isReceiptPreviewOpen = false;
let isMeterCreateModalOpen = false;
let editingPlantMeterIndex = null;
let currentReceiptHtml = "";
let currentReceiptTitle = "";
let currentReceiptContext = null;
let currentReceiptRowsPerPage = 32;
let formulaTerms = [];
let formulaPreviewRequestId = 0;
let calcInputMode = "formula";
let billMode = "manual";

const pad = (value) => String(value).padStart(2, "0");
const formatDate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const formatDateTime = (value) => {
  const numericValue = Number(value);
  const date =
    value instanceof Date
      ? value
      : Number.isFinite(numericValue) && numericValue > 0
        ? new Date(numericValue)
        : null;
  if (!date || Number.isNaN(date.getTime())) return "-";
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
};
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
  if (typeof value === "number") {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    if (Math.abs(numeric) >= 1e11) return formatDate(new Date(numeric));
    if (Math.abs(numeric) >= 1e9) return formatDate(new Date(numeric * 1000));
    return null;
  }
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
const splitDateParts = (value) => {
  const date = normalizeDateValue(value);
  if (!date) return null;
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { date, year, month, day };
};
const normalizeMonthToken = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  const monthMatch = text.match(/^(\d{4})-(\d{1,2})$/);
  if (monthMatch) return `${monthMatch[1]}-${pad(monthMatch[2])}`;
  const date = normalizeDateValue(text);
  if (!date) return "";
  return date.slice(0, 7);
};
const readDayOfMonth = (value) => {
  if (value === undefined || value === null) return null;
  const numeric =
    typeof value === "number" ? Math.trunc(value) : Number.parseInt(String(value), 10);
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 31) return numeric;
  const match = String(value).match(/(\d{1,2})/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 31) return null;
  return parsed;
};
const buildDateFromMonthDay = (monthToken, day) => {
  const match = String(monthToken || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const dayNumber = Number(day);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(dayNumber)) {
    return null;
  }
  const monthIndex = month - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;
  const safeDay = clampDay(year, monthIndex, Math.trunc(dayNumber));
  return `${year}-${pad(month)}-${pad(safeDay)}`;
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
const normalizeRole = (value) => String(value || "").trim().toLowerCase();
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
const homePlantsStorageKey = "plantsDataV2";
const normalizeSiteToken = (value) => String(value || "").trim().toLowerCase();
let currentUserRole = "";
const canDeleteMeters = () => currentUserRole !== "admin";
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
  const modbusIn1 = readText(
    row.modbus_in_1,
    row.modbusIn1,
    row.address_in_1,
    row.addressIn1,
    row.modbus_address_in,
    row.modbusAddressIn
  );
  const modbusIn2 = readText(
    row.modbus_in_2,
    row.modbusIn2,
    row.address_in_2,
    row.addressIn2,
    row.modbus_address_in_2,
    row.modbusAddressIn2
  );
  const modbusOut1 = readText(
    row.modbus_out_1,
    row.modbusOut1,
    row.address_out_1,
    row.addressOut1,
    row.modbus_address_out,
    row.modbusAddressOut
  );
  const modbusOut2 = readText(
    row.modbus_out_2,
    row.modbusOut2,
    row.address_out_2,
    row.addressOut2,
    row.modbus_address_out_2,
    row.modbusAddressOut2
  );
  const serial = readText(
    row.modbus_address_in,
    row.modbusAddressIn,
    row.device_sn,
    row.sn,
    row.serial,
    row.modbus_address_out
  );
  const serialLabel =
    modbusIn1 || modbusIn2 || modbusOut1 || modbusOut2
      ? `IN ${modbusIn1 || "-"} / ${modbusIn2 || "-"}${
          modbusOut1 || modbusOut2 ? ` | OUT ${modbusOut1 || "-"} / ${modbusOut2 || "-"}` : ""
        }`
      : serial;
  return {
    id: Number.isFinite(deviceId) && deviceId > 0 ? deviceId : null,
    siteId: Number.isFinite(siteId) && siteId > 0 ? siteId : null,
    siteCode: readText(row.site_code, row.siteCode),
    siteName: readText(row.site_name, row.siteName),
    name: name || serialLabel || serial || "Meter",
    sn: serialLabel || serial || "-",
    status: normalizeDeviceStatus(
      row.is_active ?? row.active ?? row.isActive ?? row.status
    ),
    deviceType: readText(row.device_type, row.deviceType, row.type) || "METER",
    modbusIn1,
    modbusIn2,
    modbusOut1,
    modbusOut2
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
const getResponseErrorText = async (response) => {
  try {
    const text = await response.text();
    return text ? `: ${text}` : "";
  } catch {
    return "";
  }
};
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
const requestDeviceEnergyApi = async (search = "") => {
  let lastHttpError = null;
  let lastNetworkError = null;
  for (const base of deviceEnergyApiCandidates) {
    const url = buildDevicesApiUrl(base, search);
    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin"
      });
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
  throw new Error("GET /api/device-energy failed");
};
const deleteMeterInApi = async (meter, targetPlant = plant) => {
  const parseLoosePositiveInt = (value) => {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && asNumber > 0) return Math.trunc(asNumber);
    if (typeof value !== "string") return null;
    const match = value.match(/(\d+)/);
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
  };
  const readMeterPersistId = (item) =>
    parseLoosePositiveInt(item?.id ?? item?.apiId ?? item?.device_id ?? item?.deviceId);
  const resolveMeterIdFromApi = async () => {
    const remoteMeters = await fetchPlantDevicesFromApi(targetPlant).catch(() => []);
    if (!remoteMeters.length) return null;
    const targetName = normalizeSiteToken(readText(meter?.name, meter?.device_name, meter?.deviceName));
    const targetSerial = normalizeSiteToken(
      readText(meter?.sn, meter?.serial, meter?.modbus_address_in, meter?.modbusAddressIn)
    );
    const targetIn1 = normalizeSiteToken(readText(meter?.modbusIn1, meter?.modbus_in_1));
    const targetIn2 = normalizeSiteToken(readText(meter?.modbusIn2, meter?.modbus_in_2));
    const matched = remoteMeters.find((item) => {
      const itemId = readMeterPersistId(item);
      if (!Number.isFinite(itemId) || itemId <= 0) return false;
      const itemName = normalizeSiteToken(readText(item?.name, item?.device_name, item?.deviceName));
      const itemSerial = normalizeSiteToken(
        readText(item?.sn, item?.serial, item?.modbus_address_in, item?.modbusAddressIn)
      );
      const itemIn1 = normalizeSiteToken(readText(item?.modbusIn1, item?.modbus_in_1));
      const itemIn2 = normalizeSiteToken(readText(item?.modbusIn2, item?.modbus_in_2));
      const nameMatches = Boolean(targetName && itemName && targetName === itemName);
      const serialMatches = Boolean(targetSerial && itemSerial && targetSerial === itemSerial);
      const inMatches = Boolean(
        (targetIn1 && itemIn1 && targetIn1 === itemIn1) ||
          (targetIn2 && itemIn2 && targetIn2 === itemIn2)
      );
      return serialMatches || inMatches || (nameMatches && (!targetSerial || !itemSerial));
    });
    return readMeterPersistId(matched);
  };
  const verifyMeterRemoved = async (meterId) => {
    const refreshed = await fetchPlantDevicesFromApi(targetPlant).catch(() => null);
    if (!Array.isArray(refreshed)) return null;
    return !refreshed.some((item) => readMeterPersistId(item) === meterId);
  };

  let meterId = readMeterPersistId(meter);
  if (!Number.isFinite(meterId) || meterId <= 0) {
    meterId = await resolveMeterIdFromApi();
  }
  if (!Number.isFinite(meterId) || meterId <= 0) {
    throw new Error("ไม่พบ id ของมิเตอร์ จึงยังลบที่หลังบ้านไม่ได้");
  }

  const encodedMeterId = encodeURIComponent(String(meterId));
  let response = null;
  try {
    response = await fetch(`/api/devices?id=${encodedMeterId}`, {
      method: "DELETE",
      credentials: "same-origin"
    });
  } catch (error) {
    throw error || new Error("DELETE /api/devices?id= failed");
  }
  if (response.ok) {
    let removed = await verifyMeterRemoved(meterId);
    if (removed === false) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 280);
      });
      removed = await verifyMeterRemoved(meterId);
    }
    if (removed === false) {
      throw new Error("API ตอบสำเร็จ แต่ข้อมูลยังไม่ถูกลบจากหลังบ้าน");
    }
    return "api";
  }

  const detail = await getResponseErrorText(response);
  if (response.status === 403) {
    throw new Error(detail.replace(/^:\s*/, "") || "ไม่มีสิทธิ์ลบมิเตอร์");
  }
  if (response.status === 401) {
    throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
  }
  throw new Error(`DELETE /api/devices?id= failed (${response.status})${detail}`);
};
const hydrateCurrentUserRole = async () => {
  currentUserRole = "";
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "same-origin"
    });
    if (!response.ok) return;
    const payload = await response.json().catch(() => ({}));
    currentUserRole = normalizeRole(payload?.user?.role);
  } catch {
    // ignore role lookup errors
  }
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
  return meter.name || meter.sn || "Meter";
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
    return [term(second, "energy_in"), term(second, "energy_out", "-")];
  }
  if (method === "solar_in" || method === "mdb_in" || method === "energy_in") {
    return [term(first, "energy_in")];
  }
  if (method === "mdb_out" || method === "energy_out") return [term(second, "energy_out")];
  return [term(first, "energy_out")];
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
      const rawField = String(term.field || "").trim().toLowerCase();
      const field = formulaFieldLabelMap[rawField]
        ? rawField
        : formulaFieldAliasMap[rawField] || defaultFormulaField;
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
const inferCalcInputMode = (formula, meterPool = meterProfiles) => {
  const terms = normalizeCalcFormula(formula, meterPool, false);
  return terms.length <= 1 ? "single" : "formula";
};
const getSingleModeCalcLabel = () => {
  const fieldKey = formulaFieldLabelMap[formulaValueLeft?.value]
    ? formulaValueLeft.value
    : defaultFormulaField;
  return formulaFieldLabelMap[fieldKey] || defaultCalcLabel;
};
const getFormulaFieldKeysForMeter = (meter) => {
  if (!meter || typeof meter !== "object") return [];
  return ["energy_in", "energy_out"];
};
const buildFormulaValueOptionsHtml = (fieldKeys = []) =>
  fieldKeys.length
    ? fieldKeys
      .map((fieldKey) => {
        const label = formulaFieldLabelMap[fieldKey] || fieldKey;
        return `<option value="${fieldKey}">${label}</option>`;
      })
      .join("")
    : '<option value="">เลือกมิเตอร์ก่อน</option>';
const resolvePreferredFormulaField = (allowedFieldKeys, preferredValues = []) => {
  const allowed = Array.isArray(allowedFieldKeys) ? allowedFieldKeys.filter(Boolean) : [];
  const allFieldKeys = formulaFieldDefs.map((field) => field.key);
  const safeAllowed = allowed.length ? allowed : allFieldKeys;
  for (const candidate of preferredValues) {
    const key = String(candidate || "").trim();
    if (key && safeAllowed.includes(key)) return key;
  }
  if (safeAllowed.includes(defaultFormulaField)) return defaultFormulaField;
  return safeAllowed[0] || defaultFormulaField;
};
const syncFormulaValueOptionsForMeterSelects = ({
  leftPreferredField = "",
  rightPreferredField = "",
  preserveExisting = true
} = {}) => {
  const activeMeters = getSelectedMetersForFormula();
  const meterByKey = new Map(
    activeMeters
      .map((meter) => [getMeterKey(meter), meter])
      .filter(([key]) => key)
  );
  const leftMeter = meterByKey.get(String(formulaMeterLeft?.value || "").trim()) || null;
  const rightMeter = meterByKey.get(String(formulaMeterRight?.value || "").trim()) || null;
  const leftFieldKeys = getFormulaFieldKeysForMeter(leftMeter);
  const rightFieldKeys = getFormulaFieldKeysForMeter(rightMeter);
  if (formulaValueLeft) {
    const html = buildFormulaValueOptionsHtml(leftFieldKeys);
    formulaValueLeft.innerHTML = html;
    formulaValueLeft.disabled = !leftMeter;
    formulaValueLeft.value = leftMeter
      ? resolvePreferredFormulaField(leftFieldKeys, [
        leftPreferredField,
        preserveExisting ? formulaValueLeft.value : "",
        preserveExisting ? formulaValueLeft.dataset.lastValue : "",
        defaultFormulaField
      ])
      : "";
    formulaValueLeft.dataset.lastValue = formulaValueLeft.value;
  }
  if (formulaValueRight) {
    const html = buildFormulaValueOptionsHtml(rightFieldKeys);
    formulaValueRight.innerHTML = html;
    formulaValueRight.disabled = !rightMeter;
    formulaValueRight.value = rightMeter
      ? resolvePreferredFormulaField(rightFieldKeys, [
        rightPreferredField,
        preserveExisting ? formulaValueRight.value : "",
        preserveExisting ? formulaValueRight.dataset.lastValue : "",
        defaultFormulaField
      ])
      : "";
    formulaValueRight.dataset.lastValue = formulaValueRight.value;
  }
  if (calcInputMode === "single" && formulaResultName) {
    formulaResultName.value = getSingleModeCalcLabel();
  }
};
const setCalcInputMode = (mode, options = {}) => {
  const { skipPreview = false } = options;
  calcInputMode = mode === "single" ? "single" : "formula";
  const isSingle = calcInputMode === "single";
  calcModeSingleBtn?.classList.toggle("active", isSingle);
  calcModeFormulaBtn?.classList.toggle("active", !isSingle);
  formulaInlineGrid?.classList.toggle("single-mode", isSingle);
  formulaOpCell?.classList.toggle("hidden", isSingle);
  formulaMeterRightCell?.classList.toggle("hidden", isSingle);
  formulaValueRightCell?.classList.toggle("hidden", isSingle);
  formulaResultNameCell?.classList.toggle("hidden", isSingle);
  formulaResultValueCell?.classList.toggle("hidden", isSingle);
  if (formulaMeterLeftLabel) {
    formulaMeterLeftLabel.textContent = "ชื่อมิเตอร์";
  }
  if (formulaValueLeftLabel) {
    formulaValueLeftLabel.textContent = "ค่าที่ใช้คำนวณ";
  }
  if (isSingle && formulaResultName) {
    formulaResultName.value = getSingleModeCalcLabel();
  }
  if (isSingle && formulaResultValue) {
    formulaResultValue.value = "-";
  }
  if (!skipPreview && isModalOpen) updateFormulaResultPreview();
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
  if (calcInputMode === "single") {
    return normalizeCalcFormula(
      [
        {
          operator: "+",
          meterKey: getMeterKey(firstMeter),
          meterName: firstMeter?.name || "",
          field: firstField
        }
      ],
      activeMeters
    );
  }
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
  if (calcInputMode === "single") return getSingleModeCalcLabel();
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
  if (formulaMeterLeft) formulaMeterLeft.innerHTML = meterOptions;
  if (formulaMeterRight) formulaMeterRight.innerHTML = meterOptions;

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
  const leftMeterKey = leftTerm.meterKey || getMeterKey(activeMeters[0]);
  const rightMeterKey = rightTerm.meterKey || getMeterKey(activeMeters[1] || activeMeters[0]);
  if (formulaMeterLeft) formulaMeterLeft.value = leftMeterKey;
  if (formulaOperator) formulaOperator.value = rightTerm.operator || "-";
  if (formulaMeterRight) formulaMeterRight.value = rightMeterKey;
  syncFormulaValueOptionsForMeterSelects({
    leftPreferredField: leftTerm.field || defaultFormulaField,
    rightPreferredField: rightTerm.field || defaultFormulaField,
    preserveExisting: false
  });
  if (formulaResultName) formulaResultName.value = calcLabel || defaultCalcLabel;
  formulaTerms = buildFormulaFromInputs();
};
const updateFormulaResultPreview = async () => {
  if (!formulaResultValue) return;
  let startDate = billStart?.value;
  let endDate = billEnd?.value;
  if (billMode === "auto") {
    const { startStr, endStr } = getAutoPreviewRange(billCutoff?.value);
    startDate = startStr;
    endDate = endStr;
  }
  formulaTerms = buildFormulaFromInputs();
  if (calcInputMode === "single") {
    formulaResultValue.value = "-";
    return;
  }
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
    if (terms[0].field === "energy_in") return "energy_in";
    if (terms[0].field === "energy_out") return "energy_out";
  }
  if (
    terms.length === 2 &&
    terms[0].field === "energy_in" &&
    terms[1].field === "energy_out" &&
    terms[1].operator === "-"
  ) {
    return "energy_net";
  }
  return defaultSchedule.calcMethod;
};
const getMetersFromFormula = (formula, meterPool = meterProfiles) => {
  const normalized = normalizeCalcFormula(formula, meterPool, false);
  if (!Array.isArray(meterPool) || !meterPool.length) return [];
  if (!normalized.length) return [meterPool[0]];
  const picked = [];
  const seen = new Set();
  normalized.forEach((term) => {
    const meterKey = String(term?.meterKey || "").trim();
    const meterName = String(term?.meterName || "").trim();
    const meter = meterPool.find((candidate) => {
      const candidateKey = getMeterKey(candidate);
      if (meterKey && candidateKey === meterKey) return true;
      if (meterName && candidate?.name === meterName) return true;
      return false;
    });
    if (!meter) return;
    const stableKey = getMeterKey(meter) || `${meter.name || ""}|${meter.sn || ""}`;
    if (!stableKey || seen.has(stableKey)) return;
    seen.add(stableKey);
    picked.push(meter);
  });
  return picked.length ? picked : [meterPool[0]];
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
const hideReceiptHistory = () => {
  receiptHistory?.classList.add("hidden");
};
const buildReceiptHtml = ({ bill, issueDate, rowsPerPage = 32 }) => {
  const meterPool = Array.isArray(bill?.meters) ? bill.meters : [];
  const formulaTerms = Array.isArray(bill?.calcFormula) && bill.calcFormula.length
    ? normalizeCalcFormula(bill.calcFormula, meterPool, false)
    : normalizeCalcFormula(
      buildLegacyFormula(bill?.calcMethod || defaultSchedule.calcMethod, meterPool),
      meterPool,
      false
    );
  const leftTerm = formulaTerms[0] || null;
  const rightTerm = formulaTerms[1] || null;
  const showFormulaColumns = Boolean(leftTerm && rightTerm);
  const resolveMeterLabel = (term) => {
    if (!term) return "Meter";
    const termKey = String(term.meterKey || "").trim();
    const termName = String(term.meterName || "").trim();
    const matchedMeter = meterPool.find((meter) => {
      const meterKey = getMeterKey(meter);
      if (termKey && meterKey && meterKey === termKey) return true;
      if (termName && meter?.name === termName) return true;
      return false;
    });
    if (matchedMeter) return getMeterLabel(matchedMeter);
    return termName || termKey || "Meter";
  };
  const getTermDetail = (term, fallbackLabel) => {
    if (!term) return fallbackLabel;
    const fieldLabel = formulaFieldLabelMap[term.field] || term.field || fallbackLabel;
    return `${fieldLabel}: ${resolveMeterLabel(term)}`;
  };
  const getTermHeaderLabel = (term, fallbackLabel) => {
    if (!term) return fallbackLabel;
    const fieldLabel = formulaFieldLabelMap[term.field] || term.field || fallbackLabel;
    const meterLabel = resolveMeterLabel(term).replace(/\s*\(SN:[^)]+\)\s*$/, "");
    return `${fieldLabel} (${meterLabel})`;
  };
  const formulaLabel = formulaTerms.length
    ? formatFormulaLabel(formulaTerms, meterPool)
    : "-";
  const dailyRows = [...(bill.daily || [])]
    .filter((row) => row?.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((row) => {
      const leftValue = leftTerm ? getFormulaTermValue(row, leftTerm) : null;
      const rightValue = rightTerm ? getFormulaTermValue(row, rightTerm) : null;
      const units = showFormulaColumns
        ? parseNumber(row.bill_units)
        : leftTerm
          ? parseNumber(leftValue)
          : parseNumber(row.bill_units);
      return {
        date: row.date,
        units,
        leftValue: showFormulaColumns ? leftValue : null,
        rightValue: showFormulaColumns ? rightValue : null
      };
    });
  const totalKwh = roundTo(
    dailyRows.reduce((sum, row) => sum + row.units, 0),
    1
  );
  const rate = parseNumber(bill.rate);
  const calculatedAmount = roundTo(totalKwh * rate, 2);
  const totalAmount = calculatedAmount;
  const plantName = plant?.name || "PONIX";
  const issueLabel = formatThaiDateShort(issueDate);
  const periodLabel =
    bill?.periodStart && bill?.periodEnd
      ? `${formatThaiDateShort(bill.periodStart)} - ${formatThaiDateShort(
        bill.periodEnd
      )}`
      : formatThaiMonthYear(issueDate);
  const summaryHtml = `
    <div class="receipt-summary simple">
      <div class="box">
        <div class="row"><span>kWh รวม</span><span>${formatNumber(totalKwh, 1)} kWh</span></div>
        <div class="row"><span>${formatNumber(totalKwh, 1)} × ${formatNumber(
    rate,
    2
  )}</span><span>${formatNumber(calculatedAmount, 2)} บาท</span></div>
        <div class="row total"><span>ยอดรวมบิลงวดนี้</span><span>${formatNumber(totalAmount, 2)} บาท</span></div>
      </div>
    </div>
  `;
  const pageCount = Math.max(1, Math.ceil(dailyRows.length / rowsPerPage));
  const buildRowsHtml = (rows) =>
    rows
      .map((row) => `
        <tr>
          <td class="date-cell">${formatThaiDateShort(row.date)}</td>
          ${showFormulaColumns
      ? `<td class="num-cell">${formatNumber(row.leftValue, 1)}</td>
             <td class="op-cell">${escapeHtml(formulaOperator)}</td>
             <td class="num-cell">${formatNumber(row.rightValue, 1)}</td>`
      : ""}
          <td class="num-cell">${formatNumber(row.units, 1)}</td>
        </tr>
      `)
      .join("");
  const termOneDetail = getTermDetail(leftTerm, "ค่าที่ใช้คำนวณ 1");
  const termTwoDetail = getTermDetail(rightTerm, "ค่าที่ใช้คำนวณ 2");
  const termOneHeader = getTermHeaderLabel(leftTerm, "ค่าที่ใช้คำนวณ 1");
  const termTwoHeader = getTermHeaderLabel(rightTerm, "ค่าที่ใช้คำนวณ 2");
  const usageHeaderText = "พลังงานที่ใช้ (kWh)";
  const usageHeaderTitle = showFormulaColumns
    ? "พลังงานที่ใช้หลังคำนวณ"
    : leftTerm
      ? termOneHeader
      : usageHeaderText;
  const formulaOperator =
    showFormulaColumns && formulaOperators.includes(rightTerm?.operator)
      ? rightTerm.operator
      : "-";
  const colgroupHtml = showFormulaColumns
    ? `<colgroup>
            <col style="width:30%">
            <col style="width:21%">
            <col style="width:7%">
            <col style="width:21%">
            <col style="width:21%">
          </colgroup>`
    : `<colgroup>
            <col style="width:72%">
            <col style="width:28%">
          </colgroup>`;
  const formulaHeadHtml = showFormulaColumns
    ? `<th class="num-cell" title="${escapeHtml(termOneDetail)}">${escapeHtml(
      termOneHeader
    )}</th>
               <th class="op-cell" title="เครื่องหมาย">${escapeHtml(formulaOperator)}</th>
               <th class="num-cell" title="${escapeHtml(termTwoDetail)}">${escapeHtml(
      termTwoHeader
    )}</th>`
    : "";
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
          <div>ช่วงบิล: ${periodLabel}</div>
          <div>วันที่ออกใบเสร็จ: ${issueLabel}</div>
          <div>อัตรา: ${formatNumber(rate, 2)} บาท/kWh</div>
          <div>สูตรคำนวณ: ${escapeHtml(formulaLabel)}</div>
        </div>
      </div>
      <div class="receipt-divider"></div>
      <div class="receipt-table-area">
        <table class="receipt-table receipt-usage-table">
          ${colgroupHtml}
          <thead>
            <tr>
              <th class="date-cell">วันที่</th>
              ${formulaHeadHtml}
              <th class="num-cell" title="${escapeHtml(usageHeaderTitle)}">${escapeHtml(
      usageHeaderText
    )}</th>
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
  const periodText =
    bill?.periodStart && bill?.periodEnd
      ? `${bill.periodStart} - ${bill.periodEnd}`
      : formatThaiMonthYear(issueDate);
  if (receiptPreviewMonth) {
    receiptPreviewMonth.textContent = `ช่วงบิล ${periodText}`;
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
  const printableStyles = [
    ...Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((link) => {
        const href = String(link.href || "").trim();
        if (!href) return "";
        const media = String(link.media || "").trim();
        const mediaAttr = media && media !== "all" ? ` media="${escapeHtml(media)}"` : "";
        return `<link rel="stylesheet" href="${escapeHtml(href)}"${mediaAttr}>`;
      })
      .filter(Boolean),
    ...Array.from(document.querySelectorAll("style")).map((style) => style.outerHTML)
  ].join("\n");
  win.document.write(`
    <html>
      <head>
        <title>${currentReceiptTitle}</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${printableStyles}
      </head>
      <body class="pdf-view">${currentReceiptHtml}</body>
    </html>
  `);
  win.document.close();

  const waitForPrintAssets = () => {
    const stylesheetPromises = Array.from(
      win.document.querySelectorAll('link[rel="stylesheet"]')
    ).map(
      (link) =>
        new Promise((resolve) => {
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            resolve();
          };
          if (link.sheet) {
            done();
            return;
          }
          link.addEventListener("load", done, { once: true });
          link.addEventListener("error", done, { once: true });
          setTimeout(done, 2000);
        })
    );
    const fontsPromise =
      win.document.fonts && win.document.fonts.ready
        ? win.document.fonts.ready.catch(() => undefined)
        : Promise.resolve();
    return Promise.all([...stylesheetPromises, fontsPromise]);
  };
  const triggerPrint = () => {
    win.focus();
    win.print();
  };
  const schedulePrint = () => {
    waitForPrintAssets().then(() => {
      setTimeout(triggerPrint, 80);
    });
  };
  if (win.document.readyState === "complete") {
    schedulePrint();
    return;
  }
  win.addEventListener(
    "load",
    () => {
      schedulePrint();
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

const buildDefaultScheduleFields = () => ({
  defaultRate: 4.2,
  rateType: "flat",
  calcMethod: "energy_out",
  calcFormula: [],
  calcLabel: defaultCalcLabel,
  detailColumns: detailColumnDefs.map((col) => col.key)
});
const defaultSchedule = {
  cutoffDay: 5,
  ...buildDefaultScheduleFields(),
  autoSchedules: []
};
let schedule = { ...defaultSchedule };
let history = [];
let billSequence = 0;
let meterProfiles = [];
let historyKey = "billingHistory";
let scheduleKey = "billingSchedule";
let sequenceKey = "billingSequence";

const normalizeDetailColumns = (columns) => {
  if (!Array.isArray(columns) || !columns.length) {
    return [...defaultSchedule.detailColumns];
  }
  const allowed = new Set(detailColumnDefs.map((col) => col.key));
  const normalized = columns.filter((key) => allowed.has(key));
  return normalized.length ? normalized : [...defaultSchedule.detailColumns];
};
const normalizeAutoScheduleEntry = (raw, fallback = defaultSchedule) => {
  const fallbackFields = {
    defaultRate: fallback?.defaultRate ?? defaultSchedule.defaultRate,
    rateType: fallback?.rateType ?? defaultSchedule.rateType,
    calcMethod: fallback?.calcMethod ?? defaultSchedule.calcMethod,
    calcFormula: Array.isArray(fallback?.calcFormula) ? fallback.calcFormula : [],
    calcLabel:
      typeof fallback?.calcLabel === "string" && fallback.calcLabel.trim()
        ? fallback.calcLabel.trim()
        : defaultCalcLabel,
    detailColumns: normalizeDetailColumns(fallback?.detailColumns)
  };
  const cutoffDay = Math.max(
    1,
    Math.min(31, Number(raw?.cutoffDay) || Number(fallback?.cutoffDay) || defaultSchedule.cutoffDay)
  );
  const rate = parseFloat(`${raw?.defaultRate ?? fallbackFields.defaultRate}`);
  const rawUpdatedAt = Number(raw?.updatedAt ?? fallback?.updatedAt);
  const updatedAt =
    Number.isFinite(rawUpdatedAt) && rawUpdatedAt > 0 ? rawUpdatedAt : null;
  return {
    cutoffDay,
    defaultRate: Number.isFinite(rate) ? roundTo(rate, 2) : defaultSchedule.defaultRate,
    rateType: raw?.rateType || fallbackFields.rateType,
    calcMethod: raw?.calcMethod || fallbackFields.calcMethod,
    calcFormula: Array.isArray(raw?.calcFormula) ? raw.calcFormula : fallbackFields.calcFormula,
    calcLabel:
      typeof raw?.calcLabel === "string" && raw.calcLabel.trim()
        ? raw.calcLabel.trim()
        : fallbackFields.calcLabel,
    detailColumns: normalizeDetailColumns(raw?.detailColumns),
    updatedAt
  };
};
const getAutoSchedules = () =>
  Array.isArray(schedule?.autoSchedules) ? schedule.autoSchedules : [];
const listAutoCutoffDays = () =>
  getAutoSchedules()
    .map((item) => Number(item?.cutoffDay))
    .filter((day) => Number.isFinite(day) && day >= 1 && day <= 31)
    .sort((a, b) => a - b);
const getAutoScheduleByCutoff = (cutoffDay) => {
  const target = Number(cutoffDay);
  if (!Number.isFinite(target)) return null;
  return getAutoSchedules().find((item) => Number(item?.cutoffDay) === target) || null;
};
const upsertAutoSchedule = (entry) => {
  const targetCutoffDay = Math.max(
    1,
    Math.min(
      31,
      Number(entry?.cutoffDay) || Number(schedule?.cutoffDay) || defaultSchedule.cutoffDay
    )
  );
  const existingEntry = getAutoScheduleByCutoff(targetCutoffDay);
  const normalized = normalizeAutoScheduleEntry(entry, existingEntry || schedule);
  const current = getAutoSchedules().filter(
    (item) => Number(item?.cutoffDay) !== normalized.cutoffDay
  );
  current.push(normalized);
  current.sort((a, b) => Number(a.cutoffDay) - Number(b.cutoffDay));
  schedule.autoSchedules = current;
  return normalized;
};
const updateScheduleInfo = (cutoffDay = schedule.cutoffDay) => {
  const dayValue = Number(cutoffDay) || defaultSchedule.cutoffDay;
  const allDays = listAutoCutoffDays();
  const dayListText = allDays.length ? allDays.join(", ") : `${dayValue}`;
  if (billCyclePill)
    billCyclePill.textContent = `สร้างอัตโนมัติวันที่ ${dayListText}`;
  if (billCutoffPill)
    billCutoffPill.textContent = `ตัดรอบวันที่ ${dayValue}`;
  if (billScheduleDesc)
    billScheduleDesc.textContent = `ระบบจะสร้างบิลอัตโนมัติวันที่ ${dayListText} ของเดือน`;
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

const buildMeterProfiles = (meters) =>
  (Array.isArray(meters) ? meters : []).map((meter) => ({ ...meter }));

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

const normalizeDailyRows = (rows, options = {}) => {
  const fallbackMonthToken = normalizeMonthToken(options?.monthToken || options?.month || "");
  const map = new Map();
  rows.forEach((row) => {
    if (!row || typeof row !== "object") return;
    let date = normalizeDateValue(
      row.date ?? row.datetime ?? row.timestamp ?? row.ts ?? row.created_at ?? row.createdAt
    );
    if (!date) {
      const monthToken = normalizeMonthToken(
        row.month ?? row.period_month ?? row.periodMonth ?? row.month_token ?? row.monthToken
      ) || fallbackMonthToken;
      const day = readDayOfMonth(row.day ?? row.date ?? row.label);
      if (monthToken && day) {
        date = buildDateFromMonthDay(monthToken, day);
      }
    }
    if (!date) return;
    const usage = normalizeDailyUsageValue(row);
    map.set(date, {
      date,
      ...usage
    });
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};

const normalizeKeyToken = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
const readLooseValue = (row, keys) => {
  if (!row || typeof row !== "object" || Array.isArray(row)) return undefined;
  const wanted = new Set((Array.isArray(keys) ? keys : []).map(normalizeKeyToken));
  for (const [rawKey, value] of Object.entries(row)) {
    if (wanted.has(normalizeKeyToken(rawKey))) return value;
  }
  return undefined;
};
const readLooseNumber = (row, keys) => {
  const value = readLooseValue(row, keys);
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
};
const normalizeDailyUsageValue = (row) => {
  const energyIn = roundTo(
    Math.max(
      0,
      parseNumber(
        row?.energy_in ??
          row?.energyIn ??
          row?.solar_in ??
          row?.solarIn ??
          row?.solar ??
          row?.pv
      )
    ),
    1
  );
  const energyOut = roundTo(
    Math.max(
      0,
      parseNumber(
        row?.energy_out ??
          row?.energyOut ??
          row?.self_use ??
          row?.selfUse ??
          row?.self ??
          row?.mdb_in ??
          row?.mdbIn ??
          row?.mdb_in_kwh
      )
    ),
    1
  );
  const mdbOut = roundTo(
    Math.max(
      0,
      parseNumber(
        row?.mdb_out ??
          row?.mdbOut ??
          row?.mdb_out_kwh ??
          row?.energy_export ??
          row?.energyExport ??
          row?.export
      )
    ),
    1
  );
  return {
    energy_in: energyIn,
    energy_out: energyOut,
    solar_in: energyIn,
    self_use: energyOut,
    mdb_in: energyOut,
    mdb_out: mdbOut
  };
};
const hasDailyUsageFields = (row) => {
  if (!row || typeof row !== "object") return false;
  return [
    row.solar_in,
    row.solarIn,
    row.solar,
    row.self_use,
    row.selfUse,
    row.self,
    row.mdb_in,
    row.mdbIn,
    row.energy_in,
    row.energyIn,
    row.energy_out,
    row.energyOut,
    row.mdb_out,
    row.mdbOut
  ].some((value) => value !== undefined && value !== null && value !== "");
};
const readSummaryUsageFromPayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  const candidates = [];
  if (!Array.isArray(payload)) candidates.push(payload);
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    candidates.push(payload.data);
  }
  if (payload.result && typeof payload.result === "object" && !Array.isArray(payload.result)) {
    candidates.push(payload.result);
  }
  for (const candidate of candidates) {
    const summary = candidate?.summary;
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) continue;
    const energyIn = readLooseNumber(summary, [
      "energy_in",
      "energyIn",
      "solar_in",
      "solarIn"
    ]);
    const energyOut = readLooseNumber(summary, [
      "energy_out",
      "energyOut",
      "self_use",
      "selfUse",
      "mdb_in",
      "mdbIn"
    ]);
    const mdbOut = readLooseNumber(summary, [
      "mdb_out",
      "mdbOut",
      "energy_export",
      "energyExport",
      "export"
    ]);
    if (energyIn === null && energyOut === null && mdbOut === null) continue;
    return normalizeDailyUsageValue({
      solar_in: energyIn ?? 0,
      self_use: energyOut ?? 0,
      mdb_in: energyOut ?? 0,
      mdb_out: mdbOut ?? 0
    });
  }
  return null;
};
const extractTimeseriesRowsForDate = (payload, dateStr) => {
  const targetDate = normalizeDateValue(dateStr);
  if (!targetDate || !payload || typeof payload !== "object") return [];
  const queue = [{ node: payload, baseDate: "" }];
  const rows = [];
  while (queue.length) {
    const { node, baseDate } = queue.shift() || {};
    const inheritedDate = normalizeDateValue(baseDate);
    if (!node || typeof node !== "object") continue;
    if (Array.isArray(node)) {
      node.forEach((child) => {
        queue.push({ node: child, baseDate: inheritedDate });
      });
      continue;
    }
    const nodeDate =
      normalizeDateValue(
        readLooseValue(node, [
          "date",
          "day",
          "datetime",
          "timestamp",
          "created_at",
          "createdAt"
        ])
      ) || inheritedDate;
    const timeseries = Array.isArray(node.timeseries) ? node.timeseries : [];
    timeseries.forEach((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return;
      const rowDate =
        normalizeDateValue(
          readLooseValue(row, [
            "date",
            "day",
            "datetime",
            "timestamp",
            "created_at",
            "createdAt"
          ])
        ) || nodeDate;
      if (rowDate === targetDate) rows.push(row);
    });
    Object.values(node).forEach((child) => {
      if (child && typeof child === "object") {
        queue.push({ node: child, baseDate: nodeDate });
      }
    });
  }
  return rows;
};
const readSeriesTimestamp = (row) => {
  const raw = readLooseValue(row, [
    "datetime",
    "timestamp",
    "ts",
    "time",
    "created_at",
    "createdAt"
  ]);
  const stamp = Date.parse(String(raw || ""));
  return Number.isFinite(stamp) ? stamp : null;
};
const resolveSeriesDailyTotal = (points) => {
  const source = Array.isArray(points) ? points : [];
  const list = source
    .map((item) => ({
      value: Number(item?.value),
      stamp: Number(item?.stamp)
    }))
    .filter((item) => Number.isFinite(item.value));
  if (!list.length) return 0;
  const hasStamp = list.every((item) => Number.isFinite(item.stamp));
  const ordered = hasStamp
    ? [...list].sort((a, b) => Number(a.stamp) - Number(b.stamp))
    : list;
  const values = ordered.map((item) => item.value);
  const monotonicUp = values.every(
    (value, idx) => idx === 0 || value >= values[idx - 1] - 1e-9
  );
  if (monotonicUp && values.length >= 2) {
    const delta = Math.max(0, values[values.length - 1] - values[0]);
    if (delta > 0) return delta;
  }
  return values.reduce((sum, value) => sum + Math.max(0, value), 0);
};
const buildDailyUsageFromTimeseriesRows = (rows) => {
  const points = Array.isArray(rows) ? rows : [];
  if (!points.length) return null;
  const solarPoints = [];
  const selfUsePoints = [];
  const mdbOutPoints = [];
  points.forEach((row) => {
    const stamp = readSeriesTimestamp(row);
    const solar = readLooseNumber(row, [
      "solar_in",
      "solarIn",
      "solar",
      "energy_in",
      "energyIn",
      "pv",
      "pv_in",
      "pvIn"
    ]);
    if (solar !== null) solarPoints.push({ value: solar, stamp });
    const selfUse = readLooseNumber(row, [
      "self_use",
      "selfUse",
      "self",
      "mdb_in",
      "mdbIn",
      "energy_out",
      "energyOut",
      "grid_import",
      "gridImport",
      "consumption"
    ]);
    if (selfUse !== null) selfUsePoints.push({ value: selfUse, stamp });
    const mdbOut = readLooseNumber(row, [
      "mdb_out",
      "mdbOut",
      "energy_export",
      "energyExport",
      "export",
      "grid_export",
      "gridExport"
    ]);
    if (mdbOut !== null) mdbOutPoints.push({ value: mdbOut, stamp });
  });

  const solarDaily = resolveSeriesDailyTotal(solarPoints);
  const selfUseDaily = resolveSeriesDailyTotal(selfUsePoints);
  const mdbOutDaily = resolveSeriesDailyTotal(mdbOutPoints);
  if (!solarDaily && !selfUseDaily && !mdbOutDaily) return null;
  return normalizeDailyUsageValue({
    solar_in: solarDaily,
    self_use: selfUseDaily,
    mdb_in: selfUseDaily,
    mdb_out: mdbOutDaily
  });
};
const getMetersWithApiId = () => {
  const meters = Array.isArray(meterProfiles) ? meterProfiles : [];
  const byId = new Map();
  meters.forEach((meter) => {
    const meterId = Number(meter?.id);
    if (!Number.isFinite(meterId) || meterId <= 0) return;
    if (!byId.has(meterId)) byId.set(meterId, meter);
  });
  return Array.from(byId.values());
};
const readMeterDailyValueFromRow = (row, meter) => {
  if (row?.by_meter && typeof row.by_meter === "object") {
    const meterKey = getMeterKey(meter);
    if (meterKey && row.by_meter[meterKey]) {
      return normalizeDailyUsageValue(row.by_meter[meterKey]);
    }
    const meterId = Number(meter?.id);
    if (Number.isFinite(meterId) && row.by_meter[meterId]) {
      return normalizeDailyUsageValue(row.by_meter[meterId]);
    }
    const firstValue = Object.values(row.by_meter).find(
      (item) => item && typeof item === "object"
    );
    if (firstValue) return normalizeDailyUsageValue(firstValue);
  }
  return normalizeDailyUsageValue(row);
};
const resolveDailyRowFromPayload = (payload, dateStr) => {
  const targetDate = normalizeDateValue(dateStr);
  const targetMonthToken = targetDate ? targetDate.slice(0, 7) : "";
  const rawRows = extractDailyRows(payload);
  const directRows = normalizeDailyRows(rawRows, { monthToken: targetMonthToken });
  return directRows.find((row) => row.date === targetDate) || null;
};
const readPayloadPeriodToken = (payload) => {
  if (!payload || typeof payload !== "object") return "";
  const candidates = [];
  if (!Array.isArray(payload)) candidates.push(payload);
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    candidates.push(payload.data);
  }
  if (payload.result && typeof payload.result === "object" && !Array.isArray(payload.result)) {
    candidates.push(payload.result);
  }
  for (const candidate of candidates) {
    const token = String(readLooseValue(candidate, ["period"]) || "")
      .trim()
      .toLowerCase();
    if (token) return token;
  }
  return "";
};
const readDirectDailyUsageFromPayload = (payload, dateStr = "") => {
  if (!payload || typeof payload !== "object") return null;
  const targetDate = normalizeDateValue(dateStr);
  const periodToken = readPayloadPeriodToken(payload);
  const candidates = [];
  if (!Array.isArray(payload)) candidates.push(payload);
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    candidates.push(payload.data);
  }
  if (payload.result && typeof payload.result === "object" && !Array.isArray(payload.result)) {
    candidates.push(payload.result);
  }
  for (const candidate of candidates) {
    if (!hasDailyUsageFields(candidate)) continue;
    const candidateDate = normalizeDateValue(
      readLooseValue(candidate, ["date", "day", "datetime", "timestamp", "created_at", "createdAt"])
    );
    if (targetDate && candidateDate && candidateDate !== targetDate) continue;
    if (targetDate && !candidateDate && periodToken && periodToken !== "day") continue;
    return normalizeDailyUsageValue(candidate);
  }
  return null;
};
const resolveDailyUsageFromPayload = (payload, dateStr, meter) => {
  const dailyRow = resolveDailyRowFromPayload(payload, dateStr);
  if (dailyRow) return readMeterDailyValueFromRow(dailyRow, meter);
  const timeseriesRows = extractTimeseriesRowsForDate(payload, dateStr);
  const timeseriesUsage = buildDailyUsageFromTimeseriesRows(timeseriesRows);
  if (timeseriesUsage) return timeseriesUsage;
  const directUsage = readDirectDailyUsageFromPayload(payload, dateStr);
  if (directUsage) return directUsage;
  if (readPayloadPeriodToken(payload) === "day") {
    const summaryUsage = readSummaryUsageFromPayload(payload);
    if (summaryUsage) return summaryUsage;
  }
  return null;
};
const fetchDeviceEnergyDayForMeter = async (meter, dateStr, monthPayloadCache = null) => {
  const meterId = Number(meter?.id);
  const dateParts = splitDateParts(dateStr);
  if (!Number.isFinite(meterId) || meterId <= 0 || !dateParts) return null;
  const monthToken = `${dateParts.year}-${pad(dateParts.month)}`;

  const siteId = Number(meter?.siteId ?? plant?.apiId);
  const buildBaseParams = () => {
    const params = new URLSearchParams();
    params.set("device_id", String(meterId));
    if (Number.isFinite(siteId) && siteId > 0) {
      params.set("site_id", String(siteId));
    }
    return params;
  };

  let values = null;
  try {
    const monthParams = buildBaseParams();
    monthParams.set("period", "month");
    monthParams.set("month", monthToken);
    const monthCacheKey = `${meterId}:${Number.isFinite(siteId) ? siteId : "all"}:${monthToken}`;
    let payloadPromise = null;
    if (monthPayloadCache && monthPayloadCache.has(monthCacheKey)) {
      payloadPromise = monthPayloadCache.get(monthCacheKey);
    } else {
      payloadPromise = (async () => {
        const response = await requestDeviceEnergyApi(`?${monthParams.toString()}`);
        return response.json().catch(() => null);
      })();
      if (monthPayloadCache) monthPayloadCache.set(monthCacheKey, payloadPromise);
    }
    const payload = await payloadPromise;
    values = resolveDailyUsageFromPayload(payload, dateParts.date, meter);
  } catch {
    // fallback to legacy per-day request below
  }

  if (!values) {
    const dayParams = buildBaseParams();
    dayParams.set("year", String(dateParts.year));
    dayParams.set("month", String(dateParts.month));
    dayParams.set("day", String(dateParts.day));
    const response = await requestDeviceEnergyApi(`?${dayParams.toString()}`);
    const payload = await response.json().catch(() => null);
    values = resolveDailyUsageFromPayload(payload, dateParts.date, meter);
  }
  if (!values) return null;
  return {
    meter,
    meterKey: getMeterKey(meter),
    values
  };
};
const fetchDeviceEnergyRange = async (startStr, endStr) => {
  const start = parseDateInput(startStr);
  const end = parseDateInput(endStr);
  if (!start || !end) return [];
  const apiMeters = getMetersWithApiId();
  if (!apiMeters.length) return [];

  const rows = [];
  const monthPayloadCache = new Map();
  let hasAnyReading = false;
  const dates = listDatesInclusive(start, end);
  for (const dateStr of dates) {
    const dayItems = await Promise.all(
      apiMeters.map((meter) =>
        fetchDeviceEnergyDayForMeter(meter, dateStr, monthPayloadCache).catch(() => null)
      )
    );
    const resolvedItems = dayItems.filter(
      (item) => item && typeof item.meterKey === "string" && item.meterKey
    );
    if (resolvedItems.length) hasAnyReading = true;

    const by_meter = {};
    let totalEnergyIn = 0;
    let totalEnergyOut = 0;
    let totalMdbOut = 0;
    resolvedItems.forEach((item) => {
      const usage = normalizeDailyUsageValue(item.values);
      by_meter[item.meterKey] = usage;
      totalEnergyIn += usage.energy_in;
      totalEnergyOut += usage.energy_out;
      totalMdbOut += usage.mdb_out;
    });
    rows.push({
      date: dateStr,
      energy_in: roundTo(totalEnergyIn, 1),
      energy_out: roundTo(totalEnergyOut, 1),
      solar_in: roundTo(totalEnergyIn, 1),
      self_use: roundTo(totalEnergyOut, 1),
      mdb_in: roundTo(totalEnergyOut, 1),
      mdb_out: roundTo(totalMdbOut, 1),
      by_meter
    });
  }
  if (!hasAnyReading) return [];
  return rows;
};

const fetchEnergyRange = async (startStr, endStr) => {
  const deviceRows = await fetchDeviceEnergyRange(startStr, endStr).catch(
    () => []
  );
  return deviceRows.sort((a, b) => a.date.localeCompare(b.date));
};

const getDailyEnergyForRange = async (startStr, endStr) => {
  const apiRows = await fetchEnergyRange(startStr, endStr);
  return { rows: apiRows, source: "api" };
};

const buildStorageKey = (prefix) => {
  const safePlant = plant?.name
    ? plant.name.replace(/[^a-zA-Z0-9_-]+/g, "_")
    : "default";
  return `${prefix}:${safePlant}`;
};

const loadSchedule = () => {
  schedule = {
    cutoffDay: defaultSchedule.cutoffDay,
    ...buildDefaultScheduleFields(),
    autoSchedules: []
  };
  try {
    const saved = localStorage.getItem(scheduleKey);
    if (saved) schedule = { ...schedule, ...JSON.parse(saved) };
  } catch {
    schedule = {
      cutoffDay: defaultSchedule.cutoffDay,
      ...buildDefaultScheduleFields(),
      autoSchedules: []
    };
  }
  const normalizedTop = normalizeAutoScheduleEntry(schedule, defaultSchedule);
  schedule.cutoffDay = normalizedTop.cutoffDay;
  schedule.defaultRate = normalizedTop.defaultRate;
  schedule.rateType = normalizedTop.rateType;
  schedule.calcMethod = normalizedTop.calcMethod;
  schedule.calcFormula = normalizedTop.calcFormula;
  schedule.calcLabel = normalizedTop.calcLabel;
  schedule.detailColumns = normalizedTop.detailColumns;

  const rawAutoSchedules = Array.isArray(schedule.autoSchedules)
    ? schedule.autoSchedules
    : [];
  const sourceSchedules = rawAutoSchedules.length
    ? rawAutoSchedules
    : [
      {
        cutoffDay: schedule.cutoffDay,
        defaultRate: schedule.defaultRate,
        rateType: schedule.rateType,
        calcMethod: schedule.calcMethod,
        calcFormula: schedule.calcFormula,
        calcLabel: schedule.calcLabel,
        detailColumns: schedule.detailColumns
      }
    ];
  const byCutoffDay = new Map();
  sourceSchedules.forEach((item) => {
    const normalized = normalizeAutoScheduleEntry(item, schedule);
    byCutoffDay.set(normalized.cutoffDay, normalized);
  });
  if (!byCutoffDay.size) {
    const fallback = normalizeAutoScheduleEntry(
      { cutoffDay: defaultSchedule.cutoffDay },
      defaultSchedule
    );
    byCutoffDay.set(fallback.cutoffDay, fallback);
  }
  schedule.autoSchedules = Array.from(byCutoffDay.values()).sort(
    (a, b) => Number(a.cutoffDay) - Number(b.cutoffDay)
  );
  if (!getAutoScheduleByCutoff(schedule.cutoffDay)) {
    schedule.cutoffDay = schedule.autoSchedules[0].cutoffDay;
  }
};
const saveSchedule = () => {
  localStorage.setItem(scheduleKey, JSON.stringify(schedule));
};
const loadHistory = () => {
  history = [];
  let historyChanged = false;
  try {
    const saved = localStorage.getItem(historyKey);
    if (saved) {
      const parsed = JSON.parse(saved) || [];
      const loaded = Array.isArray(parsed) ? parsed : [];
      const filtered = loaded.filter(
        (bill) => normalizeSiteToken(bill?.source) !== "mock"
      );
      historyChanged = filtered.length !== loaded.length;
      history = filtered;
    }
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
  if (historyChanged) {
    saveHistory();
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
  const normalizedCutoffDay =
    Number(cutoffDay) || schedule.cutoffDay || defaultSchedule.cutoffDay;
  const today = new Date();
  const thisRunDay = clampDay(
    today.getFullYear(),
    today.getMonth(),
    normalizedCutoffDay
  );
  let candidate = new Date(
    today.getFullYear(),
    today.getMonth(),
    thisRunDay
  );
  const { start, end } = getAutoPeriodForRunDate(candidate, normalizedCutoffDay);
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const alreadyGenerated = history.some(
    (b) =>
      Boolean(b?.auto) &&
      Number(b?.cutoffDay) === normalizedCutoffDay &&
      b.periodStart === startStr &&
      b.periodEnd === endStr
  );
  if (today > candidate || alreadyGenerated) {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextRunDay = clampDay(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      normalizedCutoffDay
    );
    candidate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      nextRunDay
    );
  }
  return candidate;
};

const getAutoPreviewRange = (cutoffDayValue) => {
  const cutoffDay = Number(cutoffDayValue) || schedule.cutoffDay || defaultSchedule.cutoffDay;
  const runDate = getNextRunDate(cutoffDay);
  const { start, end } = getAutoPeriodForRunDate(runDate, cutoffDay);
  return {
    cutoffDay,
    runDate,
    start,
    end,
    startStr: formatDate(start),
    endStr: formatDate(end)
  };
};
const closeAutoRoundModal = () => {
  autoRoundModal?.classList.add("hidden");
};
const openAutoRoundHistoryModal = (cutoffDay) => {
  if (!autoRoundModal || !autoRoundModalRows) return;
  const day = Number(cutoffDay) || defaultSchedule.cutoffDay;
  const records = history
    .filter(
      (bill) => Boolean(bill?.auto) && Number(bill?.cutoffDay) === Number(day)
    )
    .slice()
    .sort((a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0));
  if (autoRoundModalTitle) {
    autoRoundModalTitle.textContent = `ประวัติการออกบิลอัตโนมัติ • รอบวันที่ ${day} (${records.length} ใบ)`;
  }
  if (!records.length) {
    autoRoundModalRows.innerHTML =
      '<tr><td class="empty" colspan="6">ยังไม่มีประวัติการออกบิลรอบนี้</td></tr>';
  } else {
    autoRoundModalRows.innerHTML = records
      .map((bill) => {
        const createdAtValue = Number(bill?.createdAt);
        const createdAtDate = Number.isFinite(createdAtValue)
          ? new Date(createdAtValue)
          : null;
        const createdLabel =
          createdAtDate && !Number.isNaN(createdAtDate.getTime())
            ? formatDate(createdAtDate)
            : "-";
        return `
          <tr>
            <td>ใบที่ ${bill.billNo}</td>
            <td>${bill.periodStart} - ${bill.periodEnd}</td>
            <td>${formatNumber(bill.totalKwh, 1)}</td>
            <td>${formatCurrency(bill.amount)}</td>
            <td>${createdLabel}</td>
            <td>
              <button class="ghost small-btn" data-action="sample" data-id="${bill.id}" type="button">ดูตัวอย่าง</button>
            </td>
          </tr>
        `;
      })
      .join("");
    autoRoundModalRows
      .querySelectorAll("button[data-action='sample']")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          if (!id) return;
          const bill = history.find((item) => item.id === id);
          if (!bill) return;
          const issueDate = parseDateInput(bill.periodEnd || "");
          if (!issueDate) return;
          closeAutoRoundModal();
          hideReceiptHistory();
          openReceiptPreview({ bill, issueDate });
        });
      });
  }
  autoRoundModal.classList.remove("hidden");
};
const renderAutoQueue = () => {
  if (!billQueueRows) return;
  const autoSchedules = getAutoSchedules()
    .slice()
    .sort((a, b) => Number(a.cutoffDay) - Number(b.cutoffDay));
  if (!autoSchedules.length) {
    billQueueRows.innerHTML =
      '<tr><td class="empty" colspan="5">ยังไม่มีรอบอัตโนมัติ</td></tr>';
    if (billQueueTitle) {
      billQueueTitle.textContent = "รายการรอบบิลอัตโนมัติที่ตั้งค่าไว้";
    }
    return;
  }
  const rateTypeLabels = {
    flat: "Flat rate",
    tou: "TOU"
  };
  billQueueRows.innerHTML = autoSchedules
    .map((autoConfig) => {
      const cutoffDay = Number(autoConfig?.cutoffDay) || defaultSchedule.cutoffDay;
      const rateTypeLabel =
        rateTypeLabels[autoConfig.rateType] || autoConfig.rateType || "-";
      const updatedAtLabel =
        Number.isFinite(Number(autoConfig?.updatedAt)) && Number(autoConfig.updatedAt) > 0
          ? formatDateTime(autoConfig.updatedAt)
          : "-";
      const billCount = history.filter(
        (bill) =>
          Boolean(bill?.auto) && Number(bill?.cutoffDay) === Number(cutoffDay)
      ).length;
      return `
        <tr>
          <td>${cutoffDay}</td>
          <td>${escapeHtml(updatedAtLabel)}</td>
          <td>ตัดรอบวันที่ ${cutoffDay} • อัตรา ฿${formatNumber(
        autoConfig.defaultRate,
        2
      )}/kWh • ${escapeHtml(rateTypeLabel)}</td>
          <td><span class="queue-status ready">${billCount} ใบ</span></td>
          <td>
            <button class="small-btn" data-action="view-history" data-cutoff="${cutoffDay}" type="button">ดูประวัติรอบนี้</button>
          </td>
        </tr>
      `;
    })
    .join("");
  billQueueRows
    .querySelectorAll("button[data-action='view-history']")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const cutoffDay = Number(btn.getAttribute("data-cutoff"));
        if (!Number.isFinite(cutoffDay) || cutoffDay < 1) return;
        openAutoRoundHistoryModal(cutoffDay);
      });
    });
  if (billQueueTitle) {
    billQueueTitle.textContent = `รายการรอบบิลอัตโนมัติที่ตั้งค่าไว้ (${autoSchedules.length} รอบ)`;
  }
};
const updateBillHistoryTitle = () => {
  if (!billHistoryTitle) return;
  billHistoryTitle.textContent =
    billMode === "auto"
      ? "ประวัติการสร้างบิลอัตโนมัติ"
      : "ประวัติการสร้างบิลแบบกำหนดวัน";
};

const updateAutoPreviewText = () => {
  if (!billAutoPreview) return;
  const selectedCutoffDay =
    Number(billCutoff?.value) || schedule.cutoffDay || defaultSchedule.cutoffDay;
  const { runDate, startStr, endStr } = getAutoPreviewRange(selectedCutoffDay);
  const allDays = listAutoCutoffDays();
  const dayListText = allDays.length ? allDays.join(", ") : "-";
  const exists = Boolean(getAutoScheduleByCutoff(selectedCutoffDay));
  const modeText = exists ? "แก้ไขรอบเดิม" : "เพิ่มรอบใหม่";
  billAutoPreview.textContent = `${modeText} วันที่ ${selectedCutoffDay} • จะออกบิลวันที่ ${formatDate(
    runDate
  )} สำหรับช่วง ${startStr} - ${endStr} • รอบที่ตั้งไว้: ${dayListText}`;
};
const getAutoModalDraft = (cutoffDay) =>
  normalizeAutoScheduleEntry(
    {
      cutoffDay,
      defaultRate: billRateInput?.value || schedule.defaultRate,
      rateType: billType?.value || schedule.rateType,
      calcMethod: inferCalcMethodFromFormula(formulaTerms),
      calcFormula: getFormulaFromInputs(),
      calcLabel: getFormulaResultName(),
      detailColumns: getSelectedDetailColumns()
    },
    schedule
  );
const applyAutoScheduleToModal = (cutoffDay) => {
  const normalizedDay =
    Number(cutoffDay) || schedule.cutoffDay || defaultSchedule.cutoffDay;
  const matched = getAutoScheduleByCutoff(normalizedDay);
  const active = matched || getAutoModalDraft(normalizedDay);
  if (billCutoff) billCutoff.value = String(normalizedDay);
  if (billRateInput) billRateInput.value = active.defaultRate;
  if (billType && active.rateType) billType.value = active.rateType;
  renderColumnSelector(active.detailColumns);
  formulaTerms = getFormulaForContext(
    active.calcFormula,
    active.calcMethod,
    getSelectedMetersForFormula()
  );
  setCalcInputMode(inferCalcInputMode(formulaTerms, meterProfiles), {
    skipPreview: true
  });
  populateFormulaInputs(formulaTerms, active.calcLabel || defaultCalcLabel);
  updateAutoPreviewText();
  if (isModalOpen) updateFormulaResultPreview();
  return active;
};

const setBillMode = (mode) => {
  billMode = mode === "auto" ? "auto" : "manual";
  const isAuto = billMode === "auto";
  billFlowManualBtn?.classList.toggle("active", !isAuto);
  billFlowAutoBtn?.classList.toggle("active", isAuto);
  if (billNewBtn) {
    billNewBtn.textContent = isAuto ? "ตั้งค่าอัตโนมัติ" : "สร้างบิลใหม่";
  }
  if (billModalTitle) {
    billModalTitle.textContent = isAuto ? "ตั้งค่าออกบิลอัตโนมัติ" : "สร้างใบแจ้งค่าไฟ";
  }
  updateBillHistoryTitle();
  billDateRangeField?.classList.toggle("hidden", isAuto);
  billAutoPreviewField?.classList.toggle("hidden", !isAuto);
  billCutoffField?.classList.toggle("hidden", !isAuto);
  billQueuePanel?.classList.toggle("hidden", !isAuto);
  billHistoryPanel?.classList.toggle("hidden", isAuto);
  if (billConfirm) {
    billConfirm.textContent = isAuto ? "บันทึกอัตโนมัติ" : "สร้างบิล";
  }
  if (isAuto && isModalOpen) {
    const selectedCutoffDay =
      Number(billCutoff?.value) || schedule.cutoffDay || defaultSchedule.cutoffDay;
    applyAutoScheduleToModal(selectedCutoffDay);
  } else {
    updateAutoPreviewText();
    if (isModalOpen) updateFormulaResultPreview();
  }
  hideReceiptHistory();
  closeReceiptPreview();
  closeAutoRoundModal();
  renderAutoQueue();
  renderHistory();
  updateSummary();
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
  const fieldKey = formulaFieldLabelMap[term?.field]
    ? term.field
    : formulaFieldAliasMap[String(term?.field || "").trim().toLowerCase()] || defaultFormulaField;
  if (fieldKey === "energy_in") {
    return parseNumber(source?.energy_in ?? source?.solar_in ?? source?.mdb_in);
  }
  if (fieldKey === "energy_out") {
    return parseNumber(source?.energy_out ?? source?.self_use ?? source?.mdb_out);
  }
  return parseNumber(source?.[fieldKey]);
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
  const energyIn = parseNumber(row.energy_in ?? row.solar_in ?? row.mdb_in);
  const energyOut = parseNumber(row.energy_out ?? row.self_use ?? row.mdb_out);
  const mdbOut = parseNumber(row.mdb_out ?? 0);
  let value = energyOut;
  if (method === "energy_in" || method === "solar_in" || method === "mdb_in") {
    value = energyIn;
  }
  if (method === "energy_out" || method === "self_use" || method === "mdb_out") {
    value = energyOut;
  }
  if (method === "energy_net" || method === "mdb_net") {
    value = energyIn - energyOut;
  }
  if (method === "legacy_mdb_net") {
    value = energyIn - mdbOut;
  }
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
const countBillPeriodDays = (bill) => {
  if (Array.isArray(bill?.daily) && bill.daily.length) return bill.daily.length;
  const start = parseDateInput(bill?.periodStart || "");
  const end = parseDateInput(bill?.periodEnd || "");
  if (!start || !end || start > end) return 0;
  return listDatesInclusive(start, end).length;
};
const getManualIssueDate = (bill) => {
  const periodEnd = parseDateInput(bill?.periodEnd || "");
  if (periodEnd) return periodEnd;
  const createdAt = Number(bill?.createdAt);
  if (Number.isFinite(createdAt) && createdAt > 0) {
    const created = new Date(createdAt);
    if (!Number.isNaN(created.getTime())) return created;
  }
  return null;
};
const getHistoryByCurrentMode = () => {
  const isAutoMode = billMode === "auto";
  return history.filter((bill) => Boolean(bill?.auto) === isAutoMode);
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
  source = "api",
  createdAt = Date.now()
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
    id: `${createdAt}-${billSequence}`,
    billNo: billSequence,
    createdAt,
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
  const visibleHistory = getHistoryByCurrentMode();
  if (!visibleHistory.length) {
    const emptyLabel =
      billMode === "auto" ? "ยังไม่มีบิลอัตโนมัติ" : "ยังไม่มีบิลกำหนดวัน";
    billHistoryRows.innerHTML =
      `<tr><td class="empty" colspan="7">${emptyLabel}</td></tr>`;
    return;
  }
  billHistoryRows.innerHTML = visibleHistory
    .map((bill) => {
      const meterPool = Array.isArray(bill.meters) ? bill.meters : [];
      const displayFormula =
        Array.isArray(bill.calcFormula) && bill.calcFormula.length
          ? bill.calcFormula
          : buildLegacyFormula(bill.calcMethod, meterPool);
      const displayMeters = getMetersFromFormula(displayFormula, meterPool);
      const meterText = displayMeters.map((m) => m.name).join(", ");
      const badgeLabel = bill.auto ? "อัตโนมัติ" : "กำหนดวัน";
      const badgeClass = bill.auto ? "auto" : "manual";
      const manualIssueDate = getManualIssueDate(bill);
      const manualIssueDateStr = manualIssueDate
        ? formatDate(manualIssueDate)
        : bill.periodEnd || bill.periodStart || "";
      const actionButtons = bill.auto
        ? `<button class="ghost small-btn" data-action="receipt" data-id="${bill.id}" type="button">ประวัติใบเสร็จ</button>
           <button class="small-btn btn-danger" data-action="delete" data-id="${bill.id}" type="button">ลบ</button>`
        : `<button class="small-btn" data-action="download" data-id="${bill.id}" data-date="${manualIssueDateStr}" type="button">ดาวน์โหลด</button>
           <button class="ghost small-btn" data-action="sample" data-id="${bill.id}" data-date="${manualIssueDateStr}" type="button">ดูตัวอย่าง</button>
           <button class="small-btn btn-danger" data-action="delete" data-id="${bill.id}" type="button">ลบ</button>`;
      return `
        <tr data-id="${bill.id}">
          <td>ใบที่ ${bill.billNo}</td>
          <td>${meterText || "-"}</td>
          <td class="period-cell">
            <span class="badge ${badgeClass}">${badgeLabel}</span>
            <div class="period-range">${bill.periodStart} - ${bill.periodEnd}</div>
          </td>
          <td>${formatNumber(bill.rate, 2)}</td>
          <td>${formatNumber(bill.totalKwh, 1)}</td>
          <td>${formatCurrency(bill.amount)}</td>
          <td>
            <div class="history-actions">
              ${actionButtons}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  billHistoryRows.querySelectorAll("button[data-action='receipt']").forEach(
    (btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (id) showReceiptHistory(id);
      });
    }
  );
  billHistoryRows.querySelectorAll("button[data-action='sample']").forEach(
    (btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (!id) return;
        const bill = history.find((b) => b.id === id);
        if (!bill) return;
        const issueDate = parseDateInput(btn.getAttribute("data-date") || "");
        if (!issueDate) return;
        hideReceiptHistory();
        openReceiptPreview({ bill, issueDate });
      });
    }
  );
  billHistoryRows.querySelectorAll("button[data-action='download']").forEach(
    (btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (!id) return;
        const bill = history.find((b) => b.id === id);
        if (!bill) return;
        const issueDate = parseDateInput(btn.getAttribute("data-date") || "");
        if (!issueDate) return;
        hideReceiptHistory();
        openReceiptPreview({ bill, issueDate });
        openReceiptPrint();
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
  const cutoffDay =
    bill.cutoffDay || schedule.cutoffDay || defaultSchedule.cutoffDay;
  const isAutoBill = Boolean(bill.auto);
  const dates = (isAutoBill
    ? buildReceiptDates(bill.periodStart, cutoffDay)
    : (() => {
      const issueDate = getManualIssueDate(bill);
      return issueDate ? [issueDate] : [];
    })()
  ).sort(
    (a, b) => b - a
  );
  if (receiptTitle) {
    receiptTitle.textContent = isAutoBill
      ? `ประวัติใบเสร็จ • ใบที่ ${bill.billNo} • ออกทุกวันที่ ${cutoffDay}`
      : `ประวัติใบเสร็จ • ใบที่ ${bill.billNo} • ออกครั้งเดียว (กำหนดวัน)`;
  }
  if (!dates.length) {
    receiptRows.innerHTML =
      '<tr><td class="empty" colspan="5">ยังไม่มีประวัติใบเสร็จ</td></tr>';
  } else {
    receiptRows.innerHTML = dates
      .map((date, idx) => {
        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const dayCount = isAutoBill
          ? new Date(year, monthIndex + 1, 0).getDate()
          : Math.max(1, countBillPeriodDays(bill));
        const periodLabel = isAutoBill
          ? `งวด ${dates.length - idx} • ${formatMonth(date)}`
          : `${bill.periodStart} - ${bill.periodEnd}`;
        return `
        <tr>
          <td>${periodLabel}</td>
          <td>${dayCount} วัน</td>
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
  const visibleHistory = getHistoryByCurrentMode();
  if (billTotalCount) billTotalCount.textContent = `${visibleHistory.length} ใบ`;
  if (billAutoDay) {
    const allDays = listAutoCutoffDays();
    billAutoDay.textContent = allDays.length ? allDays.join(", ") : `${schedule.cutoffDay}`;
  }
  if (!visibleHistory.length) {
    if (billLastPeriod) billLastPeriod.textContent = "-";
    if (billLastAmount) billLastAmount.textContent = "-";
    return;
  }
  const latest = visibleHistory[0];
  if (billLastPeriod)
    billLastPeriod.textContent = `${latest.periodStart} - ${latest.periodEnd}`;
  if (billLastAmount) billLastAmount.textContent = formatCurrency(latest.amount);
};

const deleteBill = (id) => {
  const bill = history.find((b) => b.id === id);
  if (!bill) return;
  const ok = confirm(`ต้องการลบบิลใบที่ ${bill.billNo} ใช่หรือไม่?`);
  if (!ok) return;
  history = history.filter((b) => b.id !== id);
  saveHistory();
  renderAutoQueue();
  renderHistory();
  updateSummary();
};

const runAutoIfDue = async () => {
  const today = new Date();
  const autoSchedules = getAutoSchedules();
  if (!autoSchedules.length) return;
  for (const autoConfig of autoSchedules) {
    const cutoffDay = Number(autoConfig?.cutoffDay) || defaultSchedule.cutoffDay;
    const effectiveDay = clampDay(
      today.getFullYear(),
      today.getMonth(),
      cutoffDay
    );
    if (today.getDate() !== effectiveDay) continue;
    const { start, end } = getAutoPeriodForRunDate(today, cutoffDay);
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    const alreadyGenerated = history.some(
      (b) =>
        Boolean(b?.auto) &&
        Number(b?.cutoffDay) === cutoffDay &&
        b.periodStart === startStr &&
        b.periodEnd === endStr
    );
    if (alreadyGenerated) continue;
    const { rows, source } = await getDailyEnergyForRange(startStr, endStr);
    if (!rows.length) continue;
    const calcFormula = getFormulaForContext(
      autoConfig.calcFormula,
      autoConfig.calcMethod,
      meterProfiles
    );
    const formulaMeters = getMetersFromFormula(calcFormula, meterProfiles);
    createBill({
      periodStart: startStr,
      periodEnd: endStr,
      meters: formulaMeters,
      rate: autoConfig.defaultRate,
      rateType: autoConfig.rateType,
      calcMethod: autoConfig.calcMethod || defaultSchedule.calcMethod,
      calcFormula,
      calcLabel: autoConfig.calcLabel || defaultCalcLabel,
      cutoffDay,
      detailColumns: autoConfig.detailColumns || defaultSchedule.detailColumns,
      auto: true,
      source,
      dailyRows: rows
    });
  }
};

const openModal = (mode = billMode) => {
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
  setCalcInputMode(inferCalcInputMode(formulaTerms, meterProfiles), {
    skipPreview: true
  });
  populateFormulaInputs(formulaTerms, schedule.calcLabel || defaultCalcLabel);
  setBillMode(mode);
};

const handleConfirm = async () => {
  const selectedMeterPool = getSelectedMetersForFormula();
  if (!selectedMeterPool.length) {
    alert("ยังไม่มีมิเตอร์ให้ใช้คำนวณ");
    return;
  }
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
  const selectedMeters = getMetersFromFormula(calcFormula, selectedMeterPool);
  const selectedDetailColumns = getSelectedDetailColumns();
  const detailColumns = selectedDetailColumns.length
    ? selectedDetailColumns
    : schedule.detailColumns?.length
      ? [...schedule.detailColumns]
      : [...defaultSchedule.detailColumns];

  if (billMode === "auto") {
    const cutoffDay = billCutoff?.value ? Number(billCutoff.value) : 5;
    const hadSchedule = Boolean(getAutoScheduleByCutoff(cutoffDay));
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
    const savedAutoSchedule = upsertAutoSchedule({
      cutoffDay,
      defaultRate: rateVal,
      rateType: rateTypeVal,
      calcMethod,
      calcFormula,
      calcLabel,
      detailColumns,
      updatedAt: Date.now()
    });
    saveSchedule();
    updateScheduleInfo(cutoffDay);
    renderAutoQueue();
    updateSummary();
    const { runDate, startStr, endStr } = getAutoPreviewRange(cutoffDay);
    const allDays = listAutoCutoffDays().join(", ");
    closeModal();
    alert(
      `${hadSchedule ? "อัปเดตรอบอัตโนมัติแล้ว" : "เพิ่มรอบอัตโนมัติแล้ว"}\nตัดรอบวันที่ ${
        savedAutoSchedule.cutoffDay
      }\nระบบจะรันวันที่ ${formatDate(runDate)}\nช่วงบิล ${startStr} - ${endStr}\nรอบที่ตั้งไว้ทั้งหมด: ${allDays}`
    );
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
    cutoffDay: schedule.cutoffDay || defaultSchedule.cutoffDay,
    detailColumns,
    auto: false,
    source,
    dailyRows: rows
  });

  schedule = {
    ...schedule,
    defaultRate: rateVal,
    rateType: rateTypeVal,
    calcMethod,
    calcFormula,
    calcLabel,
    detailColumns
  };
  saveSchedule();
  updateScheduleInfo(schedule.cutoffDay);
  renderHistory();
  updateSummary();
  closeModal();
  alert(
    `สร้างบิลใบที่ ${bill.billNo}\nช่วง ${bill.periodStart} - ${bill.periodEnd}\nพลังงานรวม ${formatNumber(
      bill.totalKwh,
      1
    )} kWh x ฿${formatNumber(bill.rate, 2)} = ${formatCurrency(bill.amount)}`
  );
};

billModalClose?.addEventListener("click", closeModal);
billCancel?.addEventListener("click", closeModal);
billModal?.addEventListener("click", (e) => {
  if (e.target === billModal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (isMeterCreateModalOpen) {
    closeMeterCreateModal();
    return;
  }
  if (isReceiptPreviewOpen) {
    closeReceiptPreview();
    return;
  }
  if (autoRoundModal && !autoRoundModal.classList.contains("hidden")) {
    closeAutoRoundModal();
    return;
  }
  if (isModalOpen) closeModal();
});

billCutoff?.addEventListener("change", () => {
  const cutoffDay = billCutoff?.value ? Number(billCutoff.value) : 5;
  updateScheduleInfo(cutoffDay);
  if (isModalOpen && billMode === "auto") {
    applyAutoScheduleToModal(cutoffDay);
    return;
  }
  updateAutoPreviewText();
  if (isModalOpen) updateFormulaResultPreview();
});
autoRoundModalClose?.addEventListener("click", closeAutoRoundModal);
autoRoundModalCloseFooter?.addEventListener("click", closeAutoRoundModal);
autoRoundModal?.addEventListener("click", (e) => {
  if (e.target === autoRoundModal) closeAutoRoundModal();
});
billFlowManualBtn?.addEventListener("click", () => {
  setBillMode("manual");
});
billFlowAutoBtn?.addEventListener("click", () => {
  setBillMode("auto");
});
calcModeSingleBtn?.addEventListener("click", () => {
  setCalcInputMode("single");
});
calcModeFormulaBtn?.addEventListener("click", () => {
  setCalcInputMode("formula");
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
    if (el === formulaMeterLeft || el === formulaMeterRight) {
      syncFormulaValueOptionsForMeterSelects({ preserveExisting: true });
    }
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

historyKey = buildStorageKey("billingHistoryV2");
scheduleKey = buildStorageKey("billingScheduleV1");
sequenceKey = buildStorageKey("billingSequenceV1");
loadSchedule();
loadHistory();

const initBilling = async () => {
  updateScheduleInfo(schedule.cutoffDay);
  await runAutoIfDue();
  renderAutoQueue();
  renderHistory();
  updateSummary();
};

billNewBtn?.addEventListener("click", () => openModal(billMode));
billConfirm?.addEventListener("click", () => {
  handleConfirm();
});
billScheduleRemove?.addEventListener("click", () => {
  const ok = confirm("รีเซ็ตการตั้งค่าบิลอัตโนมัติกลับเป็นวันที่ 5 ใช่หรือไม่?");
  if (!ok) return;
  const defaultFields = buildDefaultScheduleFields();
  schedule = {
    cutoffDay: defaultSchedule.cutoffDay,
    ...defaultFields,
    autoSchedules: [
      normalizeAutoScheduleEntry(
        {
          cutoffDay: defaultSchedule.cutoffDay,
          ...defaultFields,
          updatedAt: Date.now()
        },
        defaultSchedule
      )
    ]
  };
  saveSchedule();
  updateScheduleInfo(schedule.cutoffDay);
  updateAutoPreviewText();
  renderAutoQueue();
  updateSummary();
});

billModal?.classList.add("hidden");
populateCutoffOptions();
setDefaultRange(schedule.cutoffDay);
setBillMode("manual");
