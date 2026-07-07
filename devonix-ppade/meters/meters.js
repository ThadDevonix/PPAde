function tMeters(key, fallback, params) {
  if (typeof window.t === "function") {
    const v = window.t(key, params);
    if (v !== key) return v;
  }
  return params
    ? String(fallback || "").replace(/\{(\w+)\}/g, (_m, k) => params[k] ?? "")
    : fallback || "";
}

if (!plant || typeof plant !== "object") {
  plant = {
    name: tMeters("meters.page.no_plant", "ไม่พบข้อมูล Plant"),
    devices: []
  };
}

if (nameEl) {
  nameEl.textContent = tMeters("meters.page.checking_access", "กำลังตรวจสอบสิทธิ์...");
}

const normalizeLocalMeters = (meters) =>
  normalizeMeterRows(
    (Array.isArray(meters) ? meters : []).map((meter) => ({
      ...meter,
      site_id: meter?.siteId ?? meter?.site_id ?? plant?.apiId,
      device_name: meter?.deviceName ?? meter?.device_name ?? meter?.name,
      modbus_address_in: meter?.sn ?? meter?.serial ?? meter?.modbus_address_in
    }))
  );
const syncPlantToHomeStorage = () => {
  try {
    const saved = localStorage.getItem(homePlantsStorageKey);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.length) return;
    const plantId = String(plant?.id || "");
    if (!plantId) return;

    let changed = false;
    const next = parsed.map((item) => {
      if (!item || typeof item !== "object") return item;
      if (String(item.id || "") !== plantId) return item;
      changed = true;
      return {
        ...item,
        name: plant?.name || item.name,
        location: plant?.location || item.location,
        devices: plantMeters,
        deviceSn: plantMeters[0]?.sn || item.deviceSn || ""
      };
    });
    if (changed) {
      localStorage.setItem(homePlantsStorageKey, JSON.stringify(next));
    }
  } catch {
    // ignore storage parse errors
  }
};

let plantMeters = normalizeLocalMeters(plant.devices);
let isSavingMeterCreate = false;
const meterLiveEnergyApiCandidates = [
  "/api/energy",
  "http://localhost:3000/api/energy",
  "http://127.0.0.1:3000/api/energy",
  "https://meter.devonix.co.th/api/energy"
];
const meterLivePollIntervalMs = 20 * 1000;
const meterLiveDeviceFallbackCap = 8;
let meterLivePollTimer = null;
let meterLiveInFlight = false;
let plantMeterLiveReadings = new Map();

const getMeterLiveKey = (meter) => {
  const meterId = getMeterPersistId(meter);
  if (Number.isFinite(meterId) && meterId > 0) return `id:${meterId}`;
  const nameKey = normalizeSiteToken(readText(meter?.name, meter?.device_name, meter?.deviceName));
  const snKey = normalizeSiteToken(
    readText(
      meter?.sn,
      meter?.serial,
      meter?.device_sn,
      meter?.modbus_address_in,
      meter?.modbusAddressIn
    )
  );
  if (nameKey || snKey) return `${nameKey}|${snKey}`;
  return "unknown";
};
const readMeterLiveLooseValue = (row, keys) =>
  typeof readLooseValue === "function" ? readLooseValue(row, keys) : undefined;
const readMeterLiveNumber = (row, keys) => {
  const value = readMeterLiveLooseValue(row, keys);
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
};
const readMeterLiveText = (row, keys) => readText(readMeterLiveLooseValue(row, keys));
const readLiveRowTimestamp = (row) =>
  readMeterLiveLooseValue(row, [
    "reading_time",
    "readingTime",
    "datetime",
    "timestamp",
    "ts",
    "time",
    "created_at",
    "createdAt"
  ]);
const readLiveRowDeviceId = (row) =>
  parseLoosePositiveInt(
    readMeterLiveLooseValue(row, [
      "device_id",
      "deviceId",
      "meter_id",
      "meterId",
      "id"
    ]) ??
      row?.device?.id ??
      row?.device?.device_id ??
      row?.meter?.id ??
      row?.meter?.meter_id ??
      row?.__queryDeviceId
  );
const readLiveRowNameKey = (row) =>
  normalizeSiteToken(
    readMeterLiveText(row, ["device_name", "deviceName", "meter_name", "meterName", "name"])
  );
const readLiveRowSnKey = (row) =>
  normalizeSiteToken(
    readMeterLiveText(
      row,
      ["device_sn", "deviceSn", "sn", "serial", "modbus_address_in", "modbusAddressIn"]
    )
  );
const readLiveReadingFromRow = (row) => {
  const energyIn = readMeterLiveNumber(row, [
    "energy_in",
    "energyIn",
    "value_in",
    "valueIn",
    "solar_in",
    "solarIn",
    "pv",
    "power_in",
    "powerIn"
  ]);
  const energyOut = readMeterLiveNumber(row, [
    "energy_out",
    "energyOut",
    "value_out",
    "valueOut",
    "self_use",
    "selfUse",
    "mdb_in",
    "mdbIn",
    "power_out",
    "powerOut"
  ]);
  const total = readMeterLiveNumber(row, [
    "energy_total",
    "energyTotal",
    "total_energy",
    "totalEnergy",
    "energy",
    "kwh",
    "kw",
    "value",
    "power"
  ]);
  const unit =
    readMeterLiveText(row, ["unit", "energy_unit", "energyUnit", "power_unit", "powerUnit"]) ||
    "kWh";
  const timestampRaw = readLiveRowTimestamp(row);
  const parsedTimestamp = Date.parse(String(timestampRaw || ""));
  return {
    energyIn,
    energyOut,
    total,
    unit,
    timestamp: Number.isFinite(parsedTimestamp) ? parsedTimestamp : null
  };
};
const getLiveReadingScore = (reading) => {
  if (!reading || typeof reading !== "object") return 0;
  let score = 0;
  if (Number.isFinite(reading.energyIn)) score += 2;
  if (Number.isFinite(reading.energyOut)) score += 2;
  if (Number.isFinite(reading.total)) score += 1;
  if (Number.isFinite(reading.timestamp)) score += 1;
  return score;
};
const shouldPreferLiveReading = (candidate, current) => {
  if (!current) return true;
  const candidateTs = Number(candidate?.timestamp);
  const currentTs = Number(current?.timestamp);
  const candidateHasTs = Number.isFinite(candidateTs);
  const currentHasTs = Number.isFinite(currentTs);
  if (candidateHasTs && currentHasTs && candidateTs !== currentTs) {
    return candidateTs > currentTs;
  }
  if (candidateHasTs && !currentHasTs) return true;
  if (!candidateHasTs && currentHasTs) return false;
  return getLiveReadingScore(candidate) >= getLiveReadingScore(current);
};
const setPreferredLiveReading = (map, key, reading) => {
  if (!map || typeof map.set !== "function" || !key) return;
  const current = map.get(key);
  if (shouldPreferLiveReading(reading, current)) {
    map.set(key, reading);
  }
};
const extractLiveRowsFromPayload = (payload) => {
  if (!payload || typeof payload !== "object") return [];
  const directRows =
    typeof extractApiDeviceRows === "function" ? extractApiDeviceRows(payload) : [];
  if (Array.isArray(directRows) && directRows.length) return directRows;

  const rows = [];
  const queue = [payload];
  while (queue.length) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    if (Array.isArray(node)) {
      queue.push(...node);
      continue;
    }
    const reading = readLiveReadingFromRow(node);
    if (
      Number.isFinite(reading.energyIn) ||
      Number.isFinite(reading.energyOut) ||
      Number.isFinite(reading.total)
    ) {
      rows.push(node);
    }
    Object.values(node).forEach((child) => {
      if (child && typeof child === "object") queue.push(child);
    });
  }
  return rows;
};
const buildMeterLiveMap = (meters, rows) => {
  const byId = new Map();
  const byName = new Map();
  const bySn = new Map();
  const anonymousReadings = [];
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return;
    const reading = readLiveReadingFromRow(row);
    if (
      !Number.isFinite(reading.energyIn) &&
      !Number.isFinite(reading.energyOut) &&
      !Number.isFinite(reading.total)
    ) {
      return;
    }
    const rowDeviceId = readLiveRowDeviceId(row);
    const rowNameKey = readLiveRowNameKey(row);
    const rowSnKey = readLiveRowSnKey(row);
    if (Number.isFinite(rowDeviceId) && rowDeviceId > 0) {
      setPreferredLiveReading(byId, rowDeviceId, reading);
    }
    if (rowNameKey) setPreferredLiveReading(byName, rowNameKey, reading);
    if (rowSnKey) setPreferredLiveReading(bySn, rowSnKey, reading);
    if (!(rowDeviceId || rowNameKey || rowSnKey)) {
      anonymousReadings.push(reading);
    }
  });
  const anonymousFallback =
    anonymousReadings.length === 1 ? anonymousReadings[0] : null;
  const nextMap = new Map();
  (Array.isArray(meters) ? meters : []).forEach((meter) => {
    const meterKey = getMeterLiveKey(meter);
    if (!meterKey) return;
    const meterId = getMeterPersistId(meter);
    const hasMeterId = Number.isFinite(meterId) && meterId > 0;
    const meterNameKey = normalizeSiteToken(
      readText(meter?.name, meter?.device_name, meter?.deviceName)
    );
    const meterSnKey = normalizeSiteToken(
      readText(
        meter?.sn,
        meter?.serial,
        meter?.device_sn,
        meter?.modbus_address_in,
        meter?.modbusAddressIn
      )
    );
    // Enforce device_id match when we have an ID to avoid cross-mapping readings.
    const matched = hasMeterId
      ? byId.get(meterId) || null
      : (meterNameKey ? byName.get(meterNameKey) : null) ||
        (meterSnKey ? bySn.get(meterSnKey) : null) ||
        anonymousFallback;
    if (matched) nextMap.set(meterKey, matched);
  });
  return nextMap;
};
const listMissingMeterIdsForLive = (meters, liveMap) => {
  const ids = [];
  const seen = new Set();
  (Array.isArray(meters) ? meters : []).forEach((meter) => {
    const meterId = getMeterPersistId(meter);
    if (!Number.isFinite(meterId) || meterId <= 0) return;
    const meterKey = getMeterLiveKey(meter);
    if (!meterKey || (liveMap instanceof Map && liveMap.has(meterKey))) return;
    if (seen.has(meterId)) return;
    seen.add(meterId);
    ids.push(meterId);
  });
  return ids;
};
const requestMeterLiveRows = async ({ deviceId = null } = {}) => {
  const siteId = getPlantSiteIdForWrite();
  if (!Number.isFinite(siteId) || siteId <= 0) return [];
  const params = new URLSearchParams();
  params.set("site_id", String(siteId));
  params.set("period", "live");
  const scopedDeviceId = parseLoosePositiveInt(deviceId);
  if (Number.isFinite(scopedDeviceId) && scopedDeviceId > 0) {
    params.set("device_id", String(scopedDeviceId));
  }
  const search = `?${params.toString()}`;
  let firstError = null;
  for (const base of meterLiveEnergyApiCandidates) {
    const url = `${base}${search}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "same-origin"
      });
      if (!response.ok) {
        if (!firstError) firstError = new Error(`GET ${url} failed (${response.status})`);
        continue;
      }
      const payload = await response.json().catch(() => ({}));
      const rows = extractLiveRowsFromPayload(payload);
      if (Number.isFinite(scopedDeviceId) && scopedDeviceId > 0) {
        return rows.map((row) =>
          row && typeof row === "object" && !Array.isArray(row)
            ? { ...row, __queryDeviceId: scopedDeviceId }
            : row
        );
      }
      return rows;
    } catch (error) {
      if (!firstError) firstError = error;
    }
  }
  throw firstError || new Error("GET /api/energy failed");
};
const refreshMeterLiveReadings = async () => {
  if (meterLiveInFlight) return;
  if (!plantMeters.length) return;
  meterLiveInFlight = true;
  try {
    const rows = await requestMeterLiveRows();
    let nextLiveMap = buildMeterLiveMap(plantMeters, rows);
    const missingIds = listMissingMeterIdsForLive(plantMeters, nextLiveMap).slice(
      0,
      meterLiveDeviceFallbackCap
    );
    if (missingIds.length) {
      const scopedRowsList = await Promise.all(
        missingIds.map((deviceId) =>
          requestMeterLiveRows({ deviceId }).catch(() => [])
        )
      );
      const mergedRows = rows.concat(...scopedRowsList);
      nextLiveMap = buildMeterLiveMap(plantMeters, mergedRows);
    }
    plantMeterLiveReadings = nextLiveMap;
    renderPlantMeters();
    renderPlantDashboard();
  } catch (error) {
    console.warn("Failed to load live meter values", error);
  } finally {
    meterLiveInFlight = false;
  }
};
const startMeterLivePolling = () => {
  if (meterLivePollTimer) {
    window.clearInterval(meterLivePollTimer);
    meterLivePollTimer = null;
  }
  refreshMeterLiveReadings();
  meterLivePollTimer = window.setInterval(() => {
    if (document.hidden) return;
    refreshMeterLiveReadings();
  }, meterLivePollIntervalMs);
};
const stopMeterLivePolling = () => {
  if (!meterLivePollTimer) return;
  window.clearInterval(meterLivePollTimer);
  meterLivePollTimer = null;
};

const dashboardEls = {
  meterCount: document.getElementById("dashboard-meter-count"),
  meterStatus: document.getElementById("dashboard-meter-status"),
  totalBills: document.getElementById("dashboard-total-bills"),
  totalBillsMeta: document.getElementById("dashboard-total-bills-meta"),
  manualBills: document.getElementById("dashboard-manual-bills"),
  manualBillsMeta: document.getElementById("dashboard-manual-bills-meta"),
  autoBills: document.getElementById("dashboard-auto-bills"),
  autoBillsMeta: document.getElementById("dashboard-auto-bills-meta"),
  billChart: document.getElementById("dashboard-bill-chart"),
  billingSplit: document.getElementById("dashboard-billing-split"),
  refresh: document.getElementById("dashboard-refresh")
};
const billChartViewToggle = document.getElementById("bill-chart-view-toggle");
let billChartView = "list";
const billChartIcons = {
  list: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  graph: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};
const updateBillChartToggleUi = () => {
  if (!billChartViewToggle) return;
  const nextView = billChartView === "list" ? "graph" : "list";
  const title = tMeters(
    nextView === "graph" ? "dashboard.chart.view.graph" : "dashboard.chart.view.list",
    nextView === "graph" ? "แสดงเป็นกราฟ" : "แสดงเป็นรายการ"
  );
  billChartViewToggle.innerHTML = billChartIcons[nextView];
  billChartViewToggle.setAttribute("title", title);
  billChartViewToggle.setAttribute("aria-label", title);
  billChartViewToggle.dataset.view = billChartView;
};
billChartViewToggle?.addEventListener("click", () => {
  billChartView = billChartView === "list" ? "graph" : "list";
  updateBillChartToggleUi();
  renderDashboardBilling();
});
updateBillChartToggleUi();
const formatDashboardNumber = (value, digits = 2) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits
  }).format(number);
};
const formatDashboardMoney = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2
  }).format(number);
};
const formatDashboardDate = (value) => {
  const text = readText(value);
  if (!text) return "--";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(date);
};
const setDashboardText = (el, value) => {
  if (el) el.textContent = value;
};
const renderDashboardBillingSplit = ({ manualAmount = 0, autoAmount = 0, manualCount = 0, autoCount = 0 }) => {
  if (!dashboardEls.billingSplit) return;
  const totalAmount = manualAmount + autoAmount;
  const manualPercent = totalAmount > 0 ? Math.round((manualAmount / totalAmount) * 100) : 0;
  const autoPercent = totalAmount > 0 ? Math.round((autoAmount / totalAmount) * 100) : 0;
  dashboardEls.billingSplit.innerHTML = `
    <div class="dashboard-split-card">
      <div class="dashboard-split-total">
        <span>${escapeHtml(tMeters("dashboard.split.total", "ยอดรวมทั้งสิ้น"))}</span>
        <strong>${escapeHtml(formatDashboardMoney(totalAmount))}</strong>
      </div>
      <div class="dashboard-split-grid">
        <div class="dashboard-split-side tone-manual">
          <span>${escapeHtml(tMeters("dashboard.split.manual", "Manual"))}</span>
          <strong>${escapeHtml(formatDashboardMoney(manualAmount))}</strong>
          <small>${escapeHtml(tMeters("dashboard.split.count", "{count} bills", { count: manualCount }))}</small>
          <div class="dashboard-split-bar"><span style="width: ${manualPercent}%"></span></div>
        </div>
        <div class="dashboard-split-side tone-auto">
          <span>${escapeHtml(tMeters("dashboard.split.auto", "Auto"))}</span>
          <strong>${escapeHtml(formatDashboardMoney(autoAmount))}</strong>
          <small>${escapeHtml(tMeters("dashboard.split.count", "{count} bills", { count: autoCount }))}</small>
          <div class="dashboard-split-bar"><span style="width: ${autoPercent}%"></span></div>
        </div>
      </div>
    </div>`;
};
const buildDashboardBillingStateQuery = () => {
  const params = new URLSearchParams();
  const siteId = getPlantSiteIdForWrite();
  if (Number.isFinite(siteId) && siteId > 0) params.set("site_id", String(siteId));
  const siteCode = readText(plant?.siteCode, plant?.site_code);
  const siteName = readText(plant?.name, plant?.siteName, plant?.site_name);
  if (siteCode) params.set("site_code", siteCode);
  if (siteName) params.set("site_name", siteName);
  return params.toString();
};
const fetchDashboardBillingState = async () => {
  const query = buildDashboardBillingStateQuery();
  if (!query) return null;
  const response = await fetch(`/api/billing-state?${query}`, {
    method: "GET",
    credentials: "same-origin"
  }).catch(() => null);
  if (!response || !response.ok) return null;
  const payload = await response.json().catch(() => ({}));
  return payload && typeof payload === "object" ? payload.data || payload : null;
};
const renderDashboardMeters = () => {
  const totalMeters = plantMeters.length;
  const onlineMeters = plantMeters.filter((meter) => meter?.status !== "offline").length;
  setDashboardText(dashboardEls.meterCount, formatDashboardNumber(totalMeters, 0));
  setDashboardText(
    dashboardEls.meterStatus,
    tMeters("dashboard.meta.meter_status", "{online}/{total} online", {
      online: onlineMeters,
      total: totalMeters
    })
  );
};
const formatMeterKwhValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? `${formatDashboardNumber(number)} kWh` : "--";
};
const renderMeterKwhFlow = (reading) => `
  <div class="meter-kwh-flow">
    <span class="tone-import"><em>${escapeHtml(tMeters("meters.kwh.import", "Import"))}</em><b>${escapeHtml(formatMeterKwhValue(reading?.energyIn))}</b></span>
    <span class="tone-export"><em>${escapeHtml(tMeters("meters.kwh.export", "Export"))}</em><b>${escapeHtml(formatMeterKwhValue(reading?.energyOut))}</b></span>
  </div>`;
const renderDashboardBilling = async () => {
  const localSnapshot = typeof window.getBillingHistorySnapshot === "function"
    ? window.getBillingHistorySnapshot()
    : null;
  let rawBills;
  if (Array.isArray(localSnapshot)) {
    rawBills = localSnapshot;
  } else {
    const state = await fetchDashboardBillingState().catch(() => null);
    rawBills = Array.isArray(state?.history) ? state.history : [];
  }
  const bills = rawBills.filter((bill) => !bill?.excluded);
  const sortedBills = bills
    .slice()
    .sort((a, b) => String(b?.createdAt || b?.periodEnd || "").localeCompare(String(a?.createdAt || a?.periodEnd || "")));
  const totalAmount = bills.reduce((sum, bill) => sum + (Number(bill?.amount) || 0), 0);
  const totalKwh = bills.reduce((sum, bill) => sum + (Number(bill?.totalKwh) || 0), 0);
  const autoBills = bills.filter((bill) => Boolean(bill?.auto));
  const manualBills = bills.filter((bill) => !bill?.auto);
  const manualAmount = manualBills.reduce((sum, bill) => sum + (Number(bill?.amount) || 0), 0);
  const autoAmount = autoBills.reduce((sum, bill) => sum + (Number(bill?.amount) || 0), 0);
  renderDashboardBillingSplit({
    manualAmount,
    autoAmount,
    manualCount: manualBills.length,
    autoCount: autoBills.length
  });
  setDashboardText(dashboardEls.totalBills, formatDashboardNumber(bills.length, 0));
  setDashboardText(
    dashboardEls.totalBillsMeta,
    bills.length
      ? tMeters("dashboard.meta.total_bills", "{amount} • {kwh} kWh", {
          amount: formatDashboardMoney(totalAmount),
          kwh: formatDashboardNumber(totalKwh)
        })
      : tMeters("dashboard.meta.no_bills", "ยังไม่มีบิล")
  );
  setDashboardText(dashboardEls.manualBills, formatDashboardNumber(manualBills.length, 0));
  setDashboardText(
    dashboardEls.manualBillsMeta,
    manualBills.length
      ? tMeters("dashboard.meta.manual_bills", "{amount}", {
          amount: formatDashboardMoney(manualAmount)
        })
      : tMeters("dashboard.meta.no_bills", "ยังไม่มีบิล")
  );
  setDashboardText(dashboardEls.autoBills, formatDashboardNumber(autoBills.length, 0));
  setDashboardText(
    dashboardEls.autoBillsMeta,
    autoBills.length
      ? tMeters("dashboard.meta.auto_bills", "{amount}", {
          amount: formatDashboardMoney(autoAmount)
        })
      : tMeters("dashboard.meta.no_bills", "ยังไม่มีบิล")
  );
  if (dashboardEls.billChart) {
    const chartBills = sortedBills.slice(0, 5).reverse();
    const maxAmount = Math.max(
      ...chartBills.map((bill) => Number(bill?.amount)).filter((amount) => Number.isFinite(amount)),
      0
    );
    dashboardEls.billChart.classList.toggle("is-graph", billChartView === "graph");
    if (!chartBills.length) {
      dashboardEls.billChart.innerHTML = `<p class="empty">${tMeters("dashboard.meta.no_bills", "ยังไม่มีบิล")}</p>`;
    } else if (billChartView === "graph") {
      const width = 500;
      const height = 220;
      const padTop = 10;
      const padBottom = 32;
      const padLeft = 30;
      const padRight = 8;
      const formatCompactDate = (value) => {
        const text = readText(value);
        if (!text) return { line1: "--", line2: "" };
        const d = new Date(text);
        if (Number.isNaN(d.getTime())) return { line1: text, line2: "" };
        const line1 = new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" }).format(d);
        const line2 = new Intl.DateTimeFormat(undefined, { year: "numeric" }).format(d);
        return { line1, line2 };
      };
      const innerHeight = height - padTop - padBottom;
      const innerWidth = width - padLeft - padRight;
      const stepX = chartBills.length > 1 ? innerWidth / (chartBills.length - 1) : 0;
      const yBase = padTop + innerHeight;
      const niceNumber = (range, round) => {
        if (!Number.isFinite(range) || range <= 0) return 1;
        const exp = Math.floor(Math.log10(range));
        const fraction = range / Math.pow(10, exp);
        let nf;
        if (round) {
          if (fraction < 1.5) nf = 1;
          else if (fraction < 3) nf = 2;
          else if (fraction < 7) nf = 5;
          else nf = 10;
        } else {
          if (fraction <= 1) nf = 1;
          else if (fraction <= 2) nf = 2;
          else if (fraction <= 5) nf = 5;
          else nf = 10;
        }
        return nf * Math.pow(10, exp);
      };
      const formatAxisValue = (v) => {
        const abs = Math.abs(v);
        if (abs >= 1_000_000) {
          const val = v / 1_000_000;
          return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
        }
        if (abs >= 1000) {
          const val = v / 1000;
          return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
        }
        return String(Math.round(v));
      };
      const tickCount = 4;
      const rawMax = maxAmount > 0 ? maxAmount : 1;
      const tickSpacing = niceNumber(niceNumber(rawMax, false) / tickCount, true);
      const niceMax = Math.max(tickSpacing, Math.ceil(rawMax / tickSpacing) * tickSpacing);
      const yFor = (amount) => yBase - (amount / niceMax) * innerHeight;
      const points = chartBills.map((bill, i) => {
        const source = bill?.periodEnd || bill?.createdAt || bill?.periodStart;
        return {
          x: padLeft + (chartBills.length > 1 ? stepX * i : innerWidth / 2),
          y: yFor(Number(bill?.amount) || 0),
          amount: Number(bill?.amount) || 0,
          date: formatDashboardDate(source),
          dateShort: formatCompactDate(source)
        };
      });
      const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
      const areaPath = points.length
        ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${yBase.toFixed(1)} L${points[0].x.toFixed(1)},${yBase.toFixed(1)} Z`
        : "";
      const yTicks = [];
      for (let v = 0; v <= niceMax + 1e-6; v += tickSpacing) {
        yTicks.push({ value: v, y: yBase - (v / niceMax) * innerHeight });
      }
      const gridLines = yTicks.map((tick) => `<line x1="${padLeft}" x2="${(width - padRight).toFixed(1)}" y1="${tick.y.toFixed(1)}" y2="${tick.y.toFixed(1)}" class="dashboard-graph-grid"/>`).join("");
      const yAxisLabels = yTicks.map((tick) => `<text x="${(padLeft - 6).toFixed(1)}" y="${(tick.y + 3).toFixed(1)}" class="dashboard-graph-axis-label" text-anchor="end">${escapeHtml(formatAxisValue(tick.value))}</text>`).join("");
      const axes = `
        <line x1="${padLeft}" x2="${padLeft}" y1="${padTop.toFixed(1)}" y2="${yBase.toFixed(1)}" class="dashboard-graph-axis"/>
        <line x1="${padLeft}" x2="${(width - padRight).toFixed(1)}" y1="${yBase.toFixed(1)}" y2="${yBase.toFixed(1)}" class="dashboard-graph-axis"/>
      `;
      const dots = points.map((p, i) => {
        const tone = p.amount > 0 ? "paid" : "empty";
        return `<g class="dashboard-graph-point" data-index="${i}" data-date="${escapeHtml(p.date)}" data-amount="${escapeHtml(formatDashboardMoney(p.amount))}" data-x="${p.x.toFixed(1)}" data-y="${p.y.toFixed(1)}">
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="14" class="dashboard-graph-hit"/>
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" class="dashboard-graph-dot tone-${tone}"/>
        </g>`;
      }).join("");
      const dateLabels = points.map((p, i) => {
        const anchor = i === 0 ? "start" : i === points.length - 1 ? "end" : "middle";
        return `<text x="${p.x.toFixed(1)}" y="${(yBase + 12).toFixed(1)}" class="dashboard-graph-date-label" text-anchor="${anchor}">${escapeHtml(p.dateShort.line1)}<tspan x="${p.x.toFixed(1)}" dy="10" class="dashboard-graph-year-label">${escapeHtml(p.dateShort.line2)}</tspan></text>`;
      }).join("");
      dashboardEls.billChart.innerHTML = `
        <div class="dashboard-graph-wrap">
          <svg class="dashboard-graph-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Bill trend">
            <defs>
              <linearGradient id="dashboard-graph-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#0f8f47" stop-opacity="0.02"/>
              </linearGradient>
            </defs>
            ${gridLines}
            ${axes}
            ${yAxisLabels}
            ${areaPath ? `<path d="${areaPath}" fill="url(#dashboard-graph-area)"/>` : ""}
            <path d="${linePath}" class="dashboard-graph-line" fill="none"/>
            ${dots}
            ${dateLabels}
          </svg>
          <div class="dashboard-graph-tooltip" hidden><b class="tt-amount"></b><small class="tt-date"></small></div>
        </div>`;
      const wrap = dashboardEls.billChart.querySelector(".dashboard-graph-wrap");
      const tooltip = wrap?.querySelector(".dashboard-graph-tooltip");
      const svg = wrap?.querySelector(".dashboard-graph-svg");
      if (wrap && tooltip && svg) {
        const showTooltip = (group) => {
          const date = group.getAttribute("data-date") || "";
          const amount = group.getAttribute("data-amount") || "";
          const px = Number(group.getAttribute("data-x"));
          const py = Number(group.getAttribute("data-y"));
          const svgRect = svg.getBoundingClientRect();
          const wrapRect = wrap.getBoundingClientRect();
          const scaleX = svgRect.width / width;
          const scaleY = svgRect.height / height;
          const cssX = (svgRect.left - wrapRect.left) + px * scaleX;
          const cssY = (svgRect.top - wrapRect.top) + py * scaleY;
          tooltip.querySelector(".tt-amount").textContent = amount;
          tooltip.querySelector(".tt-date").textContent = date;
          tooltip.hidden = false;
          tooltip.style.left = `${cssX}px`;
          tooltip.style.top = `${cssY - 12}px`;
        };
        const hideTooltip = () => { tooltip.hidden = true; };
        wrap.querySelectorAll(".dashboard-graph-point").forEach((g) => {
          g.addEventListener("mouseenter", () => showTooltip(g));
          g.addEventListener("mouseleave", hideTooltip);
          g.addEventListener("focus", () => showTooltip(g));
          g.addEventListener("blur", hideTooltip);
        });
      }
    } else {
      dashboardEls.billChart.innerHTML = chartBills
        .map((bill) => {
          const amount = Number(bill?.amount) || 0;
          const percent = maxAmount > 0 ? Math.max(6, Math.round((amount / maxAmount) * 100)) : 6;
          const date = formatDashboardDate(bill?.periodEnd || bill?.createdAt || bill?.periodStart);
          const tone = amount > 0 ? "paid" : "empty";
          return `
            <div class="dashboard-chart-bar tone-${tone}" title="${escapeHtml(`${date} ${formatDashboardMoney(amount)}`)}">
              <div class="dashboard-chart-head">
                <small>${escapeHtml(date)}</small>
                <b>${escapeHtml(formatDashboardMoney(amount))}</b>
              </div>
              <div class="dashboard-chart-track">
                <span style="width: ${percent}%"></span>
              </div>
            </div>`;
        })
        .join("");
    }
  }
};
const renderPlantDashboard = () => {
  renderDashboardMeters();
  renderDashboardBilling();
};
const refreshPlantDashboard = async () => {
  renderPlantDashboard();
  if (!meterLiveInFlight) await refreshMeterLiveReadings();
};
dashboardEls.refresh?.addEventListener("click", refreshPlantDashboard);
window.refreshPlantDashboard = refreshPlantDashboard;
window.renderPlantDashboard = renderPlantDashboard;
document.addEventListener("billing:history-changed", () => {
  try { renderDashboardBilling(); } catch { /* ignore */ }
});

const splitAddressPair = (value) => {
  const text = readText(value);
  if (!text) return ["", ""];
  const numbers = text.match(/\d+/g) || [];
  return [numbers[0] || "", numbers[1] || ""];
};
const getMeterFormValueFromSource = (meter = {}) => {
  const [in1Combined, in2Combined] = splitAddressPair(
    readText(meter.modbus_address_in, meter.modbusAddressIn)
  );
  const [out1Combined, out2Combined] = splitAddressPair(
    readText(meter.modbus_address_out, meter.modbusAddressOut)
  );
  return {
    deviceType:
      (
        readText(meter.deviceType, meter.device_type, meter.type, meter.category) || "METER"
      ).toUpperCase(),
    name: readText(meter.name, meter.device_name, meter.deviceName, meter.meter_name),
    modbusIn1: readText(meter.modbusIn1, meter.modbus_in_1, in1Combined),
    modbusIn2: readText(meter.modbusIn2, meter.modbus_in_2, in2Combined),
    modbusOut1: readText(meter.modbusOut1, meter.modbus_out_1, out1Combined),
    modbusOut2: readText(meter.modbusOut2, meter.modbus_out_2, out2Combined)
  };
};
const closeMeterRowMenus = () => {
  deviceRowsEl?.querySelectorAll(".meter-row-menu").forEach((menu) => {
    menu.classList.add("hidden");
  });
};
const openMeterEditModalByIndex = (idx) => {
  if (Number.isNaN(idx)) return;
  const meter = plantMeters[idx];
  if (!meter) return;
  const formValue = getMeterFormValueFromSource(meter);
  editingPlantMeterIndex = idx;
  if (meterCreateTypeInput) {
    const nextType = formValue.deviceType || "METER";
    const hasTypeOption = Array.from(meterCreateTypeInput.options).some(
      (option) => option.value === nextType
    );
    meterCreateTypeInput.value = hasTypeOption ? nextType : "METER";
  }
  if (meterCreateNameInput) meterCreateNameInput.value = formValue.name || "";
  if (meterCreateIn1Input) meterCreateIn1Input.value = formValue.modbusIn1 || "";
  if (meterCreateIn2Input) meterCreateIn2Input.value = formValue.modbusIn2 || "";
  if (meterCreateOut1Input) meterCreateOut1Input.value = formValue.modbusOut1 || "";
  if (meterCreateOut2Input) meterCreateOut2Input.value = formValue.modbusOut2 || "";
  if (meterCreateModalTitle) meterCreateModalTitle.textContent = tMeters("meters.modal.edit_title", "แก้ไขมิเตอร์");
  if (meterCreateConfirm) meterCreateConfirm.textContent = tMeters("meters.modal.action.save", "บันทึก");
  meterCreateModal?.classList.remove("hidden");
  isMeterCreateModalOpen = true;
  meterCreateNameInput?.focus();
};
const handleDeleteMeterByIndex = async (idx) => {
  if (Number.isNaN(idx)) return;
  const meter = plantMeters[idx];
  if (!meter) return;
  if (!canDeleteMeters()) {
    alert("สิทธิ์ admin ไม่สามารถลบมิเตอร์ได้");
    return;
  }
  const label = meter.name || meter.sn || tMeters("meters.list.fallback_meter_name", "มิเตอร์นี้");
  const ok = confirm(tMeters("meters.list.confirm_delete", "ต้องการลบมิเตอร์: {label} ใช่หรือไม่?", { label }));
  if (!ok) return;
  try {
    const deleteMode = await deleteMeterInApi(meter, plant);
    if (deleteMode === "api") {
      await hydratePlantMetersFromApi();
      return;
    }
    const nextMeters = plantMeters.filter((_, meterIdx) => meterIdx !== idx);
    applyPlantMeters(nextMeters, { persistPlant: true, persistHomePlants: true });
  } catch (error) {
    alert(error?.message || tMeters("meters.list.delete_failed", "ลบมิเตอร์ไม่สำเร็จ"));
  }
};

const renderPlantMeters = () => {
  if (!deviceRowsEl) return;
  const allowDelete = canDeleteMeters();
  if (!plantMeters.length) {
    deviceRowsEl.innerHTML = `<tr><td class="empty" colspan="4">${tMeters("meters.list.empty", "ไม่พบมิเตอร์ของ Plant นี้")}</td></tr>`;
    return;
  }
  deviceRowsEl.innerHTML = plantMeters
    .map(
      (meter, idx) => {
        const reading = plantMeterLiveReadings.get(getMeterLiveKey(meter));
        return `
      <tr data-idx="${idx}">
        <td><span class="status-dot" title="${escapeHtml(meter.status)}"></span></td>
        <td>${escapeHtml(meter.name)}</td>
        <td>${renderMeterKwhFlow(reading)}</td>
        <td>
          <div class="history-actions meter-row-actions">
            <button
              class="small-btn meter-row-edit"
              type="button"
              data-action="toggle-meter-menu"
              data-idx="${idx}"
              aria-label="${tMeters("meters.list.manage_title", "จัดการมิเตอร์")}"
              title="${tMeters("meters.list.manage_title", "จัดการมิเตอร์")}"
            >
              ⋯
            </button>
            <div class="meter-row-menu hidden">
              <button
                class="meter-row-menu-item"
                type="button"
                data-action="edit-meter"
                data-idx="${idx}"
              >
                ${tMeters("meters.list.action.edit", "แก้ไข")}
              </button>
              ${
                allowDelete
                  ? `<button
                class="meter-row-menu-item danger"
                type="button"
                data-action="delete-meter"
                data-idx="${idx}"
              >
                ${tMeters("meters.list.action.delete", "ลบ")}
              </button>`
                  : ""
              }
            </div>
          </div>
        </td>
      </tr>`;
      }
    )
    .join("");

  deviceRowsEl.querySelectorAll("tr[data-idx]").forEach((tr) => {
    tr.addEventListener("click", () => {
      closeMeterRowMenus();
      const idx = Number(tr.dataset.idx);
      const meter = plantMeters[idx];
      if (!meter) return;
      localStorage.setItem("selectedPlant", JSON.stringify(plant));
      localStorage.setItem("selectedMeter", JSON.stringify(meter));
      window.location.href = "../meters/index.html";
    });
  });
  deviceRowsEl.querySelectorAll("button[data-action='toggle-meter-menu']").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const container = btn.closest(".meter-row-actions");
      const targetMenu = container?.querySelector(".meter-row-menu");
      if (!targetMenu) return;
      const shouldOpen = targetMenu.classList.contains("hidden");
      closeMeterRowMenus();
      targetMenu.classList.toggle("hidden", !shouldOpen);
    });
  });
  deviceRowsEl.querySelectorAll("button[data-action='edit-meter']").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      closeMeterRowMenus();
      const idx = Number(btn.dataset.idx);
      openMeterEditModalByIndex(idx);
    });
  });
  deviceRowsEl.querySelectorAll("button[data-action='delete-meter']").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopPropagation();
      closeMeterRowMenus();
      const idx = Number(btn.dataset.idx);
      await handleDeleteMeterByIndex(idx);
    });
  });
};

const applyPlantMeters = (meters, { persistPlant = true, persistHomePlants = true } = {}) => {
  plantMeters = normalizeLocalMeters(meters);
  plant = { ...plant, devices: plantMeters };
  meterProfiles = buildMeterProfiles(plantMeters);
  if (persistPlant) {
    localStorage.setItem("selectedPlant", JSON.stringify(plant));
  }
  if (persistHomePlants) {
    syncPlantToHomeStorage();
  }
  renderPlantMeters();
  renderPlantDashboard();
};

const resetMeterCreateForm = () => {
  editingPlantMeterIndex = null;
  if (meterCreateTypeInput) meterCreateTypeInput.value = "SOLAR_PANEL";
  if (meterCreateNameInput) meterCreateNameInput.value = "";
  if (meterCreateIn1Input) meterCreateIn1Input.value = "";
  if (meterCreateIn2Input) meterCreateIn2Input.value = "";
  if (meterCreateOut1Input) meterCreateOut1Input.value = "";
  if (meterCreateOut2Input) meterCreateOut2Input.value = "";
  if (meterCreateModalTitle) meterCreateModalTitle.textContent = tMeters("meters.modal.add_title", "เพิ่มมิเตอร์");
  if (meterCreateConfirm) meterCreateConfirm.textContent = tMeters("meters.modal.action.add", "เพิ่มมิเตอร์");
};
const closeMeterCreateModal = () => {
  meterCreateModal?.classList.add("hidden");
  isMeterCreateModalOpen = false;
  resetMeterCreateForm();
};
const openMeterCreateModal = () => {
  if (editingPlantMeterIndex === null) {
    resetMeterCreateForm();
  }
  meterCreateModal?.classList.remove("hidden");
  isMeterCreateModalOpen = true;
  meterCreateNameInput?.focus();
};
const parseLoosePositiveInt = (value) => {
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) return Math.trunc(asNumber);
  if (typeof value !== "string") return null;
  const match = value.match(/(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
};
const getPlantSiteIdForWrite = () => {
  const candidates = [plant?.apiId, plant?.siteId, plant?.site_id];
  for (const value of candidates) {
    const siteId = parseLoosePositiveInt(value);
    if (Number.isFinite(siteId) && siteId > 0) return siteId;
  }
  return null;
};
const getMeterPersistId = (meter) => {
  const candidates = [meter?.id, meter?.apiId, meter?.device_id, meter?.deviceId];
  for (const value of candidates) {
    const meterId = parseLoosePositiveInt(value);
    if (Number.isFinite(meterId) && meterId > 0) return meterId;
  }
  return null;
};
const readResponseErrorText = async (response) => {
  try {
    const text = await response.text();
    return text ? `: ${text}` : "";
  } catch {
    return "";
  }
};
const extractMeterFromWritePayload = (payload) => {
  if (!payload) return null;
  const rows = extractApiDeviceRows(payload);
  const normalizedRows = normalizeMeterRows(rows);
  if (normalizedRows.length) return normalizedRows[0];
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const single = normalizeMeterRows([payload]);
    if (single.length) return single[0];
    const dataNode = payload.data;
    if (dataNode && typeof dataNode === "object" && !Array.isArray(dataNode)) {
      const nestedSingle = normalizeMeterRows([dataNode]);
      if (nestedSingle.length) return nestedSingle[0];
    }
    const resultNode = payload.result;
    if (resultNode && typeof resultNode === "object" && !Array.isArray(resultNode)) {
      const nestedSingle = normalizeMeterRows([resultNode]);
      if (nestedSingle.length) return nestedSingle[0];
    }
  }
  return null;
};
const buildMeterWritePayload = (meter) => {
  const siteId = getPlantSiteIdForWrite();
  if (!Number.isFinite(siteId) || siteId <= 0) {
    throw new Error("ไม่พบ Site ID ของ Plant จึงบันทึกมิเตอร์เข้า API ไม่ได้");
  }
  const modbusIn1 = readText(meter?.modbusIn1, meter?.modbus_in_1);
  const modbusIn2 = readText(meter?.modbusIn2, meter?.modbus_in_2);
  const modbusOut1 = readText(meter?.modbusOut1, meter?.modbus_out_1);
  const modbusOut2 = readText(meter?.modbusOut2, meter?.modbus_out_2);
  const deviceName = readText(meter?.name, meter?.device_name, meter?.deviceName);
  const deviceType = (
    readText(meter?.deviceType, meter?.device_type, meter?.type) || "METER"
  ).toUpperCase();
  return {
    site_id: siteId,
    device_name: deviceName,
    device_type: deviceType,
    modbus_address_in: modbusIn1 || null,
    modbus_address_in_2: modbusIn2 || null,
    modbus_address_out: modbusOut1 || null,
    modbus_address_out_2: modbusOut2 || null,
    modbus_in_1: modbusIn1 || null,
    modbus_in_2: modbusIn2 || null,
    modbus_out_1: modbusOut1 || null,
    modbus_out_2: modbusOut2 || null,
    is_active: 1
  };
};
const createMeterInApi = async (meter) => {
  const payload = buildMeterWritePayload(meter);
  let response = null;
  try {
    response = await fetch("/api/devices", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    throw error || new Error("POST /api/devices failed");
  }
  if (!response.ok) {
    const detail = await readResponseErrorText(response);
    if (response.status === 403) {
      throw new Error(detail.replace(/^:\s*/, "") || "ไม่มีสิทธิ์เพิ่มมิเตอร์");
    }
    if (response.status === 401) {
      throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    }
    throw new Error(`POST /api/devices failed (${response.status})${detail}`);
  }
  const responsePayload = await response.json().catch(() => null);
  const created = extractMeterFromWritePayload(responsePayload);
  if (created) return created;
  const refreshed = await fetchPlantDevicesFromApi(plant).catch(() => []);
  const matchedByName = refreshed.find(
    (item) => normalizeSiteToken(item?.name) === normalizeSiteToken(payload.device_name)
  );
  if (matchedByName) return matchedByName;
  throw new Error("API รับคำขอแล้ว แต่ยังยืนยันมิเตอร์ที่เพิ่มไม่ได้ กรุณารีเฟรชแล้วตรวจสอบอีกครั้ง");
};
const updateMeterInApi = async (meter, currentMeter) => {
  const payload = buildMeterWritePayload(meter);
  const meterId = getMeterPersistId(currentMeter);
  if (!Number.isFinite(meterId) || meterId <= 0) {
    return createMeterInApi(meter);
  }
  const toComparable = (candidate) => ({
    name: normalizeSiteToken(readText(candidate?.name, candidate?.device_name, candidate?.deviceName)),
    type: normalizeSiteToken(readText(candidate?.deviceType, candidate?.device_type, candidate?.type)),
    in1: normalizeSiteToken(
      readText(
        candidate?.modbusIn1,
        candidate?.modbus_in_1,
        candidate?.modbus_address_in,
        candidate?.modbusAddressIn
      )
    ),
    in2: normalizeSiteToken(
      readText(
        candidate?.modbusIn2,
        candidate?.modbus_in_2,
        candidate?.modbus_address_in_2,
        candidate?.modbusAddressIn2
      )
    ),
    out1: normalizeSiteToken(
      readText(
        candidate?.modbusOut1,
        candidate?.modbus_out_1,
        candidate?.modbus_address_out,
        candidate?.modbusAddressOut
      )
    ),
    out2: normalizeSiteToken(
      readText(
        candidate?.modbusOut2,
        candidate?.modbus_out_2,
        candidate?.modbus_address_out_2,
        candidate?.modbusAddressOut2
      )
    )
  });
  const expectedComparable = {
    name: normalizeSiteToken(payload.device_name),
    type: normalizeSiteToken(payload.device_type),
    in1: normalizeSiteToken(payload.modbus_address_in),
    in2: normalizeSiteToken(payload.modbus_address_in_2),
    out1: normalizeSiteToken(payload.modbus_address_out),
    out2: normalizeSiteToken(payload.modbus_address_out_2)
  };
  const currentComparable = toComparable(currentMeter || {});
  const changedFields = Object.keys(expectedComparable).filter(
    (key) => expectedComparable[key] !== currentComparable[key]
  );
  const isExpectedMeterState = (candidate) => {
    if (!candidate || typeof candidate !== "object") return false;
    const actual = toComparable(candidate);
    if (!changedFields.length) return true;
    return changedFields.every((key) => actual[key] === expectedComparable[key]);
  };
  const fetchMeterByIdFromApi = async (id) => {
    const refreshed = await fetchPlantDevicesFromApi(plant).catch(() => []);
    if (!Array.isArray(refreshed) || !refreshed.length) return null;
    return (
      refreshed.find((item) => getMeterPersistId(item) === id) ||
      null
    );
  };
  const verifyUpdatedStateFromApi = async (id) => {
    const waits = [0, 280, 650];
    for (const wait of waits) {
      if (wait > 0) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, wait);
        });
      }
      const byId = await fetchMeterByIdFromApi(id);
      if (isExpectedMeterState(byId)) return byId;
    }
    return null;
  };
  const encodedMeterId = encodeURIComponent(String(meterId));
  const attempts = [
    {
      path: "",
      init: {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id: meterId })
      }
    },
    {
      path: `/${encodedMeterId}`,
      init: {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    }
  ];
  let firstError = null;
  for (const attempt of attempts) {
    let response = null;
    try {
      response = await fetch(`/api/devices${attempt.path}`, attempt.init);
    } catch (error) {
      if (!firstError) firstError = error;
      continue;
    }
    if (response.ok) {
      const responsePayload = await response.json().catch(() => null);
      const updatedFromPayload = extractMeterFromWritePayload(responsePayload);
      if (
        updatedFromPayload &&
        getMeterPersistId(updatedFromPayload) === meterId &&
        isExpectedMeterState(updatedFromPayload)
      ) {
        return updatedFromPayload;
      }
      const updatedFromApi = await verifyUpdatedStateFromApi(meterId);
      if (updatedFromApi) return updatedFromApi;
      throw new Error("API ตอบสำเร็จ แต่ข้อมูลมิเตอร์ไม่เปลี่ยนที่หลังบ้าน");
    }
    const detail = await readResponseErrorText(response);
    if (response.status === 403) {
      throw new Error(detail.replace(/^:\s*/, "") || "ไม่มีสิทธิ์แก้ไขมิเตอร์");
    }
    if (response.status === 401) {
      throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    }
    if (!firstError) {
      firstError = new Error(`PUT /api/devices failed (${response.status})${detail}`);
    }
  }
  throw firstError || new Error("แก้ไขมิเตอร์ผ่าน API ไม่สำเร็จ");
};
const handleCreateMeter = async () => {
  const deviceType = readText(meterCreateTypeInput?.value) || "METER";
  const meterName = readText(meterCreateNameInput?.value);
  const modbusIn1 = readText(meterCreateIn1Input?.value);
  const modbusIn2 = readText(meterCreateIn2Input?.value);
  const modbusOut1 = readText(meterCreateOut1Input?.value);
  const modbusOut2 = readText(meterCreateOut2Input?.value);
  if (!meterName || !modbusIn1 || !modbusIn2) {
    alert(tMeters("meters.modal.alert.fill_required", "กรุณากรอกประเภทอุปกรณ์, ชื่ออุปกรณ์ และ Modbus Address ขาเข้าให้ครบ"));
    return;
  }
  if (isSavingMeterCreate) return;
  isSavingMeterCreate = true;
  if (meterCreateConfirm) {
    meterCreateConfirm.disabled = true;
    meterCreateConfirm.textContent = tMeters("common.saving", "กำลังบันทึก...");
  }
  const serialLabel = `IN ${modbusIn1} / ${modbusIn2}`;
  const newMeter = {
    id: null,
    apiId: null,
    siteId: Number.isFinite(Number(plant?.apiId)) ? Number(plant.apiId) : null,
    siteCode: readText(plant?.siteCode, plant?.site_code),
    name: meterName,
    sn: serialLabel,
    serial: serialLabel,
    status: "online",
    deviceType,
    modbusIn1,
    modbus_in_1: modbusIn1,
    modbusIn2,
    modbus_in_2: modbusIn2,
    modbusOut1,
    modbus_out_1: modbusOut1,
    modbusOut2,
    modbus_out_2: modbusOut2,
    modbus_address_in: `${modbusIn1}/${modbusIn2}`,
    modbus_address_out: modbusOut1 || modbusOut2 ? `${modbusOut1 || "-"} / ${modbusOut2 || "-"}` : ""
  };
  try {
    if (
      editingPlantMeterIndex !== null &&
      editingPlantMeterIndex >= 0 &&
      editingPlantMeterIndex < plantMeters.length
    ) {
      const currentMeter = plantMeters[editingPlantMeterIndex] || {};
      const mergedMeter = {
        ...currentMeter,
        ...newMeter,
        id: currentMeter.id ?? null,
        apiId: currentMeter.apiId ?? null,
        siteId:
          Number.isFinite(Number(currentMeter.siteId)) && Number(currentMeter.siteId) > 0
            ? Number(currentMeter.siteId)
            : newMeter.siteId,
        siteCode: readText(currentMeter.siteCode, currentMeter.site_code, newMeter.siteCode),
        status: readText(currentMeter.status) || "online"
      };
      const savedMeter = await updateMeterInApi(mergedMeter, currentMeter);
      const updatedMeters = plantMeters.map((meter, idx) =>
        idx === editingPlantMeterIndex ? savedMeter : meter
      );
      applyPlantMeters(updatedMeters, { persistPlant: true, persistHomePlants: true });
    } else {
      const savedMeter = await createMeterInApi(newMeter);
      applyPlantMeters([...plantMeters, savedMeter], { persistPlant: true, persistHomePlants: true });
    }
    closeMeterCreateModal();
  } catch (error) {
    alert(error?.message || tMeters("meters.error.save_failed", "บันทึกมิเตอร์ผ่าน API ไม่สำเร็จ"));
  } finally {
    isSavingMeterCreate = false;
    if (meterCreateConfirm) {
      meterCreateConfirm.disabled = false;
      if (isMeterCreateModalOpen) {
        meterCreateConfirm.textContent =
          editingPlantMeterIndex !== null
            ? tMeters("meters.modal.action.save", "บันทึก")
            : tMeters("meters.modal.action.add", "เพิ่มมิเตอร์");
      }
    }
  }
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

meterNewBtn?.addEventListener("click", () => {
  editingPlantMeterIndex = null;
  resetMeterCreateForm();
  openMeterCreateModal();
});
meterCreateModalClose?.addEventListener("click", closeMeterCreateModal);
meterCreateCancel?.addEventListener("click", closeMeterCreateModal);
meterCreateModal?.addEventListener("click", (e) => {
  if (e.target === meterCreateModal) closeMeterCreateModal();
});
meterCreateConfirm?.addEventListener("click", handleCreateMeter);
meterCreateModal?.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  handleCreateMeter();
});
document.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof Element && target.closest(".meter-row-actions")) return;
  closeMeterRowMenus();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshMeterLiveReadings();
});
window.addEventListener("beforeunload", stopMeterLivePolling);
[meterCreateIn1Input, meterCreateIn2Input, meterCreateOut1Input, meterCreateOut2Input].forEach(
  (input) => {
    input?.addEventListener("input", () => {
      const cleaned = input.value.replace(/\D+/g, "");
      if (input.value !== cleaned) input.value = cleaned;
    });
  }
);
const bootstrapPlantPage = async () => {
  const hasAccess = typeof ensurePlantAccess === "function"
    ? await ensurePlantAccess()
    : true;
  if (!hasAccess) return;
  if (nameEl) {
    nameEl.textContent = plant?.name || "Plant";
  }
  setMode("dashboard");
  applyPlantMeters(plantMeters, { persistPlant: false });
  // Run independent fetches in parallel — role lookup, devices, and billing
  // init don't depend on one another for their initial load.
  await Promise.all([
    hydrateCurrentUserRole().catch(() => null),
    hydratePlantMetersFromApi().catch(() => null),
    initBilling().catch((err) => console.error("[billing] init failed:", err))
  ]);
  startMeterLivePolling();
  document.body.classList.remove("access-checking");
};
bootstrapPlantPage();

document.addEventListener("i18n:changed", () => {
  try { renderPlantMeters(); } catch { /* ignore */ }
  try { renderPlantDashboard(); } catch { /* ignore */ }
});
