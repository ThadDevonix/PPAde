/* eslint-disable no-unused-vars -- shared globals for split plant page scripts */
const backBtn = document.getElementById("back-btn");
backBtn?.addEventListener("click", () => {
  window.location.href = "../index.html";
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
const meterNewBtn = document.getElementById("meter-new-btn");
const meterCreateModal = document.getElementById("meter-create-modal");
const meterCreateModalTitle = meterCreateModal?.querySelector(".modal-header h3");
const meterCreateModalClose = document.getElementById("meter-create-modal-close");
const meterCreateCancel = document.getElementById("meter-create-cancel");
const meterCreateConfirm = document.getElementById("meter-create-confirm");
const meterCreateTypeInput = document.getElementById("meter-create-type");
const meterCreateNameInput = document.getElementById("meter-create-name");
const meterCreateIn1Input = document.getElementById("meter-create-in-1");
const meterCreateIn2Input = document.getElementById("meter-create-in-2");
const meterCreateOut1Input = document.getElementById("meter-create-out-1");
const meterCreateOut2Input = document.getElementById("meter-create-out-2");


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
    hideReceiptHistory();
    closeReceiptPreview();
    closeAutoRoundModal();
  }
};

document.getElementById("mode-meters")?.addEventListener("click", () => setMode(false));
document.getElementById("mode-billing")?.addEventListener("click", () => setMode(true));
