if (!plant || typeof plant !== "object") {
  plant = {
    name: "ไม่พบข้อมูล Plant",
    devices: []
  };
}

if (nameEl) {
  nameEl.textContent = "กำลังตรวจสอบสิทธิ์...";
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

const formatMeterSerialText = (meter) => {
  if (!meter || typeof meter !== "object") return "-";
  const pickPrimaryToken = (value) => {
    const raw = readText(value);
    if (!raw) return "";
    const cleaned = raw.replace(/^\s*IN\s*/i, "").trim();
    const tokens = cleaned
      .split(/[|/,\s]+/)
      .map((token) => token.trim())
      .filter(Boolean)
      .filter((token) => !/^(IN|OUT)$/i.test(token));
    return tokens[0] || raw;
  };
  const primary = pickPrimaryToken(
    readText(
      meter.modbusIn1,
      meter.modbus_in_1,
      meter.modbus_address_in,
      meter.modbusAddressIn
    )
  );
  if (primary) return primary;
  return pickPrimaryToken(readText(meter.sn, meter.serial, meter.modbus_address_out, meter.modbusAddressOut)) || "-";
};
const shortenSerialText = (value, maxLength = 26) => {
  const text = String(value || "");
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return text.slice(0, maxLength);
  const sideLength = Math.max(2, Math.floor((maxLength - 3) / 2));
  return `${text.slice(0, sideLength)}...${text.slice(-sideLength)}`;
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
    const deleteMode = await deleteMeterInApi(meter, plant);
    if (deleteMode === "api") {
      await hydratePlantMetersFromApi();
      return;
    }
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
      (meter, idx) => {
        const serialFull = formatMeterSerialText(meter);
        const serialShort = shortenSerialText(serialFull);
        return `
      <tr data-idx="${idx}">
        <td><span class="status-dot" title="${escapeHtml(meter.status)}"></span></td>
        <td>${escapeHtml(meter.name)}</td>
        <td title="${escapeHtml(serialFull)}">${escapeHtml(serialShort)}</td>
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
    alert("กรุณากรอกประเภทอุปกรณ์, ชื่ออุปกรณ์ และ Modbus Address ขาเข้าให้ครบ");
    return;
  }
  if (isSavingMeterCreate) return;
  isSavingMeterCreate = true;
  if (meterCreateConfirm) {
    meterCreateConfirm.disabled = true;
    meterCreateConfirm.textContent = "กำลังบันทึก...";
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
    alert(error?.message || "บันทึกมิเตอร์ผ่าน API ไม่สำเร็จ");
  } finally {
    isSavingMeterCreate = false;
    if (meterCreateConfirm) {
      meterCreateConfirm.disabled = false;
      if (isMeterCreateModalOpen) {
        meterCreateConfirm.textContent =
          editingPlantMeterIndex !== null ? "บันทึก" : "เพิ่มมิเตอร์";
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
  setMode(false);
  applyPlantMeters(plantMeters, { persistPlant: false });
  await hydrateCurrentUserRole();
  await hydratePlantMetersFromApi();
  await initBilling();
  document.body.classList.remove("access-checking");
};
bootstrapPlantPage();
