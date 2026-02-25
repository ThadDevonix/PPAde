/* eslint-disable no-unused-vars -- shared globals for split plant page scripts */
document.body.classList.add("access-checking");

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

const plantReadText = (...values) => {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (text) return text;
  }
  return "";
};
const normalizePlantRole = (value) => plantReadText(value).toLowerCase();
const toPositivePlantInt = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : null;
};
const normalizePlantSiteIds = (values) => {
  if (!Array.isArray(values)) return [];
  const dedup = new Set();
  const collect = (value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => collect(item));
      return;
    }
    if (value && typeof value === "object") {
      const siteId = toPositivePlantInt(value.id ?? value.site_id ?? value.siteId);
      if (siteId) dedup.add(siteId);
      collect(value.siteIds);
      collect(value.site_ids);
      collect(value.allowedSiteIds);
      collect(value.allowed_site_ids);
      return;
    }
    if (typeof value === "string" && value.includes(",")) {
      value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => collect(part));
      return;
    }
    const siteId = toPositivePlantInt(value);
    if (siteId) dedup.add(siteId);
  };
  values.forEach((value) => collect(value));
  return Array.from(dedup);
};
const extractPlantUserSiteIds = (user) =>
  normalizePlantSiteIds([
    user?.siteIds,
    user?.site_ids,
    user?.allowedSiteIds,
    user?.allowed_site_ids,
    user?.sites,
    user?.permissions?.siteIds,
    user?.permissions?.site_ids,
    user?.permissions?.allowedSiteIds,
    user?.permissions?.allowed_site_ids,
    user?.data?.siteIds,
    user?.data?.site_ids,
    user?.data?.allowedSiteIds,
    user?.data?.allowed_site_ids
  ]);
const normalizePlantEmail = (value) => plantReadText(value).toLowerCase();
const extractPlantRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const keys = ["data", "items", "rows", "list", "result", "users"];
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
const resolvePlantUserSiteIds = async (user) => {
  const base = extractPlantUserSiteIds(user);
  if (normalizePlantRole(user?.role) === "superadmin") return base;
  const email = normalizePlantEmail(
    user?.email ?? user?.user_email ?? user?.userEmail ?? user?.username
  );
  if (!email) return base;
  try {
    const response = await fetch("/api/users", {
      method: "GET",
      credentials: "same-origin"
    });
    if (!response.ok) return base;
    const payload = await response.json().catch(() => ({}));
    const rows = extractPlantRows(payload);
    const matched = rows.find((row) => {
      const rowEmail = normalizePlantEmail(
        row?.email ?? row?.user_email ?? row?.userEmail ?? row?.username
      );
      return rowEmail && rowEmail === email;
    });
    if (!matched) return base;
    const resolved = extractPlantUserSiteIds(matched);
    return resolved.length ? resolved : base;
  } catch {
    return base;
  }
};
const getSelectedPlantSiteId = (targetPlant) =>
  toPositivePlantInt(targetPlant?.apiId ?? targetPlant?.siteId ?? targetPlant?.site_id ?? targetPlant?.id);
const redirectToLogin = () => {
  const target = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const search = new URLSearchParams();
  search.set("redirect", target);
  window.location.href = `../login/index.html?${search.toString()}`;
};
const redirectToHome = () => {
  window.location.href = "../index.html";
};
const denyPlantAccess = (message) => {
  localStorage.removeItem("selectedPlant");
  localStorage.removeItem("selectedMeter");
  if (message) alert(message);
  redirectToHome();
};
let plantAccessPromise = null;
const ensurePlantAccess = async () => {
  if (plantAccessPromise) return plantAccessPromise;
  plantAccessPromise = (async () => {
    if (!plant || typeof plant !== "object") {
      denyPlantAccess("ไม่พบ Plant ที่เลือก หรือคุณไม่มีสิทธิ์เข้าถึง");
      return false;
    }
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin"
      });
      if (!response.ok) {
        redirectToLogin();
        return false;
      }
      const payload = await response.json().catch(() => ({}));
      const user = payload?.user && typeof payload.user === "object" ? payload.user : null;
      if (!user) {
        redirectToLogin();
        return false;
      }
      const role = normalizePlantRole(user?.role);
      if (role === "superadmin") return true;
      const plantSiteId = getSelectedPlantSiteId(plant);
      if (!plantSiteId) {
        denyPlantAccess("ไม่พบ Site ID ของ Plant นี้ จึงไม่สามารถยืนยันสิทธิ์ได้");
        return false;
      }
      const allowedSiteIds = await resolvePlantUserSiteIds(user);
      if (!allowedSiteIds.includes(plantSiteId)) {
        denyPlantAccess("คุณไม่มีสิทธิ์เข้าถึง Plant นี้");
        return false;
      }
      return true;
    } catch {
      redirectToLogin();
      return false;
    }
  })();
  return plantAccessPromise;
};
window.ensurePlantAccess = ensurePlantAccess;


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
