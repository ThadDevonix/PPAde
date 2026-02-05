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
const billDetailRows = document.getElementById("bill-detail-rows");
const billDetailTitle = document.getElementById("bill-detail-title");
const billDetailClose = document.getElementById("bill-detail-close");
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
const modalMeterList = document.getElementById("modal-meter-list");
const meterSelectAllBtn = document.getElementById("meter-select-all");
const meterClearBtn = document.getElementById("meter-clear");
const meterSelectedCount = document.getElementById("meter-selected-count");
const billStart = document.getElementById("bill-start");
const billEnd = document.getElementById("bill-end");
const billRateInput = document.getElementById("bill-rate");
const billType = document.getElementById("bill-type");
const billCalc = document.getElementById("bill-calc");
const billCutoff = document.getElementById("bill-cutoff");
const metersBtn = document.getElementById("mode-meters");
const billingBtn = document.getElementById("mode-billing");
const metersPanel = document.getElementById("meters-panel");
const billingPanel = document.getElementById("billing-panel");

const energyApiBase = "https://solarmdb.devonix.co.th/api/energy";
const calcMethodLabels = {
  self_use: "Self Use (Meter 1)",
  mdb_net: "MDB In - MDB Out (Meter 2)",
  solar_in: "Solar In (Meter 1)",
  mdb_in: "MDB In (Meter 2)",
  mdb_out: "MDB Out (Meter 2)"
};

let isModalOpen = false;
let activeDetailId = null;

const pad = (value) => String(value).padStart(2, "0");
const formatDate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const formatMonth = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
const parseDateInput = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
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

const updateSelectedCount = () => {
  if (!meterSelectedCount || !modalMeterList) return;
  const total = modalMeterList.querySelectorAll('input[type="checkbox"]').length;
  const selected = modalMeterList.querySelectorAll(
    'input[type="checkbox"]:checked'
  ).length;
  meterSelectedCount.textContent = `${selected}/${total} เลือก`;
};
const applyMeterCardHandlers = () => {
  if (!modalMeterList) return;
  modalMeterList.querySelectorAll(".meter-card").forEach((card) => {
    const cb = card.querySelector('input[type="checkbox"]');
    if (!cb) return;
    card.classList.toggle("checked", cb.checked);
    cb.addEventListener("change", () => {
      card.classList.toggle("checked", cb.checked);
      updateSelectedCount();
    });
  });
  updateSelectedCount();
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
  calcMethod: "self_use"
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

const getBillUnits = (row, method) => {
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

const createBill = ({
  periodStart,
  periodEnd,
  meters,
  rate,
  rateType,
  calcMethod,
  dailyRows,
  auto = false,
  source = "api"
}) => {
  const daily = dailyRows.map((row) => ({
    ...row,
    bill_units: getBillUnits(row, calcMethod)
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
      const methodLabel = calcMethodLabels[bill.calcMethod] || bill.calcMethod;
      const sourceLabel = bill.source === "api" ? "API" : "Mock";
      return `
        <tr data-id="${bill.id}">
          <td>ใบที่ ${bill.billNo}</td>
          <td>${meterText || "-"}</td>
          <td>
            <div>${bill.periodStart} - ${bill.periodEnd}</div>
            <div class="muted small">คิดจาก: ${methodLabel} • ข้อมูล: ${sourceLabel}</div>
            <span class="badge ${badgeClass}">${badgeLabel}</span>
          </td>
          <td>${formatNumber(bill.rate, 2)}</td>
          <td>${formatNumber(bill.totalKwh, 1)}</td>
          <td>${formatCurrency(bill.amount)}</td>
          <td>
            <div class="history-actions">
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
  billHistoryRows.querySelectorAll("button[data-action='delete']").forEach(
    (btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (id) deleteBill(id);
      });
    }
  );
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
  activeDetailId = id;
  billDetailTitle.textContent = `ใบที่ ${bill.billNo} • ${bill.periodStart} - ${bill.periodEnd}`;
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
    .map(
      (row) => `
      <tr>
        <td>${row.date}</td>
        <td>${formatNumber(row.solar_in, 1)}</td>
        <td>${formatNumber(row.self_use, 1)}</td>
        <td>${formatNumber(row.mdb_in, 1)}</td>
        <td>${formatNumber(row.mdb_out, 1)}</td>
        <td>${formatNumber(row.bill_units, 1)}</td>
      </tr>
    `
    )
    .join("");
  billDetailRows.innerHTML += `
    <tr>
      <td><strong>รวม</strong></td>
      <td><strong>${formatNumber(totals.solar_in, 1)}</strong></td>
      <td><strong>${formatNumber(totals.self_use, 1)}</strong></td>
      <td><strong>${formatNumber(totals.mdb_in, 1)}</strong></td>
      <td><strong>${formatNumber(totals.mdb_out, 1)}</strong></td>
      <td><strong>${formatNumber(totals.bill_units, 1)}</strong></td>
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
  createBill({
    periodStart: startStr,
    periodEnd: endStr,
    meters: meterProfiles,
    rate: schedule.defaultRate,
    rateType: schedule.rateType,
    calcMethod: schedule.calcMethod || defaultSchedule.calcMethod,
    auto: true,
    source,
    dailyRows: rows
  });
};

const openModal = () => {
  if (!billModal || !modalMeterList) return;
  billModal.classList.remove("hidden");
  isModalOpen = true;
  modalMeterList.innerHTML = meterProfiles
    .map(
      (m, i) =>
        `<label class="meter-card">
            <input type="checkbox" value="${i}" checked>
            <div class="meter-card-body">
              <div class="meter-name-row">
                <span class="meter-name">${m.name}</span>
                <span class="meter-status ${m.status === "online" ? "online" : "offline"}">
                  ${m.status === "online" ? "ออนไลน์" : "ออฟไลน์"}
                </span>
              </div>
              <div class="meter-sn">SN: ${m.sn}</div>
            </div>
          </label>`
    )
    .join("");
  setDefaultRange(schedule.cutoffDay);
  if (billRateInput) billRateInput.value = schedule.defaultRate;
  if (billType && schedule.rateType) billType.value = schedule.rateType;
  if (billCalc && schedule.calcMethod) billCalc.value = schedule.calcMethod;
  applyMeterCardHandlers();
};

const handleConfirm = async () => {
  if (!modalMeterList) return;
  const checked = Array.from(
    modalMeterList.querySelectorAll("input[type=checkbox]:checked")
  ).map((el) => Number(el.value));
  if (!checked.length) {
    alert("กรุณาเลือกอย่างน้อย 1 มิเตอร์");
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
  const selectedMeters = checked
    .map((i) => meterProfiles[i])
    .filter(Boolean);
  const cutoffDay = billCutoff?.value ? Number(billCutoff.value) : 5;
  const rateVal =
    parseFloat(billRateInput.value || `${schedule.defaultRate}`) ||
    schedule.defaultRate;
  const rateTypeVal = billType?.value || schedule.rateType;
  const calcMethod = billCalc?.value || schedule.calcMethod;
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
    auto: false,
    source,
    dailyRows: rows
  });

  schedule = {
    ...schedule,
    cutoffDay,
    defaultRate: rateVal,
    rateType: rateTypeVal,
    calcMethod
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
  if (e.key === "Escape" && isModalOpen) closeModal();
});

billCutoff?.addEventListener("change", () => {
  const cutoffDay = billCutoff?.value ? Number(billCutoff.value) : 5;
  updateScheduleInfo(cutoffDay);
});
meterSelectAllBtn?.addEventListener("click", () => {
  if (!modalMeterList) return;
  modalMeterList.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.checked = true;
    const card = cb.closest(".meter-card");
    if (card) card.classList.add("checked");
  });
  updateSelectedCount();
});
meterClearBtn?.addEventListener("click", () => {
  if (!modalMeterList) return;
  modalMeterList.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.checked = false;
    const card = cb.closest(".meter-card");
    if (card) card.classList.remove("checked");
  });
  updateSelectedCount();
});

billDetailClose?.addEventListener("click", hideDetail);

// toggle meters/billing
let billingMode = false;
const setMode = (isBilling) => {
  billingMode = isBilling;
  if (metersPanel && billingPanel) {
    metersPanel.classList.toggle("hidden", isBilling);
    billingPanel.classList.toggle("hidden", !isBilling);
  }
  if (metersBtn) metersBtn.classList.toggle("active", !isBilling);
  if (billingBtn) billingBtn.classList.toggle("active", isBilling);
  if (!isBilling) {
    closeModal();
    hideDetail();
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

const devices = Array.isArray(plant.devices) && plant.devices.length
  ? plant.devices
  : [
      { name: "Meter A", sn: plant.deviceSn || "-", status: "online" },
      { name: "Meter B", sn: (plant.deviceSn || "-") + "-B", status: "online" }
    ];

meterProfiles = buildMeterProfiles(devices);

if (deviceRowsEl) {
  deviceRowsEl.innerHTML = devices
    .map(
      (d, idx) => `
      <tr data-idx="${idx}">
        <td><span class="status-dot" title="${d.status}"></span></td>
        <td>${d.name}</td>
        <td>${d.sn}</td>
      </tr>`
    )
    .join("");

  deviceRowsEl.querySelectorAll("tr").forEach((tr) => {
    tr.addEventListener("click", () => {
      const idx = Number(tr.dataset.idx);
      const meter = devices[idx];
      if (!meter) return;
      localStorage.setItem("selectedPlant", JSON.stringify(plant));
      localStorage.setItem("selectedMeter", JSON.stringify(meter));
      window.location.href = "./meter.html";
    });
  });
}

historyKey = buildStorageKey("billingHistoryV2");
scheduleKey = buildStorageKey("billingScheduleV1");
sequenceKey = buildStorageKey("billingSequenceV1");
loadSchedule();
loadHistory();

const initBilling = async () => {
  updateScheduleInfo(schedule.cutoffDay);
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
setMode(false);
initBilling();
