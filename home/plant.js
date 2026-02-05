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
const billPlant = null;
const billMeters = null;
const billPeriod = null;
const billEnergy = null;
const billAmount = null;
const billNote = null;
const billRowsEl = document.getElementById("bill-rows");
const billRunNowBtn = null;
const billNewBtn = document.getElementById("bill-new-btn");
const billGenerate = document.getElementById("bill-generate");

// Modal
const billModal = document.getElementById("bill-modal");
const billModalClose = document.getElementById("bill-modal-close");
const billCancel = document.getElementById("bill-cancel");
const billConfirm = document.getElementById("bill-confirm");
const modalMeterList = document.getElementById("modal-meter-list");
const billStart = document.getElementById("bill-start");
const billEnd = document.getElementById("bill-end");
const billRateInput = document.getElementById("bill-rate");
const billType = document.getElementById("bill-type");
const metersBtn = document.getElementById("mode-meters");
const billingBtn = document.getElementById("mode-billing");
const metersPanel = document.getElementById("meters-panel");
const billingPanel = document.getElementById("billing-panel");
const billData = null;

let isModalOpen = false;
const closeModal = () => {
  billModal?.classList.add("hidden");
  isModalOpen = false;
};
const openModal = (energyRows, defaultRate) => {
  if (!billModal) return;
  billModal.classList.remove("hidden");
  isModalOpen = true;
  modalMeterList.innerHTML = energyRows
    .map(
      (m, i) =>
        `<label><input type="checkbox" value="${i}" checked> ${m.name} (${m.sn})</label>`
    )
    .join("");
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const start = new Date();
  start.setDate(start.getDate() - 30);
  billEnd.value = todayStr;
  billStart.value = start.toISOString().slice(0, 10);
  billRateInput.value = defaultRate;
};

billModalClose?.addEventListener("click", closeModal);
billCancel?.addEventListener("click", closeModal);
billModal?.addEventListener("click", (e) => {
  if (e.target === billModal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isModalOpen) closeModal();
});

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
  if (!isBilling) closeModal();
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

// ----- Billing logic -----
const now = new Date();
const month = now.toLocaleString("th-TH", { month: "long" });
const year = now.getFullYear();
const rate = 4.2;

// placeholder generation per meter
const energyRows = devices.map((d, idx) => {
  const produced = 1500 + idx * 180;
  const exportGrid = 320 + idx * 90;
  const net = Math.max(produced - exportGrid, 0);
  return { ...d, produced, exportGrid, net };
});

const totalNet = energyRows.reduce((sum, m) => sum + m.net, 0);
const amount = Math.round(totalNet * rate);

if (billPlant) billPlant.textContent = plant.name;
if (billMeters) billMeters.textContent = `${devices.length} meters`;
if (billPeriod) billPeriod.textContent = `${month} ${year}`;
if (billEnergy) billEnergy.textContent = `${totalNet.toLocaleString()} kWh`;
if (billAmount) billAmount.textContent = `฿${amount.toLocaleString()}`;
if (billNote) billNote.textContent = `คำนวณตัวอย่าง: (พลังงานผลิต - ส่งเข้า กฟภ./กฟน.) x ${rate} บาท/หน่วย`;

if (billRowsEl) {
  billRowsEl.innerHTML = energyRows
    .map(
      (m) => `
    <tr>
      <td>${m.name}</td>
      <td>${m.sn}</td>
      <td>${m.produced.toLocaleString()}</td>
      <td>${m.exportGrid.toLocaleString()}</td>
      <td>${m.net.toLocaleString()}</td>
    </tr>`
    )
    .join("");
}

const historyKey = "billingHistory";

let history = [];
try {
  const savedHist = localStorage.getItem(historyKey);
  if (savedHist) history = JSON.parse(savedHist);
} catch {
  history = [];
}

const addHistory = (period, amt, metersList) => {
  history = [
    { ts: Date.now(), period, amount: amt, meters: metersList.join(", ") },
    ...history
  ].slice(0, 20);
  localStorage.setItem(historyKey, JSON.stringify(history));
  if (billData) billData.classList.remove("hidden");
};

const runNow = (metersList = devices.map((d) => d.name)) => {
  addHistory(`${month} ${year}`, amount, metersList);
  alert(`สร้างบิลรอบ ${month} ${year} จำนวน ฿${amount.toLocaleString()}`);
};

const handleConfirm = () => {
  const checked = Array.from(
    modalMeterList.querySelectorAll("input[type=checkbox]:checked")
  ).map((el) => Number(el.value));
  if (!checked.length) {
    alert("กรุณาเลือกอย่างน้อย 1 มิเตอร์");
    return;
  }
  const selRows = checked.map((i) => energyRows[i]).filter(Boolean);
  const rateVal = parseFloat(billRateInput.value || `${rate}`) || rate;
  const totalNetSel = selRows.reduce((s, r) => s + r.net, 0);
  const amt = Math.round(totalNetSel * rateVal);
  const metersText = selRows.map((r) => r.name).join(", ");
  addHistory(
    billStart.value && billEnd.value
      ? `${billStart.value} - ${billEnd.value}`
      : `${month} ${year}`,
    amt,
    selRows.map((r) => r.name)
  );
  alert(
    `สร้างบิลสำหรับ ${metersText}\nพลังงานสุทธิ ${totalNetSel.toLocaleString()} kWh x ฿${rateVal} = ฿${amt.toLocaleString()}`
  );
  closeModal();
};

billNewBtn?.addEventListener("click", () => openModal(energyRows, rate));
billGenerate?.addEventListener("click", () => openModal(energyRows, rate));
billConfirm?.addEventListener("click", handleConfirm);

billModal?.classList.add("hidden");
setMode(false);
