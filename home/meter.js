const backBtn = document.getElementById("back-meter");
backBtn.addEventListener("click", () => {
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

if (!meterData) {
  meterNameEl.textContent = "ไม่พบข้อมูลมิเตอร์";
  chipStatus.textContent = "N/A";
  chipSn.textContent = "-";
  plantRef.textContent = plantData?.name || "-";
  metaPlant.textContent = plantData?.name || "-";
  metaSn.textContent = "-";
  metaStatus.textContent = "-";
  document.getElementById("chart-box").textContent = "กรุณากลับไปเลือกมิเตอร์จากหน้า Plant";
} else {
  meterNameEl.textContent = meterData.name || "Meter";
  chipStatus.textContent = meterData.status || "unknown";
  chipSn.textContent = meterData.sn || "-";
  plantRef.textContent = plantData?.name || "-";
  metaPlant.textContent = plantData?.name || "-";
  metaSn.textContent = meterData.sn || "-";
  metaStatus.textContent = meterData.status || "-";
}
