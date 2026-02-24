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
const calcModeResetBtn = document.getElementById("calc-mode-reset");
const formulaInlineGrid = document.getElementById("formula-inline-grid");
const formulaColumnBuilder = document.getElementById("formula-column-builder");
const formulaAddColumnBtn = document.getElementById("formula-add-column-btn");
const formulaAddCalcColumnBtn = document.getElementById("formula-add-calc-column-btn");
const formulaRemoveColumnBtn = document.getElementById("formula-remove-column-btn");
const formulaColumnsBoxes = document.getElementById("formula-columns-boxes");
const formulaMeterLeftCell = document.getElementById("formula-meter-left-cell");
const formulaValueLeftCell = document.getElementById("formula-value-left-cell");
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
const formulaResultNameLabel = formulaResultNameCell?.querySelector("label");
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
const maxFormulaDraftColumns = 5;
const maxBillPeriodDays = 31;
const rateDecimalPlaces = 3;
const detailColumnDefs = [
  { key: "energy_in", label: "energy_in (kWh)" },
  { key: "energy_out", label: "energy_out (kWh)" },
  { key: "bill_units", label: "หน่วยคิดบิล (kWh)" }
];
const normalizeFormulaFieldKey = (field) => {
  const rawField = String(field || "").trim().toLowerCase();
  if (formulaFieldLabelMap[rawField]) return rawField;
  return formulaFieldAliasMap[rawField] || defaultFormulaField;
};
const sanitizeFormulaColumnDrafts = (drafts) => {
  if (!Array.isArray(drafts) || !drafts.length) return [];
  return drafts
    .slice(0, maxFormulaDraftColumns)
    .map((draft) => {
      const type = draft?.type === "calc" ? "calc" : "basic";
      const name = String(draft?.name || "").trim();
      const include = draft?.include !== false;
      if (type === "calc") {
        const operator = formulaOperators.includes(draft?.operator) ? draft.operator : "-";
        return {
          type,
          name,
          include,
          leftMeterKey: String(draft?.leftMeterKey || "").trim(),
          leftField: normalizeFormulaFieldKey(draft?.leftField),
          operator,
          rightMeterKey: String(draft?.rightMeterKey || "").trim(),
          rightField: normalizeFormulaFieldKey(draft?.rightField)
        };
      }
      return {
        type,
        name,
        include,
        meterKey: String(draft?.meterKey || "").trim(),
        field: normalizeFormulaFieldKey(draft?.field)
      };
    });
};

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
let formulaColumnDrafts = [];

const updateFormulaColumnButtonState = () => {
  const atMax = formulaColumnDrafts.length >= maxFormulaDraftColumns;
  if (formulaAddColumnBtn) formulaAddColumnBtn.disabled = atMax;
  if (formulaAddCalcColumnBtn) formulaAddCalcColumnBtn.disabled = atMax;
  if (formulaRemoveColumnBtn) formulaRemoveColumnBtn.disabled = formulaColumnDrafts.length === 0;
};
const normalizeDraftType = (draft) => (draft?.type === "calc" ? "calc" : "basic");
const renderFormulaColumnDraftBoxes = () => {
  if (!formulaColumnsBoxes) return;
  const activeMeters = getSelectedMetersForFormula();
  const meterByKey = new Map(
    activeMeters.map((meter) => [getMeterKey(meter), meter]).filter(([key]) => key)
  );
  const firstMeter = activeMeters[0] || null;
  const secondMeter = activeMeters[1] || firstMeter;
  const firstMeterKey = getMeterKey(firstMeter);
  const secondMeterKey = getMeterKey(secondMeter);
  formulaColumnsBoxes.innerHTML = "";
  formulaColumnDrafts.forEach((draft, index) => {
    const draftType = normalizeDraftType(draft);
    const item = document.createElement("div");
    item.className = "formula-column-item";
    item.dataset.columnIndex = String(index + 1);
    item.dataset.columnType = draftType;
    const includeLabel = document.createElement("label");
    includeLabel.className = "formula-column-include";
    const includeCheckbox = document.createElement("input");
    includeCheckbox.type = "checkbox";
    includeCheckbox.className = "formula-column-include-checkbox";
    includeCheckbox.checked = draft?.include !== false;
    includeCheckbox.setAttribute("aria-label", `เลือกคอลัมน์ ${index + 1} เพื่อรวมยอด`);
    includeLabel.append(includeCheckbox);
    includeCheckbox.addEventListener("change", () => {
      item.classList.toggle("is-excluded", !includeCheckbox.checked);
    });
    const orderBadge = document.createElement("span");
    orderBadge.className = "formula-column-order";
    orderBadge.textContent = String(index + 1);
    item.classList.toggle("is-excluded", !includeCheckbox.checked);
    if (draftType === "basic") {
      const preferredMeterKey = String(draft?.meterKey || draft?.leftMeterKey || "").trim();
      const meterKey = meterByKey.has(preferredMeterKey) ? preferredMeterKey : firstMeterKey;
      const selectedMeter = meterByKey.get(meterKey) || null;
      const fieldKeys = getFormulaFieldKeysForMeter(selectedMeter);
      const selectedField = fieldKeys.length
        ? resolvePreferredFormulaField(fieldKeys, [
          draft?.field || draft?.meterField || draft?.leftField,
          defaultFormulaField
        ])
        : "";

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "formula-column-input formula-column-name-input";
      nameInput.placeholder = "ชื่อคอลัมน์";
      nameInput.value = String(draft?.name || "");

      const meterSelect = document.createElement("select");
      meterSelect.className =
        "formula-column-input formula-column-meter-select formula-column-meter-basic-select";
      if (!activeMeters.length) {
        meterSelect.innerHTML = '<option value="">ไม่มีมิเตอร์</option>';
        meterSelect.disabled = true;
      } else {
        meterSelect.innerHTML = activeMeters
          .map((meter) => `<option value="${getMeterKey(meter)}">${getMeterLabel(meter)}</option>`)
          .join("");
        meterSelect.value = meterKey || firstMeterKey || "";
        meterSelect.disabled = false;
      }

      const fieldSelect = document.createElement("select");
      fieldSelect.className =
        "formula-column-input formula-column-field-select formula-column-field-basic-select";
      if (!selectedMeter) {
        fieldSelect.innerHTML = '<option value="">ค่าของมิเตอร์</option>';
        fieldSelect.disabled = true;
      } else {
        fieldSelect.innerHTML = fieldKeys
          .map((fieldKey) => {
            const label = formulaFieldLabelMap[fieldKey] || fieldKey;
            return `<option value="${fieldKey}">${label}</option>`;
          })
          .join("");
        fieldSelect.value = selectedField;
        fieldSelect.disabled = false;
      }

      meterSelect.addEventListener("change", () => {
        syncFormulaColumnDraftValuesFromDom();
        if (formulaColumnDrafts[index]) {
          formulaColumnDrafts[index].field = "";
        }
        renderFormulaColumnDraftBoxes();
      });

      item.append(includeLabel, orderBadge, nameInput, meterSelect, fieldSelect);
    } else {
      const preferredLeftMeterKey = String(draft?.leftMeterKey || draft?.meterKey || "").trim();
      const preferredRightMeterKey = String(draft?.rightMeterKey || draft?.meterKey || "").trim();
      const leftMeterKey = meterByKey.has(preferredLeftMeterKey) ? preferredLeftMeterKey : firstMeterKey;
      const rightMeterKey = meterByKey.has(preferredRightMeterKey)
        ? preferredRightMeterKey
        : secondMeterKey || firstMeterKey;
      const leftMeter = meterByKey.get(leftMeterKey) || null;
      const rightMeter = meterByKey.get(rightMeterKey) || null;
      const leftFieldKeys = getFormulaFieldKeysForMeter(leftMeter);
      const rightFieldKeys = getFormulaFieldKeysForMeter(rightMeter);
      const selectedLeftField = leftFieldKeys.length
        ? resolvePreferredFormulaField(leftFieldKeys, [
          draft?.leftField || draft?.meterField || draft?.field,
          defaultFormulaField
        ])
        : "";
      const selectedRightField = rightFieldKeys.length
        ? resolvePreferredFormulaField(rightFieldKeys, [
          draft?.rightField || draft?.meterField || draft?.field,
          defaultFormulaField
        ])
        : "";
      const selectedOperator = formulaOperators.includes(draft?.operator) ? draft.operator : "-";

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "formula-column-input formula-column-name-input";
      nameInput.placeholder = "ชื่อคอลัมน์";
      nameInput.value = String(draft?.name || "");

      const leftMeterSelect = document.createElement("select");
      leftMeterSelect.className =
        "formula-column-input formula-column-meter-select formula-column-meter-left-select";
      if (!activeMeters.length) {
        leftMeterSelect.innerHTML = '<option value="">ไม่มีมิเตอร์</option>';
        leftMeterSelect.disabled = true;
      } else {
        leftMeterSelect.innerHTML = activeMeters
          .map((meter) => `<option value="${getMeterKey(meter)}">${getMeterLabel(meter)}</option>`)
          .join("");
        leftMeterSelect.value = leftMeterKey || firstMeterKey || "";
        leftMeterSelect.disabled = false;
      }

      const leftFieldSelect = document.createElement("select");
      leftFieldSelect.className =
        "formula-column-input formula-column-field-select formula-column-field-left-select";
      if (!leftMeter) {
        leftFieldSelect.innerHTML = '<option value="">ค่าของมิเตอร์</option>';
        leftFieldSelect.disabled = true;
      } else {
        leftFieldSelect.innerHTML = leftFieldKeys
          .map((fieldKey) => {
            const label = formulaFieldLabelMap[fieldKey] || fieldKey;
            return `<option value="${fieldKey}">${label}</option>`;
          })
          .join("");
        leftFieldSelect.value = selectedLeftField;
        leftFieldSelect.disabled = false;
      }

      const operatorSelect = document.createElement("select");
      operatorSelect.className = "formula-column-input formula-column-operator-select";
      operatorSelect.innerHTML = formulaOperators
        .map((operator) => `<option value="${operator}">${operator}</option>`)
        .join("");
      operatorSelect.value = selectedOperator;

      const rightMeterSelect = document.createElement("select");
      rightMeterSelect.className =
        "formula-column-input formula-column-meter-select formula-column-meter-right-select";
      if (!activeMeters.length) {
        rightMeterSelect.innerHTML = '<option value="">ไม่มีมิเตอร์</option>';
        rightMeterSelect.disabled = true;
      } else {
        rightMeterSelect.innerHTML = activeMeters
          .map((meter) => `<option value="${getMeterKey(meter)}">${getMeterLabel(meter)}</option>`)
          .join("");
        rightMeterSelect.value = rightMeterKey || secondMeterKey || firstMeterKey || "";
        rightMeterSelect.disabled = false;
      }

      const rightFieldSelect = document.createElement("select");
      rightFieldSelect.className =
        "formula-column-input formula-column-field-select formula-column-field-right-select";
      if (!rightMeter) {
        rightFieldSelect.innerHTML = '<option value="">ค่าของมิเตอร์</option>';
        rightFieldSelect.disabled = true;
      } else {
        rightFieldSelect.innerHTML = rightFieldKeys
          .map((fieldKey) => {
            const label = formulaFieldLabelMap[fieldKey] || fieldKey;
            return `<option value="${fieldKey}">${label}</option>`;
          })
          .join("");
        rightFieldSelect.value = selectedRightField;
        rightFieldSelect.disabled = false;
      }

      leftMeterSelect.addEventListener("change", () => {
        syncFormulaColumnDraftValuesFromDom();
        if (formulaColumnDrafts[index]) {
          formulaColumnDrafts[index].leftField = "";
        }
        renderFormulaColumnDraftBoxes();
      });
      rightMeterSelect.addEventListener("change", () => {
        syncFormulaColumnDraftValuesFromDom();
        if (formulaColumnDrafts[index]) {
          formulaColumnDrafts[index].rightField = "";
        }
        renderFormulaColumnDraftBoxes();
      });

      item.append(
        includeLabel,
        orderBadge,
        nameInput,
        leftMeterSelect,
        leftFieldSelect,
        operatorSelect,
        rightMeterSelect,
        rightFieldSelect
      );
    }

    formulaColumnsBoxes.appendChild(item);
  });
  updateFormulaColumnButtonState();
};
const syncFormulaColumnDraftValuesFromDom = () => {
  if (!formulaColumnsBoxes) return;
  formulaColumnDrafts = sanitizeFormulaColumnDrafts(
    Array.from(formulaColumnsBoxes.querySelectorAll(".formula-column-item")).map(
    (item) => {
      const draftType = item.dataset.columnType === "calc" ? "calc" : "basic";
      if (draftType === "basic") {
        return {
          type: "basic",
          name: String(item.querySelector(".formula-column-name-input")?.value || ""),
          include: item.querySelector(".formula-column-include-checkbox")?.checked !== false,
          meterKey: String(item.querySelector(".formula-column-meter-basic-select")?.value || ""),
          field: String(item.querySelector(".formula-column-field-basic-select")?.value || "")
        };
      }
      return {
        type: "calc",
        name: String(item.querySelector(".formula-column-name-input")?.value || ""),
        include: item.querySelector(".formula-column-include-checkbox")?.checked !== false,
        leftMeterKey: String(item.querySelector(".formula-column-meter-left-select")?.value || ""),
        leftField: String(item.querySelector(".formula-column-field-left-select")?.value || ""),
        operator: String(item.querySelector(".formula-column-operator-select")?.value || "-"),
        rightMeterKey: String(item.querySelector(".formula-column-meter-right-select")?.value || ""),
        rightField: String(item.querySelector(".formula-column-field-right-select")?.value || "")
      };
    }
  )
  );
  updateFormulaColumnButtonState();
};
const getFormulaColumnDraftsFromInputs = () => {
  syncFormulaColumnDraftValuesFromDom();
  return sanitizeFormulaColumnDrafts(formulaColumnDrafts);
};
const setFormulaColumnDrafts = (drafts) => {
  formulaColumnDrafts = sanitizeFormulaColumnDrafts(drafts);
  renderFormulaColumnDraftBoxes();
};
const ensureFormulaColumnDraftBox = () => {
  if (calcInputMode !== "formula") return;
  if (formulaColumnDrafts.length) return;
  addFormulaColumnDraftBox();
};
const resetFormulaColumnDraftBoxes = () => {
  setFormulaColumnDrafts([]);
};
const addFormulaColumnDraftBox = () => {
  syncFormulaColumnDraftValuesFromDom();
  if (formulaColumnDrafts.length >= maxFormulaDraftColumns) {
    alert(
      `เพิ่มได้สูงสุด ${maxFormulaDraftColumns} คอลัมน์ (รวมวันที่ทั้งหมดไม่เกิน ${
        maxFormulaDraftColumns + 1
      } คอลัมน์)`
    );
    updateFormulaColumnButtonState();
    return;
  }
  const activeMeters = getSelectedMetersForFormula();
  const firstMeter = activeMeters[0] || null;
  const fieldKeys = getFormulaFieldKeysForMeter(firstMeter);
  formulaColumnDrafts.push({
    type: "basic",
    name: "",
    include: true,
    meterKey: getMeterKey(firstMeter),
    field: fieldKeys.length
      ? resolvePreferredFormulaField(fieldKeys, [defaultFormulaField])
      : ""
  });
  renderFormulaColumnDraftBoxes();
};
const addFormulaCalcColumnDraftBox = () => {
  syncFormulaColumnDraftValuesFromDom();
  if (formulaColumnDrafts.length >= maxFormulaDraftColumns) {
    alert(
      `เพิ่มได้สูงสุด ${maxFormulaDraftColumns} คอลัมน์ (รวมวันที่ทั้งหมดไม่เกิน ${
        maxFormulaDraftColumns + 1
      } คอลัมน์)`
    );
    updateFormulaColumnButtonState();
    return;
  }
  const activeMeters = getSelectedMetersForFormula();
  const firstMeter = activeMeters[0] || null;
  const secondMeter = activeMeters[1] || firstMeter;
  const leftFieldKeys = getFormulaFieldKeysForMeter(firstMeter);
  const rightFieldKeys = getFormulaFieldKeysForMeter(secondMeter);
  formulaColumnDrafts.push({
    type: "calc",
    name: "",
    include: true,
    leftMeterKey: getMeterKey(firstMeter),
    leftField: leftFieldKeys.length
      ? resolvePreferredFormulaField(leftFieldKeys, [defaultFormulaField])
      : "",
    operator: "-",
    rightMeterKey: getMeterKey(secondMeter),
    rightField: rightFieldKeys.length
      ? resolvePreferredFormulaField(rightFieldKeys, [defaultFormulaField])
      : ""
  });
  renderFormulaColumnDraftBoxes();
};
const removeFormulaColumnDraftBox = () => {
  syncFormulaColumnDraftValuesFromDom();
  if (!formulaColumnDrafts.length) {
    updateFormulaColumnButtonState();
    return;
  }
  formulaColumnDrafts.pop();
  renderFormulaColumnDraftBoxes();
};

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
let currentUserProfile = null;
const normalizeCreatorSnapshot = (user) => {
  const source = user && typeof user === "object" ? user : {};
  const idRaw = source?.id;
  const id =
    idRaw === undefined || idRaw === null ? "" : String(idRaw).trim();
  const name = readText(
    source?.name,
    source?.full_name,
    source?.fullName,
    source?.display_name,
    source?.displayName,
    source?.username
  );
  const email = readText(source?.email);
  const role = normalizeRole(source?.role);
  return { id, name, email, role };
};
const getCurrentCreatorSnapshot = () => {
  const profile = normalizeCreatorSnapshot(currentUserProfile);
  const role = profile.role || normalizeRole(currentUserRole);
  const name =
    profile.name || profile.email || (profile.id ? `ID ${profile.id}` : "");
  return {
    id: profile.id,
    name,
    email: profile.email,
    role
  };
};
const getBillCreatorSnapshot = (bill) => {
  const nested = normalizeCreatorSnapshot(bill?.createdBy);
  const flat = normalizeCreatorSnapshot({
    id: bill?.createdById,
    name: bill?.createdByName,
    email: bill?.createdByEmail,
    role: bill?.createdByRole
  });
  const id = nested.id || flat.id;
  const email = nested.email || flat.email;
  const role = nested.role || flat.role;
  const name = nested.name || flat.name || email || (id ? `ID ${id}` : "");
  return { id, name, email, role };
};
const getBillCreatorLabel = (bill) =>
  getBillCreatorSnapshot(bill).name || "ไม่ระบุผู้สร้าง";
const getCurrentPlantSnapshot = () => {
  const name = readText(plant?.name) || "PONIX";
  const siteCode = readText(plant?.siteCode, plant?.site_code);
  const apiId = Number(plant?.apiId);
  return {
    name,
    siteCode,
    apiId: Number.isFinite(apiId) && apiId > 0 ? apiId : null
  };
};
const isSuperAdminRole = (role) =>
  normalizeRole(role)
    .replace(/[^a-z]/g, "") === "superadmin";
const canDeleteMeters = () => currentUserRole !== "admin";
const canDeleteAutoSchedules = () => isSuperAdminRole(currentUserRole);
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
  currentUserProfile = null;
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "same-origin"
    });
    if (!response.ok) return;
    const payload = await response.json().catch(() => ({}));
    const user = payload?.user && typeof payload.user === "object" ? payload.user : null;
    if (!user) return;
    currentUserRole = normalizeRole(user?.role);
    currentUserProfile = { ...user };
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
};
const resetCalcInputsByMode = (mode) => {
  const activeMeters = getSelectedMetersForFormula();
  const isSingle = mode === "single";
  const meterOptions = activeMeters.length
    ? `<option value="">เลือกมิเตอร์</option>${activeMeters
      .map((meter) => `<option value="${getMeterKey(meter)}">${getMeterLabel(meter)}</option>`)
      .join("")}`
    : '<option value="">ไม่มีมิเตอร์</option>';

  if (formulaMeterLeft) {
    formulaMeterLeft.innerHTML = meterOptions;
    formulaMeterLeft.value = "";
    formulaMeterLeft.disabled = !activeMeters.length;
  }
  if (formulaMeterRight) {
    formulaMeterRight.innerHTML = meterOptions;
    formulaMeterRight.value = "";
    formulaMeterRight.disabled = !activeMeters.length;
  }
  if (formulaOperator) {
    formulaOperator.value = "-";
  }
  syncFormulaValueOptionsForMeterSelects({
    leftPreferredField: "",
    rightPreferredField: "",
    preserveExisting: false
  });

  resetFormulaColumnDraftBoxes();
  if (!activeMeters.length) {
    if (formulaResultName) {
      formulaResultName.value = isSingle ? "" : defaultCalcLabel;
    }
    if (formulaResultValue) formulaResultValue.value = "-";
    formulaTerms = [];
    return;
  }
  if (formulaResultName) {
    formulaResultName.value = "";
  }
  if (formulaResultValue) formulaResultValue.value = "-";
  formulaTerms = [];
};
const setCalcInputMode = (mode, options = {}) => {
  const { skipPreview = false, resetInputs = false } = options;
  calcInputMode = mode === "single" ? "single" : "formula";
  const isSingle = calcInputMode === "single";
  calcModeSingleBtn?.classList.toggle("active", isSingle);
  calcModeFormulaBtn?.classList.toggle("active", !isSingle);
  formulaInlineGrid?.classList.toggle("single-mode", isSingle);
  formulaInlineGrid?.classList.toggle("hidden", !isSingle);
  formulaColumnBuilder?.classList.toggle("hidden", isSingle);
  formulaMeterLeftCell?.classList.toggle("hidden", !isSingle);
  formulaValueLeftCell?.classList.toggle("hidden", !isSingle);
  formulaOpCell?.classList.toggle("hidden", isSingle);
  formulaMeterRightCell?.classList.toggle("hidden", isSingle);
  formulaValueRightCell?.classList.toggle("hidden", isSingle);
  formulaResultNameCell?.classList.remove("hidden");
  formulaResultValueCell?.classList.toggle("hidden", isSingle);
  if (formulaMeterLeftLabel) {
    formulaMeterLeftLabel.textContent = "ชื่อมิเตอร์";
  }
  if (formulaValueLeftLabel) {
    formulaValueLeftLabel.textContent = "ค่าที่ใช้คำนวณ";
  }
  if (formulaResultNameLabel) {
    formulaResultNameLabel.textContent = isSingle ? "ชื่อคอลัมน์" : "ชื่อผลคำนวณ";
  }
  if (formulaResultName) {
    formulaResultName.placeholder = isSingle ? "ชื่อคอลัมน์" : "ชื่อผลคำนวณ";
  }
  if (isSingle && formulaResultName) {
    const currentName = formulaResultName.value.trim();
    const autoLabel = getSingleModeCalcLabel();
    if (currentName === defaultCalcLabel || currentName === autoLabel) {
      formulaResultName.value = "";
    }
  }
  if (isSingle && formulaResultValue) {
    formulaResultValue.value = "-";
  }
  if (resetInputs) {
    resetCalcInputsByMode(calcInputMode);
  }
  if (!skipPreview && isModalOpen) updateFormulaResultPreview();
};
const buildFormulaFromInputs = () => {
  const activeMeters = getSelectedMetersForFormula();
  if (!activeMeters.length) return [];
  const meterMap = new Map(
    activeMeters.map((meter) => [getMeterKey(meter), meter]).filter(([key]) => key)
  );
  const firstKey = String(formulaMeterLeft?.value || "").trim();
  const secondKey = String(formulaMeterRight?.value || "").trim();
  const firstMeter = meterMap.get(firstKey) || null;
  const secondMeter = meterMap.get(secondKey) || null;
  const firstField = formulaFieldLabelMap[formulaValueLeft?.value] ? formulaValueLeft.value : "";
  const secondField = formulaFieldLabelMap[formulaValueRight?.value] ? formulaValueRight.value : "";
  const operator = formulaOperators.includes(formulaOperator?.value)
    ? formulaOperator.value
    : "-";
  if (calcInputMode === "single") {
    if (!firstMeter || !firstField) return [];
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
  if (!firstMeter || !firstField || !secondMeter || !secondField) return [];
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
  if (calcInputMode === "single") {
    return raw || getSingleModeCalcLabel();
  }
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
  if (formulaResultName) {
    const initialLabel = String(calcLabel || "").trim();
    if (calcInputMode === "single") {
      const autoLabel = getSingleModeCalcLabel();
      formulaResultName.value =
        initialLabel && initialLabel !== defaultCalcLabel && initialLabel !== autoLabel
          ? initialLabel
          : "";
    } else {
      formulaResultName.value = initialLabel || defaultCalcLabel;
    }
  }
  formulaTerms = buildFormulaFromInputs();
};
const updateFormulaResultPreview = async () => {
  if (!formulaResultValue) return;
  // Disable live preview fetch to avoid burst API calls while editing form fields.
  formulaTerms = buildFormulaFromInputs();
  formulaResultValue.value = "-";
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
const mergeMetersByKey = (...groups) => {
  const merged = [];
  const seen = new Set();
  groups.forEach((group) => {
    if (!Array.isArray(group)) return;
    group.forEach((meter) => {
      if (!meter || typeof meter !== "object") return;
      const stableKey = getMeterKey(meter) || `${meter.name || ""}|${meter.sn || ""}`;
      if (!stableKey || seen.has(stableKey)) return;
      seen.add(stableKey);
      merged.push(meter);
    });
  });
  return merged;
};
const getMetersFromFormulaColumns = (drafts, meterPool = meterProfiles) => {
  const safePool = Array.isArray(meterPool) ? meterPool.filter(Boolean) : [];
  if (!safePool.length) return [];
  const columns = sanitizeFormulaColumnDrafts(drafts);
  if (!columns.length) return [];
  const meterByKey = new Map(
    safePool.map((meter) => [getMeterKey(meter), meter]).filter(([key]) => key)
  );
  const pickMeter = (meterKey) => {
    const key = String(meterKey || "").trim();
    if (!key) return null;
    if (meterByKey.has(key)) return meterByKey.get(key) || null;
    return safePool.find((meter) => String(meter?.name || "").trim() === key) || null;
  };
  const picked = [];
  columns.forEach((column) => {
    if (column.type === "calc") {
      picked.push(pickMeter(column.leftMeterKey));
      picked.push(pickMeter(column.rightMeterKey));
      return;
    }
    picked.push(pickMeter(column.meterKey));
  });
  return mergeMetersByKey(picked);
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
  resetFormulaColumnDraftBoxes();
  updateScheduleInfo(schedule.cutoffDay);
};
const hideReceiptHistory = () => {
  receiptHistory?.classList.add("hidden");
};
const buildReceiptHtml = ({
  bill,
  issueDate,
  rowsPerPage = 32
}) => {
  const meterPool = Array.isArray(bill?.meters) ? bill.meters : [];
  const formulaTerms = Array.isArray(bill?.calcFormula) && bill.calcFormula.length
    ? normalizeCalcFormula(bill.calcFormula, meterPool, false)
    : normalizeCalcFormula(
      buildLegacyFormula(bill?.calcMethod || defaultSchedule.calcMethod, meterPool),
      meterPool,
      false
    );
  const formulaColumnDrafts = sanitizeFormulaColumnDrafts(
    bill?.formulaColumns || bill?.columnDrafts || bill?.calcColumns
  );
  const leftTerm = formulaTerms[0] || null;
  const rightTerm = formulaTerms[1] || null;
  const legacyFormulaColumns = Boolean(leftTerm && rightTerm);
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
  const buildTerm = (meterKey, field) => {
    const key = String(meterKey || "").trim();
    const meter = meterPool.find((item) => getMeterKey(item) === key) || null;
    return {
      meterKey: key,
      meterName: meter?.name || "",
      field: normalizeFormulaFieldKey(field)
    };
  };
  const calculateDraftColumnValue = (row, column) => {
    if (column.type === "basic") {
      return roundTo(getFormulaTermValue(row, column.term), 1);
    }
    const leftValue = getFormulaTermValue(row, column.leftTerm);
    const rightValue = getFormulaTermValue(row, column.rightTerm);
    if (column.operator === "+") return roundTo(leftValue + rightValue, 1);
    if (column.operator === "-") return roundTo(leftValue - rightValue, 1);
    if (column.operator === "*") return roundTo(leftValue * rightValue, 1);
    if (column.operator === "/") {
      if (Math.abs(rightValue) < 1e-9) return 0;
      return roundTo(leftValue / rightValue, 1);
    }
    return roundTo(leftValue, 1);
  };
  const formulaColumnDefs = formulaColumnDrafts.map((draft, index) => {
    if (draft.type === "calc") {
      const leftTerm = buildTerm(draft.leftMeterKey, draft.leftField);
      const rightTerm = buildTerm(draft.rightMeterKey, draft.rightField);
      const leftLabel = getTermHeaderLabel(leftTerm, "ค่าที่ใช้คำนวณ");
      const rightLabel = getTermHeaderLabel(rightTerm, "ค่าที่ใช้คำนวณ");
      const expression = `${leftLabel} ${draft.operator} ${rightLabel}`;
      const header = draft.name || `คำนวณ ${index + 1}`;
      return {
        type: "calc",
        header,
        title: expression,
        include: draft.include !== false,
        operator: draft.operator,
        leftTerm,
        rightTerm
      };
    }
    const term = buildTerm(draft.meterKey, draft.field);
    const fallbackTitle = getTermHeaderLabel(term, "ค่าที่ใช้คำนวณ");
    const header = draft.name || fallbackTitle;
    return {
      type: "basic",
      header,
      title: fallbackTitle,
      include: draft.include !== false,
      term
    };
  });
  const useDraftColumns = formulaColumnDefs.length > 0;
  const showFormulaColumns = !useDraftColumns && legacyFormulaColumns;
  const showUsageColumn = !useDraftColumns;
  const dailyRows = [...(bill.daily || [])]
    .filter((row) => row?.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((row) => {
      const leftValue = leftTerm ? getFormulaTermValue(row, leftTerm) : null;
      const rightValue = rightTerm ? getFormulaTermValue(row, rightTerm) : null;
      const draftValues = useDraftColumns
        ? formulaColumnDefs.map((column) => calculateDraftColumnValue(row, column))
        : [];
      const units = useDraftColumns || showFormulaColumns
        ? parseNumber(row.bill_units)
        : leftTerm
          ? parseNumber(leftValue)
          : parseNumber(row.bill_units);
      return {
        date: row.date,
        units,
        leftValue: showFormulaColumns ? leftValue : null,
        rightValue: showFormulaColumns ? rightValue : null,
        draftValues
      };
    });
  const draftColumnTotals = useDraftColumns
    ? formulaColumnDefs.map((_, index) =>
      roundTo(
        dailyRows.reduce((sum, row) => sum + parseNumber(row.draftValues[index]), 0),
        1
      )
    )
    : [];
  const leftColumnTotal = showFormulaColumns
    ? roundTo(dailyRows.reduce((sum, row) => sum + parseNumber(row.leftValue), 0), 1)
    : 0;
  const rightColumnTotal = showFormulaColumns
    ? roundTo(dailyRows.reduce((sum, row) => sum + parseNumber(row.rightValue), 0), 1)
    : 0;
  const totalKwh = roundTo(
    dailyRows.reduce((sum, row) => sum + row.units, 0),
    1
  );
  const rate = parseNumber(bill.rate);
  const plantName = readText(bill?.plantName, plant?.name) || "PONIX";
  const creatorLabel = getBillCreatorLabel(bill);
  const issueLabel = formatThaiDateShort(issueDate);
  const periodLabel =
    bill?.periodStart && bill?.periodEnd
      ? `${formatThaiDateShort(bill.periodStart)} - ${formatThaiDateShort(
        bill.periodEnd
      )}`
      : formatThaiMonthYear(issueDate);
  const billCode = `ST-${String(bill.billNo).padStart(6, "0")}`;
  const buildMetaLineHtml = (label, value) =>
    `<div class="meta-line"><span class="meta-label">${escapeHtml(label)}</span><span class="meta-value">${escapeHtml(
      value
    )}</span></div>`;
  const companyMetaHtml = [
    buildMetaLineHtml("บริษัท", plantName),
    buildMetaLineHtml("เลขที่บิล", billCode),
    buildMetaLineHtml("ผู้สร้าง", creatorLabel)
  ].join("");
  const periodMetaHtml = [
    buildMetaLineHtml("ช่วงบิล", periodLabel),
    buildMetaLineHtml("วันที่ออกรายงาน", issueLabel),
    buildMetaLineHtml("อัตรา", `${formatNumber(rate, rateDecimalPlaces)} บาท/kWh`)
  ].join("");
  const requestedRowsPerPage = Math.max(1, rowsPerPage - 1);
  const dataRowsPerPage =
    dailyRows.length <= maxBillPeriodDays
      ? Math.max(maxBillPeriodDays, requestedRowsPerPage)
      : requestedRowsPerPage;
  const pageCount = Math.max(1, Math.ceil(dailyRows.length / dataRowsPerPage));
  const buildTotalRowHtml = () => `
    <tr class="total-row">
      <td class="date-cell">รวม</td>
      ${useDraftColumns
    ? draftColumnTotals
      .map((value) => `<td class="num-cell">${formatNumber(value, 1)}</td>`)
      .join("")
    : showFormulaColumns
      ? `<td class="num-cell">${formatNumber(leftColumnTotal, 1)}</td>
           <td class="op-cell">=</td>
           <td class="num-cell">${formatNumber(rightColumnTotal, 1)}</td>`
      : ""}
      ${showUsageColumn ? `<td class="num-cell">${formatNumber(totalKwh, 1)}</td>` : ""}
    </tr>
  `;
  const buildRowsHtml = (rows, { includeTotalRow = false } = {}) => {
    const rowsHtml = rows
      .map((row) => {
        const rowDate = parseDateInput(row.date);
        const dayOfWeek = rowDate ? rowDate.getDay() : -1;
        const weekendClass =
          dayOfWeek === 6 ? "weekend-sat" : dayOfWeek === 0 ? "weekend-sun" : "";
        return `
        <tr${weekendClass ? ` class="${weekendClass}"` : ""}>
          <td class="date-cell">${formatThaiDateShort(row.date)}</td>
          ${useDraftColumns
      ? row.draftValues
        .map((value) => `<td class="num-cell">${formatNumber(value, 1)}</td>`)
        .join("")
      : showFormulaColumns
        ? `<td class="num-cell">${formatNumber(row.leftValue, 1)}</td>
             <td class="op-cell">${escapeHtml(formulaOperator)}</td>
             <td class="num-cell">${formatNumber(row.rightValue, 1)}</td>`
        : ""}
          ${showUsageColumn ? `<td class="num-cell">${formatNumber(row.units, 1)}</td>` : ""}
        </tr>
      `;
      })
      .join("");
    return includeTotalRow ? `${rowsHtml}${buildTotalRowHtml()}` : rowsHtml;
  };
  const termOneDetail = getTermDetail(leftTerm, "ค่าที่ใช้คำนวณ 1");
  const termTwoDetail = getTermDetail(rightTerm, "ค่าที่ใช้คำนวณ 2");
  const termOneHeader = getTermHeaderLabel(leftTerm, "ค่าที่ใช้คำนวณ 1");
  const termTwoHeader = getTermHeaderLabel(rightTerm, "ค่าที่ใช้คำนวณ 2");
  const usageHeaderText = "พลังงานที่ใช้ (kWh)";
  const usageHeaderTitle = useDraftColumns
    ? "พลังงานที่ใช้สำหรับคิดบิล"
    : showFormulaColumns
      ? "พลังงานที่ใช้หลังคำนวณ"
      : leftTerm
        ? termOneHeader
        : usageHeaderText;
  const formulaOperator =
    showFormulaColumns && formulaOperators.includes(rightTerm?.operator)
      ? rightTerm.operator
      : "-";
  const summaryColumns = useDraftColumns
    ? formulaColumnDefs.map((column, index) => ({
      label: column.header || `คอลัมน์ ${index + 1}`,
      total: draftColumnTotals[index],
      included: column.include !== false
    }))
    : showFormulaColumns
      ? [
        { label: termOneHeader, total: leftColumnTotal, included: true },
        { label: termTwoHeader, total: rightColumnTotal, included: true },
        { label: usageHeaderText, total: totalKwh, included: true }
      ]
      : [{ label: usageHeaderText, total: totalKwh, included: true }];
  const summaryColumnItems = summaryColumns.map((column) => {
    const total = parseNumber(column.total);
    const amount = roundTo(total * rate, 2);
    return {
      ...column,
      total,
      amount
    };
  });
  const totalAmount = roundTo(
    summaryColumnItems.reduce(
      (sum, item) => sum + (item.included ? parseNumber(item.amount) : 0),
      0
    ),
    2
  );
  const summaryBreakdownHtml = summaryColumnItems
    .map((column) => {
      return `<div class="row breakdown${column.included ? "" : " is-excluded"}">
        <span class="summary-expression">
          <span class="summary-label">${escapeHtml(column.label)}</span>
          <span class="summary-calc">${formatNumber(column.total, 1)} × ${formatNumber(
        rate,
        rateDecimalPlaces
      )}</span>
        </span>
        <span class="summary-amount">${formatNumber(column.amount, 2)} บาท</span>
      </div>`;
    })
    .join("");
  const summaryHtml = `
    <div class="receipt-summary simple">
      <div class="box">
        ${summaryBreakdownHtml}
        <div class="row total"><span class="summary-expression">ยอดรวมทั้งสิ้น</span><span class="summary-amount">${formatNumber(
          totalAmount,
          2
        )} บาท</span></div>
      </div>
    </div>
  `;
  const draftValueColumnWidth = formulaColumnDefs.length
    ? (78 / formulaColumnDefs.length).toFixed(2)
    : "78.00";
  const colgroupHtml = useDraftColumns
    ? `<colgroup>
            <col style="width:22%">
            ${formulaColumnDefs
      .map(() => `<col style="width:${draftValueColumnWidth}%">`)
      .join("")}
          </colgroup>`
    : showFormulaColumns
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
  const draftHeadHtml = useDraftColumns
    ? formulaColumnDefs
      .map(
        (column) =>
          `<th class="num-cell" title="${escapeHtml(column.title)}">${escapeHtml(column.header)}</th>`
      )
      .join("")
    : "";
  const formulaHeadHtml = showFormulaColumns
    ? `<th class="num-cell" title="${escapeHtml(termOneDetail)}">${escapeHtml(
      termOneHeader
    )}</th>
               <th class="op-cell" title="เครื่องหมาย">${escapeHtml(formulaOperator)}</th>
               <th class="num-cell" title="${escapeHtml(termTwoDetail)}">${escapeHtml(
      termTwoHeader
    )}</th>`
    : "";
  const weekendLegendHtml = `
    <div class="receipt-weekend-legend" aria-label="คำอธิบายสีวันเสาร์และอาทิตย์">
      <span class="legend-item sat"><span class="legend-swatch"></span>วันเสาร์</span>
      <span class="legend-item sun"><span class="legend-swatch"></span>วันอาทิตย์</span>
    </div>
  `;
  const buildPage = (rows, pageIndex) => `
    <div class="receipt-paper" data-days="${dailyRows.length}" data-page="${pageIndex + 1}" data-pages="${pageCount}">
      <div class="receipt-title">
        <h2>รายงานบิลพลังงาน</h2>
        <p>Billing Report</p>
      </div>
      <div class="receipt-meta">
        <div class="box">
          <strong>ข้อมูลบริษัท</strong>
          ${companyMetaHtml}
        </div>
        <div class="box">
          <strong>รายละเอียดงวด</strong>
          ${periodMetaHtml}
        </div>
      </div>
      <div class="receipt-divider"></div>
      ${weekendLegendHtml}
      <div class="receipt-table-area">
        <table class="receipt-table receipt-usage-table">
          ${colgroupHtml}
          <thead>
            <tr>
              <th class="date-cell">วันที่</th>
              ${useDraftColumns ? draftHeadHtml : formulaHeadHtml}
              ${showUsageColumn ? `<th class="num-cell" title="${escapeHtml(usageHeaderTitle)}">${escapeHtml(
      usageHeaderText
    )}</th>` : ""}
            </tr>
          </thead>
          <tbody>
            ${buildRowsHtml(rows, { includeTotalRow: pageIndex === pageCount - 1 })}
          </tbody>
        </table>
      </div>
      ${pageIndex === pageCount - 1 ? summaryHtml : ""}
      <div class="receipt-power-note">Powered By Devonix</div>
    </div>
  `;
  return Array.from({ length: pageCount }, (_, pageIndex) => {
    const start = pageIndex * dataRowsPerPage;
    const pageRows = dailyRows.slice(start, start + dataRowsPerPage);
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
  currentReceiptTitle = `Billing Report ${bill.billNo} ${formatMonth(issueDate)}`;
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
  const printDocumentTitle = "";
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
        <title>${printDocumentTitle}</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${printableStyles}
      </head>
      <body class="pdf-view">${currentReceiptHtml}</body>
    </html>
  `);
  win.document.close();
  try {
    win.history.replaceState({}, "", "/");
  } catch {
    // ignore history state failures in popup contexts
  }

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
    const imagePromises = Array.from(win.document.images || []).map(
      (image) =>
        new Promise((resolve) => {
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            resolve();
          };
          if (image.complete) {
            done();
            return;
          }
          image.addEventListener("load", done, { once: true });
          image.addEventListener("error", done, { once: true });
          setTimeout(done, 2000);
        })
    );
    const fontsPromise =
      win.document.fonts && win.document.fonts.ready
        ? win.document.fonts.ready.catch(() => undefined)
        : Promise.resolve();
    return Promise.all([...stylesheetPromises, ...imagePromises, fontsPromise]);
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
  formulaColumns: [],
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
const billingCacheResetVersionKey = "billingCacheResetV20260224R1";
const billingStoragePrefixes = [
  "billingHistory",
  "billingSchedule",
  "billingSequence"
];
const clearBillingStorageOnce = () => {
  try {
    if (localStorage.getItem(billingCacheResetVersionKey) === "done") return;
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key) keys.push(key);
    }
    keys.forEach((key) => {
      const shouldRemove = billingStoragePrefixes.some(
        (prefix) => key === prefix || key.startsWith(`${prefix}:`)
      );
      if (shouldRemove) {
        localStorage.removeItem(key);
      }
    });
    localStorage.setItem(billingCacheResetVersionKey, "done");
  } catch {
    // ignore storage access errors
  }
};

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
    formulaColumns: sanitizeFormulaColumnDrafts(fallback?.formulaColumns),
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
    defaultRate: Number.isFinite(rate)
      ? roundTo(rate, rateDecimalPlaces)
      : defaultSchedule.defaultRate,
    rateType: raw?.rateType || fallbackFields.rateType,
    calcMethod: raw?.calcMethod || fallbackFields.calcMethod,
    calcFormula: Array.isArray(raw?.calcFormula) ? raw.calcFormula : fallbackFields.calcFormula,
    calcLabel:
      typeof raw?.calcLabel === "string" && raw.calcLabel.trim()
        ? raw.calcLabel.trim()
        : fallbackFields.calcLabel,
    formulaColumns: sanitizeFormulaColumnDrafts(raw?.formulaColumns || fallbackFields.formulaColumns),
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
  schedule.formulaColumns = normalizedTop.formulaColumns;
  schedule.detailColumns = normalizedTop.detailColumns;

  const hasExplicitAutoSchedules = Array.isArray(schedule.autoSchedules);
  const rawAutoSchedules = hasExplicitAutoSchedules ? schedule.autoSchedules : [];
  const sourceSchedules = hasExplicitAutoSchedules
    ? rawAutoSchedules
    : [
      {
        cutoffDay: schedule.cutoffDay,
        defaultRate: schedule.defaultRate,
        rateType: schedule.rateType,
        calcMethod: schedule.calcMethod,
        calcFormula: schedule.calcFormula,
        calcLabel: schedule.calcLabel,
        formulaColumns: schedule.formulaColumns,
        detailColumns: schedule.detailColumns
      }
    ];
  const byCutoffDay = new Map();
  sourceSchedules.forEach((item) => {
    const normalized = normalizeAutoScheduleEntry(item, schedule);
    byCutoffDay.set(normalized.cutoffDay, normalized);
  });
  if (!byCutoffDay.size && !hasExplicitAutoSchedules) {
    const fallback = normalizeAutoScheduleEntry(
      { cutoffDay: defaultSchedule.cutoffDay },
      defaultSchedule
    );
    byCutoffDay.set(fallback.cutoffDay, fallback);
  }
  schedule.autoSchedules = Array.from(byCutoffDay.values()).sort(
    (a, b) => Number(a.cutoffDay) - Number(b.cutoffDay)
  );
  if (!schedule.autoSchedules.length) {
    schedule.cutoffDay = defaultSchedule.cutoffDay;
    return;
  }
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
    autoRoundModalTitle.textContent = `ประวัติการออกบิลอัตโนมัติ. • รอบวันที่ ${day} (${records.length} ใบ)`;
  }
  if (!records.length) {
    autoRoundModalRows.innerHTML =
      '<tr><td class="empty" colspan="6">ยังไม่มีประวัติการออกบิลรอบนี้</td></tr>';
  } else {
    autoRoundModalRows.innerHTML = records
      .map((bill) => {
        const displayTotals = getBillDisplayTotals(bill);
        const creatorLabel = getBillCreatorLabel(bill);
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
            <td>${formatNumber(displayTotals.totalKwh, 1)}</td>
            <td>${formatCurrency(displayTotals.amount)}</td>
            <td><div>${createdLabel}</div><div class="auto-created-by">${escapeHtml(creatorLabel)}</div></td>
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
const closeAutoQueueActionMenus = () => {
  billQueueRows?.querySelectorAll(".auto-queue-menu").forEach((menu) => {
    menu.classList.add("hidden");
  });
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
      const menuItems = [
        `<button class="meter-row-menu-item" data-action="edit-schedule" data-cutoff="${cutoffDay}" type="button">แก้ไขรอบนี้</button>`
      ];
      if (canDeleteAutoSchedules()) {
        menuItems.push(
          `<button class="meter-row-menu-item danger" data-action="delete-schedule" data-cutoff="${cutoffDay}" type="button">ลบรอบนี้</button>`
        );
      }
      return `
        <tr>
          <td>${cutoffDay}</td>
          <td>${escapeHtml(updatedAtLabel)}</td>
          <td>ตัดรอบวันที่ ${cutoffDay} • อัตรา ฿${formatNumber(
        autoConfig.defaultRate,
        rateDecimalPlaces
      )}/kWh • ${escapeHtml(rateTypeLabel)}</td>
          <td><span class="queue-status ready">${billCount} ใบ</span></td>
          <td>
            <div class="history-actions auto-queue-actions">
              <button class="small-btn" data-action="view-history" data-cutoff="${cutoffDay}" type="button">ดูประวัติรอบนี้</button>
              <button class="small-btn meter-row-edit auto-queue-menu-toggle" data-action="toggle-schedule-menu" data-cutoff="${cutoffDay}" type="button" aria-label="จัดการรอบนี้" title="จัดการรอบนี้">⋯</button>
              <div class="meter-row-menu auto-queue-menu hidden">
                ${menuItems.join("")}
              </div>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
  billQueueRows
    .querySelectorAll("button[data-action='view-history']")
    .forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        closeAutoQueueActionMenus();
        const cutoffDay = Number(btn.getAttribute("data-cutoff"));
        if (!Number.isFinite(cutoffDay) || cutoffDay < 1) return;
        openAutoRoundHistoryModal(cutoffDay);
      });
    });
  billQueueRows
    .querySelectorAll("button[data-action='toggle-schedule-menu']")
    .forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        const container = btn.closest(".auto-queue-actions");
        const targetMenu = container?.querySelector(".auto-queue-menu");
        if (!targetMenu) return;
        const shouldOpen = targetMenu.classList.contains("hidden");
        closeAutoQueueActionMenus();
        targetMenu.classList.toggle("hidden", !shouldOpen);
      });
    });
  billQueueRows
    .querySelectorAll("button[data-action='edit-schedule']")
    .forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        closeAutoQueueActionMenus();
        const cutoffDay = Number(btn.getAttribute("data-cutoff"));
        if (!Number.isFinite(cutoffDay) || cutoffDay < 1) return;
        openAutoScheduleEditor(cutoffDay);
      });
    });
  billQueueRows
    .querySelectorAll("button[data-action='delete-schedule']")
    .forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        closeAutoQueueActionMenus();
        const cutoffDay = Number(btn.getAttribute("data-cutoff"));
        if (!Number.isFinite(cutoffDay) || cutoffDay < 1) return;
        deleteAutoSchedule(cutoffDay);
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
  billAutoPreview.textContent = `บิลจะสรุปที่วันที่ ${selectedCutoffDay} ของเดือนนั้นๆ แบบอัตโนมัติ`;
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
      formulaColumns: getFormulaColumnDraftsFromInputs(),
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
  setFormulaColumnDrafts(active.formulaColumns || []);
  ensureFormulaColumnDraftBox();
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
const buildFormulaColumnTerm = (meterKey, field, meterPool = []) => {
  const key = String(meterKey || "").trim();
  const matchedMeter =
    (Array.isArray(meterPool) ? meterPool : []).find((meter) => {
      const candidateKey = getMeterKey(meter);
      if (key && candidateKey && candidateKey === key) return true;
      if (key && String(meter?.name || "").trim() === key) return true;
      return false;
    }) || null;
  return {
    meterKey: String(key || getMeterKey(matchedMeter) || "").trim(),
    meterName: matchedMeter?.name || "",
    field: normalizeFormulaFieldKey(field)
  };
};
const getFormulaColumnValue = (row, column) => {
  if (!column || typeof column !== "object") return 0;
  if (column.type === "basic") {
    return roundTo(getFormulaTermValue(row, column.term), 1);
  }
  const leftValue = getFormulaTermValue(row, column.leftTerm);
  const rightValue = getFormulaTermValue(row, column.rightTerm);
  if (column.operator === "+") return roundTo(leftValue + rightValue, 1);
  if (column.operator === "-") return roundTo(leftValue - rightValue, 1);
  if (column.operator === "*") return roundTo(leftValue * rightValue, 1);
  if (column.operator === "/") {
    if (Math.abs(rightValue) < 1e-9) return 0;
    return roundTo(leftValue / rightValue, 1);
  }
  return roundTo(leftValue, 1);
};
const calculateFormulaColumnBillTotals = ({
  dailyRows,
  formulaColumns,
  meterPool,
  rate
}) => {
  const columns = sanitizeFormulaColumnDrafts(formulaColumns);
  if (!columns.length) return null;
  const safeRows = Array.isArray(dailyRows) ? dailyRows : [];
  if (!safeRows.length) return null;
  const safeMeters = Array.isArray(meterPool) ? meterPool.filter(Boolean) : [];
  const billRate = parseNumber(rate);
  const columnDefs = columns.map((column) => {
    if (column.type === "calc") {
      return {
        type: "calc",
        include: column.include !== false,
        operator: column.operator,
        leftTerm: buildFormulaColumnTerm(column.leftMeterKey, column.leftField, safeMeters),
        rightTerm: buildFormulaColumnTerm(column.rightMeterKey, column.rightField, safeMeters)
      };
    }
    return {
      type: "basic",
      include: column.include !== false,
      term: buildFormulaColumnTerm(column.meterKey, column.field, safeMeters)
    };
  });
  const includedColumnDefs = columnDefs.filter((column) => column.include !== false);
  if (!includedColumnDefs.length) {
    return {
      totalKwh: 0,
      amount: 0
    };
  }
  const columnTotals = includedColumnDefs.map((column) =>
    roundTo(
      safeRows.reduce((sum, row) => sum + parseNumber(getFormulaColumnValue(row, column)), 0),
      1
    )
  );
  const totalKwh = roundTo(
    columnTotals.reduce((sum, total) => sum + parseNumber(total), 0),
    1
  );
  const amount = roundTo(
    columnTotals.reduce(
      (sum, total) => sum + roundTo(parseNumber(total) * billRate, 2),
      0
    ),
    2
  );
  return {
    totalKwh,
    amount
  };
};
const getBillDisplayTotals = (bill) => {
  const baseTotalKwh = roundTo(parseNumber(bill?.totalKwh), 1);
  const baseAmount = roundTo(parseNumber(bill?.amount), 2);
  const meterPool = Array.isArray(bill?.meters) ? bill.meters : [];
  const calculated = calculateFormulaColumnBillTotals({
    dailyRows: Array.isArray(bill?.daily) ? bill.daily : [],
    formulaColumns: bill?.formulaColumns || bill?.columnDrafts || bill?.calcColumns,
    meterPool,
    rate: bill?.rate
  });
  if (!calculated) {
    return {
      totalKwh: baseTotalKwh,
      amount: baseAmount
    };
  }
  return calculated;
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
  formulaColumns,
  cutoffDay,
  detailColumns,
  dailyRows,
  auto = false,
  source = "api",
  createdAt = Date.now()
}) => {
  const meterPool = Array.isArray(meters) ? meters.filter(Boolean) : [];
  const creator = getCurrentCreatorSnapshot();
  const plantSnapshot = getCurrentPlantSnapshot();
  const billRate = roundTo(parseNumber(rate), rateDecimalPlaces);
  const normalizedColumns =
    Array.isArray(detailColumns) && detailColumns.length
      ? detailColumns
      : defaultSchedule.detailColumns;
  const normalizedFormula = normalizeCalcFormula(calcFormula, meterPool);
  const normalizedFormulaColumns = sanitizeFormulaColumnDrafts(formulaColumns);
  const safeRows = Array.isArray(dailyRows) ? dailyRows : [];
  const daily = safeRows.map((row) => ({
    ...row,
    bill_units: getBillUnits(row, calcMethod, normalizedFormula)
  }));
  let totalKwh = roundTo(
    daily.reduce((sum, row) => sum + (row.bill_units || 0), 0),
    1
  );
  let amount = roundTo(totalKwh * billRate, 2);
  const draftColumnTotals = calculateFormulaColumnBillTotals({
    dailyRows: daily,
    formulaColumns: normalizedFormulaColumns,
    meterPool,
    rate: billRate
  });
  if (draftColumnTotals) {
    totalKwh = draftColumnTotals.totalKwh;
    amount = draftColumnTotals.amount;
  }
  billSequence += 1;
  const bill = {
    id: `${createdAt}-${billSequence}`,
    billNo: billSequence,
    createdAt,
    plantName: plantSnapshot.name,
    plantApiId: plantSnapshot.apiId,
    plantSiteCode: plantSnapshot.siteCode,
    createdBy: creator,
    createdById: creator.id,
    createdByName: creator.name,
    createdByEmail: creator.email,
    createdByRole: creator.role,
    periodStart,
    periodEnd,
    rate: billRate,
    rateType: rateType || schedule.rateType,
    totalKwh,
    amount,
    auto,
    calcMethod,
    calcFormula: normalizedFormula,
    calcLabel: (calcLabel || defaultCalcLabel).trim(),
    formulaColumns: normalizedFormulaColumns,
    cutoffDay: cutoffDay || schedule.cutoffDay || defaultSchedule.cutoffDay,
    detailColumns: normalizedColumns,
    source,
    meters: meterPool.map((meter) => ({ ...meter })),
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
      const formulaMeters = getMetersFromFormula(displayFormula, meterPool);
      const formulaColumnMeters = getMetersFromFormulaColumns(
        bill.formulaColumns || bill.columnDrafts || bill.calcColumns,
        meterPool
      );
      const displayMeters = mergeMetersByKey(formulaMeters, formulaColumnMeters);
      const meterText = displayMeters
        .map((meter) => meter?.name || meter?.sn || "")
        .filter((name) => String(name || "").trim())
        .join(", ");
      const displayTotals = getBillDisplayTotals(bill);
      const creatorLabel = getBillCreatorLabel(bill);
      const badgeLabel = bill.auto ? "อัตโนมัติ" : "กำหนดวัน";
      const badgeClass = bill.auto ? "auto" : "manual";
      const manualIssueDate = getManualIssueDate(bill);
      const manualIssueDateStr = manualIssueDate
        ? formatDate(manualIssueDate)
        : bill.periodEnd || bill.periodStart || "";
      const actionButtons = bill.auto
        ? `<button class="ghost small-btn" data-action="receipt" data-id="${bill.id}" type="button">ประวัติรายงาน</button>
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
            <div class="period-meta">ผู้สร้าง: ${escapeHtml(creatorLabel)}</div>
          </td>
          <td>${formatNumber(bill.rate, rateDecimalPlaces)}</td>
          <td>${formatNumber(displayTotals.totalKwh, 1)}</td>
          <td>${formatCurrency(displayTotals.amount)}</td>
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
      ? `ประวัติรายงานบิล • ใบที่ ${bill.billNo} • ออกทุกวันที่ ${cutoffDay}`
      : `ประวัติรายงานบิล • ใบที่ ${bill.billNo} • ออกครั้งเดียว (กำหนดวัน)`;
  }
  if (!dates.length) {
    receiptRows.innerHTML =
      '<tr><td class="empty" colspan="5">ยังไม่มีประวัติรายงานบิล</td></tr>';
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
          alert(`ดาวน์โหลดรายงานบิล เดือน ${date || ""}`);
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
  const latestTotals = getBillDisplayTotals(latest);
  if (billLastPeriod)
    billLastPeriod.textContent = `${latest.periodStart} - ${latest.periodEnd}`;
  if (billLastAmount) billLastAmount.textContent = formatCurrency(latestTotals.amount);
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
const openAutoScheduleEditor = (cutoffDay) => {
  const targetDay = Number(cutoffDay);
  if (!Number.isFinite(targetDay) || targetDay < 1) return;
  if (!getAutoScheduleByCutoff(targetDay)) return;
  closeAutoQueueActionMenus();
  openModal("auto");
  if (billCutoff) {
    billCutoff.value = String(targetDay);
  }
  applyAutoScheduleToModal(targetDay);
};
const deleteAutoSchedule = (cutoffDay) => {
  if (!canDeleteAutoSchedules()) {
    alert("เฉพาะ Super Admin เท่านั้นที่ลบรอบอัตโนมัติได้");
    return;
  }
  const targetDay = Number(cutoffDay);
  if (!Number.isFinite(targetDay) || targetDay < 1) return;
  const targetSchedule = getAutoScheduleByCutoff(targetDay);
  if (!targetSchedule) return;
  const ok = confirm(`ต้องการลบรอบอัตโนมัติวันที่ ${targetDay} ใช่หรือไม่?`);
  if (!ok) return;
  schedule.autoSchedules = getAutoSchedules().filter(
    (item) => Number(item?.cutoffDay) !== targetDay
  );
  if (!schedule.autoSchedules.length) {
    schedule.cutoffDay = defaultSchedule.cutoffDay;
  } else if (!getAutoScheduleByCutoff(schedule.cutoffDay)) {
    schedule.cutoffDay = Number(schedule.autoSchedules[0]?.cutoffDay) || defaultSchedule.cutoffDay;
  }
  saveSchedule();
  updateScheduleInfo(schedule.cutoffDay);
  updateAutoPreviewText();
  renderAutoQueue();
  updateSummary();
  if (isModalOpen && billMode === "auto") {
    applyAutoScheduleToModal(schedule.cutoffDay);
  }
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
    // Allow catch-up on/after cutoff day (not only exactly on that day).
    if (today.getDate() < effectiveDay) continue;
    const runDate = new Date(today.getFullYear(), today.getMonth(), effectiveDay);
    const { start, end } = getAutoPeriodForRunDate(runDate, cutoffDay);
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
    const formulaColumnMeters = getMetersFromFormulaColumns(
      autoConfig.formulaColumns || [],
      meterProfiles
    );
    const selectedMeters = mergeMetersByKey(formulaMeters, formulaColumnMeters);
    createBill({
      periodStart: startStr,
      periodEnd: endStr,
      meters: selectedMeters,
      rate: autoConfig.defaultRate,
      rateType: autoConfig.rateType,
      calcMethod: autoConfig.calcMethod || defaultSchedule.calcMethod,
      calcFormula,
      calcLabel: autoConfig.calcLabel || defaultCalcLabel,
      formulaColumns: autoConfig.formulaColumns || [],
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
  const targetMode = mode === "auto" ? "auto" : "manual";
  billModal.classList.remove("hidden");
  isModalOpen = true;
  resetFormulaColumnDraftBoxes();
  setDefaultRange(schedule.cutoffDay);
  if (billRateInput) billRateInput.value = schedule.defaultRate;
  if (billType && schedule.rateType) billType.value = schedule.rateType;
  renderColumnSelector(schedule.detailColumns);
  if (targetMode === "auto") {
    formulaTerms = getFormulaForContext(
      schedule.calcFormula,
      schedule.calcMethod,
      getSelectedMetersForFormula()
    );
    setCalcInputMode(inferCalcInputMode(formulaTerms, meterProfiles), {
      skipPreview: true
    });
    populateFormulaInputs(formulaTerms, schedule.calcLabel || defaultCalcLabel);
    setFormulaColumnDrafts(schedule.formulaColumns || []);
    ensureFormulaColumnDraftBox();
  } else {
    setCalcInputMode("single", {
      skipPreview: true,
      resetInputs: true
    });
  }
  setBillMode(targetMode);
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
  const formulaColumns = getFormulaColumnDraftsFromInputs();
  const calcFormula = getFormulaFromInputs();
  if (!calcFormula.length && !formulaColumns.length) {
    alert("กรุณากำหนดสูตรคำนวณอย่างน้อย 1 พจน์ หรือเพิ่มคอลัมน์คำนวณ");
    return;
  }
  const calcLabel = getFormulaResultName();
  const calcMethod = inferCalcMethodFromFormula(calcFormula);
  const formulaMeters = getMetersFromFormula(calcFormula, selectedMeterPool);
  const formulaColumnMeters = getMetersFromFormulaColumns(
    formulaColumns,
    selectedMeterPool
  );
  const selectedMeters = mergeMetersByKey(formulaMeters, formulaColumnMeters);
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
      formulaColumns,
      detailColumns
    };
    const savedAutoSchedule = upsertAutoSchedule({
      cutoffDay,
      defaultRate: rateVal,
      rateType: rateTypeVal,
      calcMethod,
      calcFormula,
      calcLabel,
      formulaColumns,
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
      }\nระบบจะรันทุกเดือนวันที่ ${savedAutoSchedule.cutoffDay}\nรอบถัดไป: ${formatDate(
        runDate
      )}\nช่วงบิลรอบถัดไป: ${startStr} - ${endStr}\nวันที่ตัดรอบที่ตั้งไว้: ${allDays}`
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
  const daySpanMs =
    Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) -
    Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const selectedPeriodDays = Math.floor(daySpanMs / 86400000);
  if (selectedPeriodDays > maxBillPeriodDays) {
    alert(`ช่วงวันที่ออกบิลได้สูงสุด ${maxBillPeriodDays} วัน`);
    return;
  }

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
    formulaColumns,
    cutoffDay: schedule.cutoffDay || defaultSchedule.cutoffDay,
    detailColumns,
    auto: false,
    source,
    dailyRows: rows
  });

  schedule = {
    ...schedule,
    ...buildDefaultScheduleFields()
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
    )} kWh x ฿${formatNumber(bill.rate, rateDecimalPlaces)} = ${formatCurrency(bill.amount)}`
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
document.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof Element && target.closest(".auto-queue-actions")) return;
  closeAutoQueueActionMenus();
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
  setCalcInputMode("single", { resetInputs: true });
});
calcModeFormulaBtn?.addEventListener("click", () => {
  setCalcInputMode("formula", { resetInputs: true });
});
calcModeResetBtn?.addEventListener("click", () => {
  setCalcInputMode(calcInputMode, { resetInputs: true });
});
formulaAddColumnBtn?.addEventListener("click", () => {
  addFormulaColumnDraftBox();
});
formulaAddCalcColumnBtn?.addEventListener("click", () => {
  addFormulaCalcColumnDraftBox();
});
formulaRemoveColumnBtn?.addEventListener("click", () => {
  removeFormulaColumnDraftBox();
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

clearBillingStorageOnce();
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
