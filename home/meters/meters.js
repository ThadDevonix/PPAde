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
if (!plantMeters.length && !stored) {
  plantMeters = normalizeLocalMeters([
    { name: "Meter A", sn: plant.deviceSn || "-", status: "online" },
    { name: "Meter B", sn: `${plant.deviceSn || "-"}-B`, status: "online" }
  ]);
}

const formatMeterSerialText = (meter) => {
  if (!meter || typeof meter !== "object") return "-";
  const in1 = readText(meter.modbusIn1, meter.modbus_in_1);
  const in2 = readText(meter.modbusIn2, meter.modbus_in_2);
  const out1 = readText(meter.modbusOut1, meter.modbus_out_1);
  const out2 = readText(meter.modbusOut2, meter.modbus_out_2);
  if (in1 || in2 || out1 || out2) {
    const inText = in1 || in2 ? `${in1 || "-"} / ${in2 || "-"}` : "-";
    const outText = out1 || out2 ? `${out1 || "-"} / ${out2 || "-"}` : "-";
    return `IN ${inText} | OUT ${outText}`;
  }
  return readText(meter.sn, meter.serial, meter.modbus_address_in, meter.modbus_address_out) || "-";
};
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
  if (meterCreateModalTitle) meterCreateModalTitle.textContent = "แก้ไขมิเตอร์";
  if (meterCreateConfirm) meterCreateConfirm.textContent = "บันทึก";
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
  const label = meter.name || meter.sn || "มิเตอร์นี้";
  const ok = confirm(`ต้องการลบมิเตอร์: ${label} ใช่หรือไม่?`);
  if (!ok) return;
  try {
    await deleteMeterInApi(meter);
    const nextMeters = plantMeters.filter((_, meterIdx) => meterIdx !== idx);
    applyPlantMeters(nextMeters, { persistPlant: true, persistHomePlants: true });
  } catch (error) {
    alert(error?.message || "ลบมิเตอร์ไม่สำเร็จ");
  }
};

const renderPlantMeters = () => {
  if (!deviceRowsEl) return;
  const allowDelete = canDeleteMeters();
  if (!plantMeters.length) {
    deviceRowsEl.innerHTML = '<tr><td class="empty" colspan="4">ไม่พบมิเตอร์ของ Plant นี้</td></tr>';
    return;
  }
  deviceRowsEl.innerHTML = plantMeters
    .map(
      (meter, idx) => `
      <tr data-idx="${idx}">
        <td><span class="status-dot" title="${escapeHtml(meter.status)}"></span></td>
        <td>${escapeHtml(meter.name)}</td>
        <td>${escapeHtml(formatMeterSerialText(meter))}</td>
        <td>
          <div class="history-actions meter-row-actions">
            <button
              class="small-btn meter-row-edit"
              type="button"
              data-action="toggle-meter-menu"
              data-idx="${idx}"
              aria-label="จัดการมิเตอร์"
              title="จัดการมิเตอร์"
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
                แก้ไข
              </button>
              ${
                allowDelete
                  ? `<button
                class="meter-row-menu-item danger"
                type="button"
                data-action="delete-meter"
                data-idx="${idx}"
              >
                ลบ
              </button>`
                  : ""
              }
            </div>
          </div>
        </td>
      </tr>`
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
};

const resetMeterCreateForm = () => {
  editingPlantMeterIndex = null;
  if (meterCreateTypeInput) meterCreateTypeInput.value = "SOLAR_PANEL";
  if (meterCreateNameInput) meterCreateNameInput.value = "";
  if (meterCreateIn1Input) meterCreateIn1Input.value = "";
  if (meterCreateIn2Input) meterCreateIn2Input.value = "";
  if (meterCreateOut1Input) meterCreateOut1Input.value = "";
  if (meterCreateOut2Input) meterCreateOut2Input.value = "";
  if (meterCreateModalTitle) meterCreateModalTitle.textContent = "เพิ่มมิเตอร์";
  if (meterCreateConfirm) meterCreateConfirm.textContent = "เพิ่มมิเตอร์";
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
const handleCreateMeter = () => {
  const deviceType = readText(meterCreateTypeInput?.value) || "METER";
  const meterName = readText(meterCreateNameInput?.value);
  const modbusIn1 = readText(meterCreateIn1Input?.value);
  const modbusIn2 = readText(meterCreateIn2Input?.value);
  const modbusOut1 = readText(meterCreateOut1Input?.value);
  const modbusOut2 = readText(meterCreateOut2Input?.value);
  if (!meterName || !modbusIn1 || !modbusIn2) {
    alert("กรุณากรอกประเภทอุปกรณ์, ชื่ออุปกรณ์ และ Modbus Address ขาเข้าให้ครบ");
    return;
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
    const updatedMeters = plantMeters.map((meter, idx) =>
      idx === editingPlantMeterIndex ? mergedMeter : meter
    );
    applyPlantMeters(updatedMeters, { persistPlant: true, persistHomePlants: true });
  } else {
    applyPlantMeters([...plantMeters, newMeter], { persistPlant: true, persistHomePlants: true });
  }
  closeMeterCreateModal();
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
[meterCreateIn1Input, meterCreateIn2Input, meterCreateOut1Input, meterCreateOut2Input].forEach(
  (input) => {
    input?.addEventListener("input", () => {
      const cleaned = input.value.replace(/\D+/g, "");
      if (input.value !== cleaned) input.value = cleaned;
    });
  }
);
const bootstrapPlantPage = async () => {
  setMode(false);
  await hydrateCurrentUserRole();
  renderPlantMeters();
  await hydratePlantMetersFromApi();
  await initBilling();
};
bootstrapPlantPage();
