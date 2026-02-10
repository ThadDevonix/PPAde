const defaultPlants = [
  {
    name: "โฟนิคส์ สํานักงานใหญ่ 10kW",
    country: "Thailand",
    deviceType: "Inverter",
    deviceSn: "SN-TH-001",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-001-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-001-B", status: "online" }
    ]
  },
  {
    name: "โรงเรียนศรีษาบุตรสกุล 80kW อาคารหอประชุม",
    country: "Thailand",
    deviceType: "Inverter",
    deviceSn: "SN-TH-002",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-002-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-002-B", status: "online" }
    ]
  },
  {
    name: "Narai Hill Golf Resort Country Club 50 kW",
    country: "Thailand",
    deviceType: "Meter",
    deviceSn: "SN-TH-003",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-003-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-003-B", status: "online" }
    ]
  },
  {
    name: "บริษัทศรีน้องพาณิชย์ จ.กระบี่",
    country: "Thailand",
    deviceType: "Logger",
    deviceSn: "SN-TH-004",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-004-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-004-B", status: "online" }
    ]
  },
  {
    name: "PEA โรงเรียนชาติเชียรแม่ป่าไผ่ 5kW+op+batt",
    country: "Thailand",
    deviceType: "Inverter",
    deviceSn: "SN-TH-005",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-005-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-005-B", status: "online" }
    ]
  },
  {
    name: "PEA โรงเรียนพิจองซิง จ.แม่ฮาย 5kW+op+batt",
    country: "Thailand",
    deviceType: "Inverter",
    deviceSn: "SN-TH-006",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-006-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-006-B", status: "online" }
    ]
  },
  {
    name: "PEA โรงเรียนเข้นหัวเวียง 5kW+op+batt",
    country: "Thailand",
    deviceType: "Logger",
    deviceSn: "SN-TH-007",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-007-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-007-B", status: "online" }
    ]
  }
];

const plantsStorageKey = "plantsDataV1";
const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `plant-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
const normalizePlants = (list) =>
  list.map((plant) => (plant.id ? plant : { ...plant, id: generateId() }));
const loadPlants = () => {
  try {
    const saved = localStorage.getItem(plantsStorageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return [...defaultPlants];
};
const savePlants = () => {
  localStorage.setItem(plantsStorageKey, JSON.stringify(plants));
};

let plants = normalizePlants(loadPlants());
savePlants();

const rowsEl = document.getElementById("rows");
const inputs = {
  plant: document.getElementById("plant")
};
const createPlantBtn = document.getElementById("create-plant");
const plantModal = document.getElementById("plant-modal");
const plantModalTitle = document.getElementById("plant-modal-title");
const plantModalClose = document.getElementById("plant-modal-close");
const plantCancel = document.getElementById("plant-cancel");
const plantDelete = document.getElementById("plant-delete");
const plantSave = document.getElementById("plant-save");
const plantNameInput = document.getElementById("plant-name-input");
const meterAddBtn = document.getElementById("meter-add-btn");
const meterModal = document.getElementById("meter-modal");
const meterModalTitle = document.getElementById("meter-modal-title");
const meterModalClose = document.getElementById("meter-modal-close");
const meterAddConfirm = document.getElementById("meter-add-confirm");
const meterAddCancel = document.getElementById("meter-add-cancel");
const meterNameInput = document.getElementById("meter-name-input");
const meterAddressInput = document.getElementById("meter-address-input");
const meterStationInput = document.getElementById("meter-station-input");
const meterList = document.getElementById("meter-list");
const meterPager = document.getElementById("meter-pager");

let isPlantModalOpen = false;
let pendingMeters = [];
let editingPlantId = null;
let editingMeterIndex = null;
let meterPage = 1;
const metersPerPage = 5;
let isMeterModalOpen = false;

const render = (data) => {
  if (!data.length) {
    rowsEl.innerHTML = '<tr><td class="empty" colspan="4">ไม่พบข้อมูล</td></tr>';
    return;
  }

  rowsEl.innerHTML = data.map((item, idx) => `
    <tr data-index="${idx}" data-id="${item.id}">
      <td><span class="status-dot" title="online"></span></td>
      <td><div class="img-ph" aria-label="ภาพโรงไฟฟ้า (placeholder)"></div></td>
      <td>
        <div class="name">${item.name}</div>
      </td>
      <td>
        <div class="history-actions">
          <button class="small-btn" data-action="edit" data-id="${item.id}" type="button" aria-label="แก้ไข" title="แก้ไข">⋯</button>
        </div>
      </td>
    </tr>
  `).join("");

  rowsEl.querySelectorAll("tr").forEach((tr) => {
    tr.addEventListener("click", () => {
      const idx = Number(tr.dataset.index);
      const plant = data[idx];
      if (!plant) return;
      localStorage.setItem("selectedPlant", JSON.stringify(plant));
      window.location.href = "./plant.html";
    });
  });
  rowsEl.querySelectorAll("button[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (!id) return;
      const plant = plants.find((p) => p.id === id);
      if (plant) openPlantModal("edit", plant);
    });
  });
};

const resetMeterForm = () => {
  if (meterNameInput) meterNameInput.value = "";
  if (meterAddressInput) meterAddressInput.value = "";
  if (meterStationInput) meterStationInput.value = "";
  editingMeterIndex = null;
  if (meterAddConfirm) meterAddConfirm.textContent = "ตกลง";
  if (meterModalTitle) meterModalTitle.textContent = "เพิ่มมิเตอร์";
  updateMeterRequiredStates();
};
const setFieldError = (input, hasError) => {
  const field = input?.closest(".field");
  if (!field) return;
  field.classList.toggle("has-error", hasError);
};
const updateMeterRequiredStates = () => {
  setFieldError(meterNameInput, !meterNameInput?.value.trim());
  setFieldError(meterAddressInput, !meterAddressInput?.value.trim());
  setFieldError(meterStationInput, !meterStationInput?.value.trim());
};
const closeMeterModal = () => {
  meterModal?.classList.add("hidden");
  isMeterModalOpen = false;
  resetMeterForm();
};
const openMeterModal = () => {
  meterModal?.classList.remove("hidden");
  isMeterModalOpen = true;
  updateMeterRequiredStates();
  meterNameInput?.focus();
};
const getMeterPageCount = () =>
  Math.max(1, Math.ceil(pendingMeters.length / metersPerPage));
const renderMeterPager = () => {
  if (!meterPager) return;
  const totalPages = getMeterPageCount();
  if (totalPages <= 1) {
    meterPager.classList.add("hidden");
    meterPager.innerHTML = "";
    return;
  }
  meterPager.classList.remove("hidden");
  meterPager.innerHTML = Array.from({ length: totalPages }, (_, idx) => {
    const page = idx + 1;
    const active = page === meterPage ? "active" : "";
    return `<button class="pager-btn ${active}" type="button" data-page="${page}">${page}</button>`;
  }).join("");
  meterPager.querySelectorAll("button[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = Number(btn.dataset.page);
      if (!page) return;
      meterPage = page;
      renderMeterList();
    });
  });
};
const renderMeterList = () => {
  if (!meterList) return;
  const totalPages = getMeterPageCount();
  if (meterPage > totalPages) meterPage = totalPages;
  if (meterPage < 1) meterPage = 1;
  meterList.classList.toggle("scroll", pendingMeters.length > metersPerPage);
  if (!pendingMeters.length) {
    meterList.innerHTML = '<p class="muted small">ยังไม่มีมิเตอร์ที่เพิ่ม</p>';
    renderMeterPager();
    return;
  }
  const start = (meterPage - 1) * metersPerPage;
  const pageItems = pendingMeters.slice(start, start + metersPerPage);
  meterList.innerHTML = pageItems
    .map(
      (m, idx) => `
      <div class="meter-item">
        <div>
          <div class="title">${m.name}</div>
          <div class="meta">Address: ${m.address || "-"}</div>
          <div class="meta">Station: ${m.station || "-"}</div>
        </div>
        <div class="meter-item-actions">
          <button class="meter-edit" type="button" data-action="edit" data-index="${start + idx}">แก้ไข</button>
          <button class="meter-remove" type="button" data-action="delete" data-index="${start + idx}">ลบ</button>
        </div>
      </div>
    `
    )
    .join("");
  meterList.querySelectorAll("button[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      if (Number.isNaN(index)) return;
      pendingMeters = pendingMeters.filter((_, i) => i !== index);
      renderMeterList();
    });
  });
  meterList.querySelectorAll("button[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);
      const meter = pendingMeters[index];
      if (!meter) return;
      editingMeterIndex = index;
      if (meterNameInput) meterNameInput.value = meter.name || "";
      if (meterAddressInput) meterAddressInput.value = meter.address || "";
      if (meterStationInput) meterStationInput.value = meter.station || "";
      if (meterAddConfirm) meterAddConfirm.textContent = "อัปเดต";
      if (meterModalTitle) meterModalTitle.textContent = "แก้ไขมิเตอร์";
      updateMeterRequiredStates();
      openMeterModal();
    });
  });
  renderMeterPager();
};
const openPlantModal = (mode = "create", plant = null) => {
  if (!plantModal) return;
  plantModal.classList.remove("hidden");
  isPlantModalOpen = true;
  meterPage = 1;
  if (mode === "edit" && plant) {
    editingPlantId = plant.id;
    if (plantModalTitle) plantModalTitle.textContent = "แก้ไข Plant";
    plantDelete?.classList.remove("hidden");
    if (plantNameInput) plantNameInput.value = plant.name || "";
    const meters = Array.isArray(plant.devices) ? plant.devices : [];
    pendingMeters = meters.map((m) => ({
      name: m.name || "",
      address: m.address || "",
      station: m.station || m.sn || ""
    }));
  } else {
    editingPlantId = null;
    if (plantModalTitle) plantModalTitle.textContent = "สร้าง Plant";
    plantDelete?.classList.add("hidden");
    if (plantNameInput) plantNameInput.value = "";
    pendingMeters = [];
  }
  renderMeterList();
  closeMeterModal();
};
const closePlantModal = () => {
  plantModal?.classList.add("hidden");
  isPlantModalOpen = false;
  if (plantNameInput) plantNameInput.value = "";
  pendingMeters = [];
  editingPlantId = null;
  plantDelete?.classList.add("hidden");
  renderMeterList();
  closeMeterModal();
};

const applyFilters = () => {
  const plantText = inputs.plant.value.trim().toLowerCase();

  const filtered = plants.filter((p) => {
    const matchesPlant = !plantText || p.name.toLowerCase().includes(plantText);
    return matchesPlant;
  });
  render(filtered);
};

const deletePlant = (id) => {
  const target = plants.find((p) => p.id === id);
  if (!target) return;
  const ok = confirm(`ต้องการลบ Plant: ${target.name} ใช่หรือไม่?`);
  if (!ok) return;
  plants = plants.filter((p) => p.id !== id);
  savePlants();
  applyFilters();
  closePlantModal();
};

document.getElementById("search").addEventListener("click", applyFilters);
document.getElementById("reset").addEventListener("click", () => {
  Object.values(inputs).forEach((el) => { el.value = ""; });
  applyFilters();
});

createPlantBtn?.addEventListener("click", openPlantModal);
plantModalClose?.addEventListener("click", closePlantModal);
plantCancel?.addEventListener("click", closePlantModal);
plantModal?.addEventListener("click", (e) => {
  if (e.target === plantModal) closePlantModal();
});
plantDelete?.addEventListener("click", () => {
  if (!editingPlantId) return;
  deletePlant(editingPlantId);
});
meterModalClose?.addEventListener("click", closeMeterModal);
meterModal?.addEventListener("click", (e) => {
  if (e.target === meterModal) closeMeterModal();
});

meterAddBtn?.addEventListener("click", () => {
  resetMeterForm();
  openMeterModal();
});
meterAddCancel?.addEventListener("click", closeMeterModal);
[
  meterNameInput,
  meterAddressInput,
  meterStationInput
].forEach((input) => {
  input?.addEventListener("input", () => {
    setFieldError(input, !input.value.trim());
  });
});
const enforceNumeric = (input) => {
  if (!input) return;
  input.addEventListener("input", () => {
    const cleaned = input.value.replace(/\D+/g, "");
    if (input.value !== cleaned) input.value = cleaned;
    setFieldError(input, !input.value.trim());
  });
};
enforceNumeric(meterAddressInput);
enforceNumeric(meterStationInput);
meterAddConfirm?.addEventListener("click", () => {
  const name = meterNameInput?.value.trim();
  const address = meterAddressInput?.value.trim();
  const station = meterStationInput?.value.trim();
  const hasError = !name || !address || !station;
  updateMeterRequiredStates();
  if (hasError) {
    alert("กรุณากรอกข้อมูลมิเตอร์ให้ครบ");
    return;
  }
  const payload = { name, address, station };
  if (editingMeterIndex !== null) {
    pendingMeters = pendingMeters.map((m, idx) =>
      idx === editingMeterIndex ? payload : m
    );
  } else {
    pendingMeters = [...pendingMeters, payload];
    meterPage = getMeterPageCount();
  }
  renderMeterList();
  closeMeterModal();
});

plantSave?.addEventListener("click", () => {
  const plantName = plantNameInput?.value.trim();
  if (!plantName) {
    alert("กรุณาตั้งชื่อ Plant");
    return;
  }
  if (!pendingMeters.length) {
    alert("กรุณาเพิ่มมิเตอร์อย่างน้อย 1 รายการ");
    return;
  }
  const devices = pendingMeters.map((m, idx) => ({
    name: m.name,
    sn: m.station || m.address || `SN-${Date.now()}-${idx}`,
    status: "online",
    address: m.address,
    station: m.station
  }));
  if (editingPlantId) {
    const current = plants.find((p) => p.id === editingPlantId);
    if (!current) return;
    const updated = {
      ...current,
      name: plantName,
      devices,
      deviceSn: devices[0]?.sn || current.deviceSn || ""
    };
    plants = plants.map((p) => (p.id === editingPlantId ? updated : p));
  } else {
    const newPlant = {
      id: generateId(),
      name: plantName,
      country: "Thailand",
      deviceType: "Meter",
      deviceSn: devices[0]?.sn || "",
      status: "online",
      devices
    };
    plants = [newPlant, ...plants];
  }
  savePlants();
  applyFilters();
  closePlantModal();
});

Object.values(inputs).forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFilters();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (isMeterModalOpen) {
    closeMeterModal();
    return;
  }
  if (isPlantModalOpen) closePlantModal();
});

render(plants);
