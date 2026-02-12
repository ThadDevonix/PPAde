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

const energyApiCandidates = ["/api/energy", "https://solarmdb.devonix.co.th/api/energy"];
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

let selectedPeriod = "month";
const selectedMeterId = Number(meterData?.id);

const pad2 = (value) => String(value).padStart(2, "0");
const formatDateKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const normalizeDateKey = (value) => {
  if (!value) return "";
  const text = String(value).trim();
  const match = text.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
};
const normalizeKeyToken = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
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
const readText = (...values) => {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (text) return text;
  }
  return "";
};
const selectedEnergyName = readText(
  meterData?.sn,
  meterData?.name,
  plantData?.siteCode,
  plantData?.site_code,
  plantData?.name
) || fallbackPlantName;
const formatMetric = (value) =>
  parseNumber(value).toLocaleString("th-TH", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
const formatTotalKwh = (value) => `${formatMetric(value)} kWh`;
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
  return stamp ? formatDateKey(stamp) : "";
};
const formatAxisLabel = ({ dateKey, stampMs }, period, idx) => {
  const date = stampMs ? new Date(stampMs) : toDate(dateKey);
  if (date && period === "day") {
    return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  }
  if (date && period === "month") {
    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
  }
  if (date && period === "year") {
    return `${pad2(date.getDate())} ${thaiMonthShort[date.getMonth()]}`;
  }
  return dateKey || `#${idx + 1}`;
};
const rowHasSeries = (row) =>
  row &&
  typeof row === "object" &&
  !Array.isArray(row) &&
  (readLooseValue(row, ["solar_in", "solarIn", "solar in"]) !== undefined ||
    readLooseValue(row, ["self_use", "selfUse", "self use"]) !== undefined);
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
const normalizeChartRows = (rows, { period = "month", limit = 120 } = {}) => {
  const normalized = rows.map((row, idx) => {
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
      label: formatAxisLabel({ dateKey, stampMs: stamp ? stamp.getTime() : null }, period, idx),
      solarIn: parseNumber(readLooseValue(row, ["solar_in", "solarIn", "solar in"])),
      selfUse: parseNumber(readLooseValue(row, ["self_use", "selfUse", "self use"]))
    };
  });

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
const renderChart = (rows) => {
  if (!chartBox) return;
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
        <span><i style="background:${solarColor}"></i>Solar In</span>
        <span><i style="background:${selfUseColor}"></i>Self Use</span>
      </div>
      <svg viewBox="0 0 ${width} ${height}" class="meter-chart-svg" role="img" aria-label="กราฟ solar_in และ self_use">
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
        <span>Solar ล่าสุด: <strong>${formatMetric(solarSeries[solarSeries.length - 1])}</strong></span>
        <span>Self Use ล่าสุด: <strong>${formatMetric(selfUseSeries[selfUseSeries.length - 1])}</strong></span>
      </div>
    </div>
  `;
};

const requestPayload = async (queryString) => {
  const errors = [];
  for (let i = 0; i < energyApiCandidates.length; i += 1) {
    const base = energyApiCandidates[i];
    const url = `${base}?${queryString}`;
    try {
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      errors.push(`${base}: ${error?.message || "unknown error"}`);
    }
  }
  throw new Error(errors.join(" | "));
};
const fetchMonthRows = async (year, month) => {
  const deviceIdParam =
    Number.isFinite(selectedMeterId) && selectedMeterId > 0
      ? `&device_id=${encodeURIComponent(selectedMeterId)}`
      : "";
  const query = `period=month&name=${encodeURIComponent(
    selectedEnergyName
  )}&month=${year}-${pad2(month)}${deviceIdParam}`;
  const payload = await requestPayload(query);
  return extractSeriesRows(payload);
};
const getSelectedYear = () => Number(yearSelect?.value || new Date().getFullYear());
const getSelectedMonth = () => Number(monthSelect?.value || new Date().getMonth() + 1);
const getSelectedDay = () => Number(daySelect?.value || new Date().getDate());
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
      rows = normalizeChartRows(raw, { period: "year", limit: 366 });
    }

    if (selectedPeriod === "month") {
      const raw = await fetchMonthRows(year, month);
      rows = normalizeChartRows(raw, { period: "month", limit: 62 });
    }

    if (selectedPeriod === "day") {
      const target = `${year}-${pad2(month)}-${pad2(day)}`;
      const raw = await fetchMonthRows(year, month);
      const filtered = raw.filter((row) => resolveRowDateKey(row) === target);
      rows = normalizeChartRows(filtered, { period: "day", limit: 144 });
    }

    renderChart(rows);
  } catch (error) {
    chartBox.textContent = `โหลดกราฟไม่สำเร็จ (${error.message})`;
    if (totalKwhValue) totalKwhValue.textContent = "-";
    console.warn("Failed to load chart", error);
  }
};
const initDateControls = () => {
  if (!yearSelect || !monthSelect || !daySelect) return;
  const now = new Date();
  const year = now.getFullYear();

  yearSelect.innerHTML = Array.from({ length: 8 }, (_, idx) => {
    const value = year - 4 + idx;
    return `<option value="${value}">${value}</option>`;
  }).join("");
  yearSelect.value = String(year);

  monthSelect.innerHTML = thaiMonthShort
    .map(
      (label, idx) => `<option value="${idx + 1}">${idx + 1} - ${label}</option>`
    )
    .join("");
  monthSelect.value = String(now.getMonth() + 1);

  updateDayOptions();
  daySelect.value = String(now.getDate());
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
