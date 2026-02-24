const userRowsEl = document.getElementById("user-rows");
const messageEl = document.getElementById("users-message");
const refreshBtn = document.getElementById("refresh-users");
const openCreateBtn = document.getElementById("open-create-user");
const authUserEl = document.getElementById("auth-user");
const logoutBtn = document.getElementById("logout-btn");

const createModal = document.getElementById("user-create-modal");
const createForm = document.getElementById("user-create-form");
const createSubmitBtn = document.getElementById("user-create-submit");
const createCancelBtn = document.getElementById("user-create-cancel");
const createCloseBtn = document.getElementById("user-create-close");
const userModalTitle = document.getElementById("user-modal-title");
const userEditIdEl = document.getElementById("user-edit-id");
const newUserEmailInput = document.getElementById("new-user-email");
const newUserNameInput = document.getElementById("new-user-name");
const newUserPasswordInput = document.getElementById("new-user-password");
const newUserPasswordLabel = document.getElementById("new-user-password-label");
const newUserRoleInput = document.getElementById("new-user-role");
const newUserActiveInput = document.getElementById("new-user-active");
const newUserSitesField = document.getElementById("new-user-sites-field");
const newUserSitesSearchInput = document.getElementById("new-user-sites-search");
const newUserSitesList = document.getElementById("new-user-sites-list");
const newUserSitesHint = document.getElementById("new-user-sites-hint");

let users = [];
let currentUser = null;
let availableSites = [];
let selectedCreateSiteIds = new Set();
let siteSearchQuery = "";
let userFormMode = "create";
let editingUserId = null;
let editingEmail = "";
let isLoading = false;
let loadError = "";
const clientTimeoutMs = 15000;

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), clientTimeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("TIMEOUT");
      timeoutError.code = "TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const readString = (...values) => {
  for (const value of values) {
    if (typeof value === "string") {
      const text = value.trim();
      if (text) return text;
    }
  }
  return "";
};

const normalizeEmail = (value) => readString(value).toLowerCase();
const normalizeRole = (value) => readString(value).toLowerCase();
const normalizeEntityId = (value) =>
  value === undefined || value === null ? "" : String(value).trim();
const isSameEntityId = (left, right) => {
  const leftId = normalizeEntityId(left);
  const rightId = normalizeEntityId(right);
  if (!leftId || !rightId) return false;
  if (leftId === rightId) return true;
  const leftNumber = Number(leftId);
  const rightNumber = Number(rightId);
  return (
    Number.isFinite(leftNumber) &&
    Number.isFinite(rightNumber) &&
    Math.trunc(leftNumber) === Math.trunc(rightNumber)
  );
};
const allowedUserRoles = new Set(["admin", "superadmin"]);
const normalizeAllowedRole = (value, fallback = "admin") => {
  const role = normalizeRole(value);
  return allowedUserRoles.has(role) ? role : fallback;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const redirectToLogin = () => {
  const target = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const search = new URLSearchParams();
  search.set("redirect", target);
  window.location.href = `../login/index.html?${search.toString()}`;
};

const setMessage = (message, type = "") => {
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.classList.remove("error", "success");
  if (type) {
    messageEl.classList.add(type);
  }
};

const setAuthUser = (user) => {
  if (!authUserEl) return;
  const name = readString(user?.name, user?.email) || "ผู้ใช้งาน";
  const role = readString(user?.role);
  authUserEl.textContent = role ? `${name} (${role})` : name;
};

const isEditMode = () => userFormMode === "edit" && editingUserId !== null;

const canCurrentUserChangePassword = (targetUserId) => {
  const role = normalizeRole(currentUser?.role);
  if (role === "superadmin") return true;
  if (role !== "admin") return false;
  return isSameEntityId(currentUser?.id, targetUserId);
};

const syncRoleFieldPermission = () => {
  if (!newUserRoleInput) return;
  const superadminOption = Array.from(newUserRoleInput.options).find(
    (option) => normalizeRole(option.value) === "superadmin"
  );
  if (!superadminOption) return;

  const currentRole = normalizeRole(currentUser?.role);
  const selectedRole = normalizeRole(newUserRoleInput.value);
  const allowSuperadminSelection =
    currentRole === "superadmin" || (isEditMode() && selectedRole === "superadmin");

  superadminOption.hidden = !allowSuperadminSelection;
  superadminOption.disabled = !allowSuperadminSelection;
  if (!allowSuperadminSelection && selectedRole === "superadmin") {
    newUserRoleInput.value = "admin";
  }
};

const syncPasswordFieldState = () => {
  if (!newUserPasswordInput || !newUserPasswordLabel) return;
  if (userFormMode !== "edit") {
    newUserPasswordInput.disabled = false;
    newUserPasswordInput.required = true;
    newUserPasswordInput.placeholder = "";
    newUserPasswordLabel.innerHTML = 'Password <span class="req-star">*</span>';
    return;
  }

  const canChangePassword = canCurrentUserChangePassword(editingUserId);
  newUserPasswordInput.required = false;
  newUserPasswordInput.disabled = !canChangePassword;
  newUserPasswordInput.placeholder = "";
  newUserPasswordLabel.textContent = "Password";
  if (!canChangePassword) {
    newUserPasswordInput.value = "";
    return;
  }
};

const setUserFormMode = (mode, user = null) => {
  userFormMode = mode === "edit" ? "edit" : "create";
  editingUserId = userFormMode === "edit" ? user?.id ?? null : null;
  editingEmail = userFormMode === "edit" ? normalizeEmail(user?.email) : "";

  if (userModalTitle) {
    userModalTitle.textContent = userFormMode === "edit" ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้";
  }
  if (createSubmitBtn) {
    createSubmitBtn.textContent = userFormMode === "edit" ? "บันทึกการแก้ไข" : "บันทึก";
  }
  syncRoleFieldPermission();
  syncPasswordFieldState();
  if (userEditIdEl) {
    const hasId = editingUserId !== null && editingUserId !== undefined && editingUserId !== "";
    userEditIdEl.textContent = hasId ? `ID: ${editingUserId}` : "";
    userEditIdEl.classList.toggle("hidden", !hasId);
  }
};

const extractRows = (payload) => {
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

const readUserIdFromRow = (row) => {
  if (!row || typeof row !== "object") return "";
  return normalizeEntityId(row.id ?? row.user_id ?? row.userId);
};

const extractUserIdFromPayload = (payload, fallbackEmail = "") => {
  const directId = readUserIdFromRow(payload);
  if (directId) return directId;

  const nestedUserId = readUserIdFromRow(payload?.user);
  if (nestedUserId) return nestedUserId;

  const rows = extractRows(payload);
  if (!rows.length) return "";

  const expectedEmail = normalizeEmail(fallbackEmail);
  if (expectedEmail) {
    const matched = rows.find((row) => {
      const rowEmail = normalizeEmail(
        row?.email ?? row?.user_email ?? row?.userEmail ?? row?.username
      );
      return rowEmail && rowEmail === expectedEmail;
    });
    const matchedId = readUserIdFromRow(matched);
    if (matchedId) return matchedId;
  }

  for (const row of rows) {
    const rowId = readUserIdFromRow(row);
    if (rowId) return rowId;
  }
  return "";
};

const normalizeUser = (row) => {
  if (!row || typeof row !== "object") return null;
  const email = normalizeEmail(
    row.email ??
      row.user_email ??
      row.userEmail ??
      row.username ??
      row.user_name ??
      row.userName
  );
  const id = row.id ?? row.user_id ?? row.userId;
  if (id === undefined || id === null || !email) return null;
  const siteIds = extractUserSiteIds(row);
  return {
    id,
    email,
    name:
      readString(
        row.name,
        row.full_name,
        row.fullName,
        row.display_name,
        row.displayName,
        row.username
      ) || email,
    role: (() => {
      const role = normalizeRole(readString(row.role, row.user_role, row.userRole));
      return allowedUserRoles.has(role) ? role : "-";
    })(),
    siteIds,
    isActive: Number(row.is_active ?? row.isActive ?? row.active ?? 1) !== 0,
    lastLoginAt: readString(row.last_login_at, row.lastLoginAt),
    createdAt: readString(row.created_at, row.createdAt)
  };
};

const toPositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : null;
};

const normalizeSiteIds = (values) => {
  if (!Array.isArray(values)) return [];
  const dedup = new Set();
  values.forEach((value) => {
    if (Array.isArray(value)) {
      normalizeSiteIds(value).forEach((siteId) => dedup.add(siteId));
      return;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const siteId = toPositiveInt(value.id ?? value.site_id ?? value.siteId);
      if (siteId) dedup.add(siteId);
      normalizeSiteIds([
        value.siteIds,
        value.site_ids,
        value.allowedSiteIds,
        value.allowed_site_ids
      ]).forEach((nestedId) => dedup.add(nestedId));
      return;
    }
    if (typeof value === "string" && value.includes(",")) {
      value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
          const siteId = toPositiveInt(part);
          if (siteId) dedup.add(siteId);
        });
      return;
    }
    const siteId = toPositiveInt(value);
    if (siteId) dedup.add(siteId);
  });
  return Array.from(dedup);
};
const extractUserSiteIds = (row) =>
  normalizeSiteIds([
    row.siteIds,
    row.site_ids,
    row.allowedSiteIds,
    row.allowed_site_ids,
    row.sites,
    row.permissions?.siteIds,
    row.permissions?.site_ids,
    row.permissions?.allowedSiteIds,
    row.permissions?.allowed_site_ids,
    row.data?.siteIds,
    row.data?.site_ids,
    row.data?.allowedSiteIds,
    row.data?.allowed_site_ids
  ]);

const extractSiteRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const keys = ["data", "items", "rows", "list", "result", "sites"];
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

const normalizeSite = (row) => {
  if (!row || typeof row !== "object") return null;
  const id = toPositiveInt(row.id ?? row.site_id ?? row.siteId);
  if (!id) return null;
  const code = readString(row.site_code, row.siteCode, row.code);
  const name = readString(row.site_name, row.siteName, row.name);
  const label = code && name ? `${code} - ${name}` : code || name || `Site ${id}`;
  return {
    id,
    label
  };
};

const readNumber = (...values) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const extractPagination = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      currentPage: null,
      totalPages: null,
      nextPage: null,
      total: null,
      hasMore: null
    };
  }
  const source =
    payload.pagination ||
    payload.page_info ||
    payload.pageInfo ||
    payload.meta ||
    payload;
  const currentPage = readNumber(
    source.current_page,
    source.currentPage,
    source.page,
    payload.current_page,
    payload.currentPage,
    payload.page
  );
  const totalPages = readNumber(
    source.total_pages,
    source.totalPages,
    source.last_page,
    source.lastPage,
    source.page_count,
    source.pageCount,
    payload.total_pages,
    payload.totalPages
  );
  const nextPage = readNumber(
    source.next_page,
    source.nextPage,
    payload.next_page,
    payload.nextPage
  );
  const total = readNumber(
    source.total,
    source.total_items,
    source.totalItems,
    source.count,
    payload.total,
    payload.count
  );
  const rawHasMore =
    source.has_more ??
    source.hasMore ??
    payload.has_more ??
    payload.hasMore;
  const hasMore = typeof rawHasMore === "boolean" ? rawHasMore : null;
  return {
    currentPage,
    totalPages,
    nextPage,
    total,
    hasMore
  };
};

const hasPaginationSignal = (pagination) =>
  Boolean(
    (pagination?.nextPage && pagination.nextPage > 0) ||
      (pagination?.totalPages && pagination.totalPages > 1) ||
      pagination?.hasMore === true
  );

const buildUsersApiUrl = (page, limit) => {
  if (page <= 1) {
    // Keep legacy behavior for backends that expose the user list at /api/users.
    return "/api/users";
  }
  const search = new URLSearchParams();
  search.set("page", String(page));
  search.set("limit", String(limit));
  search.set("per_page", String(limit));
  search.set("page_size", String(limit));
  search.set("include_inactive", "1");
  search.set("all", "1");
  return `/api/users?${search.toString()}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

const parseResponsePayload = async (response) => {
  const text = await response.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const responseMessage = (payload, fallback) => {
  const message =
    payload?.message ||
    payload?.error ||
    payload?.detail ||
    payload?.error_message ||
    payload?.errorMessage;
  return readString(message) || fallback;
};

const friendlyErrorMessage = (error, fallback) => {
  if (error?.code === "TIMEOUT" || error?.message === "TIMEOUT") {
    return "การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่";
  }
  return error?.message || fallback;
};

const setLoadingState = (loading) => {
  isLoading = loading;
  if (refreshBtn) refreshBtn.disabled = loading;
  if (openCreateBtn) openCreateBtn.disabled = loading;
};

const renderUsers = () => {
  if (!userRowsEl) return;
  if (isLoading) {
    userRowsEl.innerHTML = '<tr><td class="empty" colspan="7">กำลังโหลดผู้ใช้...</td></tr>';
    return;
  }
  if (loadError) {
    userRowsEl.innerHTML = `<tr><td class="empty" colspan="7">${escapeHtml(loadError)}</td></tr>`;
    return;
  }
  if (!users.length) {
    userRowsEl.innerHTML = '<tr><td class="empty" colspan="7">ยังไม่มีข้อมูลผู้ใช้</td></tr>';
    return;
  }

  userRowsEl.innerHTML = users
    .map((user) => {
      const isCurrentUser = String(currentUser?.id) === String(user.id);
      return `
      <tr data-id="${escapeHtml(String(user.id))}">
        <td>${escapeHtml(String(user.id))}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.name)}</td>
        <td><span class="role-chip">${escapeHtml(user.role)}</span></td>
        <td>
          <span class="status-badge ${user.isActive ? "active" : "inactive"}">
            ${user.isActive ? "active" : "inactive"}
          </span>
        </td>
        <td>${escapeHtml(formatDateTime(user.lastLoginAt))}</td>
        <td>
          <div class="users-action-group">
            <button
              class="small-btn users-edit-btn"
              type="button"
              data-action="edit"
              data-id="${escapeHtml(String(user.id))}"
            >
              แก้ไข
            </button>
            <button
              class="small-btn users-delete-btn"
              type="button"
              data-action="delete"
              data-id="${escapeHtml(String(user.id))}"
              ${isCurrentUser ? "disabled aria-disabled=\"true\" title=\"ไม่สามารถลบบัญชีที่กำลังใช้งาน\"" : ""}
            >
              ลบ
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  userRowsEl.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-action");
      const id = button.getAttribute("data-id");
      if (!id) return;
      const target = users.find((item) => String(item.id) === id);
      if (action === "edit" && target) {
        void openEditModal(target);
        return;
      }
      if (action === "delete" && target) {
        void deleteUser(target);
      }
    });
  });
};

const ensureAuthenticated = async () => {
  try {
    const response = await fetchWithTimeout("/api/auth/me", {
      method: "GET",
      credentials: "same-origin"
    });
    if (!response.ok) {
      redirectToLogin();
      return null;
    }
    const payload = await parseResponsePayload(response);
    if (!payload?.user) {
      redirectToLogin();
      return null;
    }
    currentUser = payload.user;
    setAuthUser(currentUser);
    syncRoleFieldPermission();
    syncPasswordFieldState();
    return currentUser;
  } catch {
    redirectToLogin();
    return null;
  }
};

const fetchUsers = async () => {
  setLoadingState(true);
  loadError = "";
  setMessage("");
  renderUsers();
  try {
    const pageLimit = 100;
    const maxPages = 40;
    const usersByKey = new Map();
    let page = 1;
    let expectedTotal = null;

    while (page <= maxPages) {
      const response = await fetchWithTimeout(buildUsersApiUrl(page, pageLimit), {
        method: "GET",
        credentials: "same-origin"
      });
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      const payload = await parseResponsePayload(response);
      if (!response.ok) {
        if (page > 1 && usersByKey.size > 0) {
          break;
        }
        if (response.status === 429) {
          const retryAfterRaw = Number(response.headers.get("retry-after"));
          const retryAfterText =
            Number.isFinite(retryAfterRaw) && retryAfterRaw > 0
              ? `กรุณารอ ${Math.ceil(retryAfterRaw)} วินาทีแล้วลองใหม่`
              : "กรุณารอสักครู่แล้วกดรีเฟรชอีกครั้ง";
          throw new Error(responseMessage(payload, `คำขอมากเกินกำหนด (${retryAfterText})`));
        }
        throw new Error(responseMessage(payload, "โหลดรายการผู้ใช้ไม่สำเร็จ"));
      }

      const pageRows = extractRows(payload)
        .map((item) => normalizeUser(item))
        .filter(Boolean);
      const sizeBefore = usersByKey.size;
      pageRows.forEach((user) => {
        const key = `${user.id}:${user.email}`;
        usersByKey.set(key, user);
      });
      const addedCount = usersByKey.size - sizeBefore;
      const pagination = extractPagination(payload);
      if (pagination.total !== null) {
        expectedTotal = pagination.total;
      }

      if (!pageRows.length) break;
      if (addedCount === 0 && page > 1) break;
      if (pagination.nextPage && pagination.nextPage > page) {
        page = pagination.nextPage;
        continue;
      }
      if (pagination.totalPages && page < pagination.totalPages) {
        page += 1;
        continue;
      }
      if (pagination.hasMore === true) {
        page += 1;
        continue;
      }
      if (!hasPaginationSignal(pagination)) break;
      break;
    }

    users = Array.from(usersByKey.values());
    if (expectedTotal !== null && users.length < expectedTotal) {
      setMessage(
        `โหลดได้ ${users.length}/${expectedTotal} รายการ (API อาจจำกัดสิทธิ์หรือข้อมูลเป็นแบบแบ่งหน้า)`,
        "error"
      );
    } else {
      setMessage(`โหลดผู้ใช้ทั้งหมด ${users.length} รายการ`, "success");
    }
    renderUsers();
  } catch (error) {
    users = [];
    loadError = friendlyErrorMessage(error, "โหลดรายการผู้ใช้ไม่สำเร็จ");
    renderUsers();
    setMessage(loadError, "error");
  } finally {
    setLoadingState(false);
    renderUsers();
  }
};

const clearSelectedSiteOptions = () => {
  selectedCreateSiteIds = new Set();
};

const getSelectedCreateSiteIds = () => normalizeSiteIds(Array.from(selectedCreateSiteIds));
const normalizeSearchText = (value) => readString(value).toLowerCase();

const setSitesListDisabled = (disabled) => {
  if (!newUserSitesList) return;
  newUserSitesList.classList.toggle("is-disabled", disabled);
  newUserSitesList.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.disabled = disabled;
  });
  if (newUserSitesSearchInput) {
    newUserSitesSearchInput.disabled = disabled || availableSites.length === 0;
  }
};

const renderCreateSiteOptions = () => {
  if (!newUserSitesList) return;
  if (!availableSites.length) {
    newUserSitesList.innerHTML = '<p class="muted users-sites-empty">ไม่พบ Plant ให้เลือก</p>';
    setSitesListDisabled(true);
    return;
  }
  const filteredSites = availableSites.filter((site) => {
    if (!siteSearchQuery) return true;
    const searchSpace = `${site.label} ${site.id}`.toLowerCase();
    return searchSpace.includes(siteSearchQuery);
  });
  if (!filteredSites.length) {
    newUserSitesList.innerHTML = '<p class="muted users-sites-empty">ไม่พบ Plant จากคำค้นหา</p>';
    return;
  }
  const selectedIds = new Set(getSelectedCreateSiteIds());
  newUserSitesList.innerHTML = filteredSites
    .map(
      (site) => `
      <label class="users-site-option">
        <input
          type="checkbox"
          data-site-id="${escapeHtml(String(site.id))}"
          ${selectedIds.has(site.id) ? "checked" : ""}
        />
        <span>${escapeHtml(site.label)}</span>
      </label>
    `
    )
    .join("");
};

const syncCreateSiteFieldState = () => {
  if (!newUserRoleInput || !newUserSitesField) return;
  syncRoleFieldPermission();
  const role = normalizeAllowedRole(newUserRoleInput.value || "admin", "admin");
  if (newUserSitesHint) {
    newUserSitesHint.textContent = "";
  }
  if (role === "admin") {
    newUserSitesField.classList.remove("hidden");
    setSitesListDisabled(!availableSites.length);
    return;
  }

  clearSelectedSiteOptions();
  renderCreateSiteOptions();
  if (role === "superadmin") {
    newUserSitesField.classList.remove("hidden");
    setSitesListDisabled(true);
    return;
  }

  newUserSitesField.classList.add("hidden");
  setSitesListDisabled(true);
};

const loadAssignableSites = async () => {
  if (!newUserSitesList) return;
  newUserSitesList.innerHTML = '<p class="muted users-sites-empty">กำลังโหลด Plant...</p>';
  setSitesListDisabled(true);

  try {
    const response = await fetchWithTimeout("/api/sites", {
      method: "GET",
      credentials: "same-origin"
    });
    if (response.status === 401) {
      redirectToLogin();
      return;
    }
    const payload = await parseResponsePayload(response);
    if (!response.ok) {
      throw new Error(responseMessage(payload, "โหลดรายการ Plant ไม่สำเร็จ"));
    }

    const siteMap = new Map();
    extractSiteRows(payload)
      .map((row) => normalizeSite(row))
      .filter(Boolean)
      .forEach((site) => {
        siteMap.set(site.id, site);
      });
    availableSites = Array.from(siteMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    availableSites = [];
    setMessage(friendlyErrorMessage(error, "โหลดรายการ Plant ไม่สำเร็จ"), "error");
  } finally {
    renderCreateSiteOptions();
    syncCreateSiteFieldState();
  }
};

const closeCreateModal = () => {
  createModal?.classList.add("hidden");
  createForm?.reset();
  setUserFormMode("create");
  if (newUserRoleInput) newUserRoleInput.value = "admin";
  if (newUserActiveInput) newUserActiveInput.value = "1";
  siteSearchQuery = "";
  if (newUserSitesSearchInput) {
    newUserSitesSearchInput.value = "";
  }
  clearSelectedSiteOptions();
  syncCreateSiteFieldState();
};

const openCreateModal = async () => {
  setUserFormMode("create");
  createModal?.classList.remove("hidden");
  syncCreateSiteFieldState();
  await loadAssignableSites();
  newUserEmailInput?.focus();
};

const openEditModal = async (targetUser) => {
  if (!targetUser) return;
  setUserFormMode("edit", targetUser);
  createModal?.classList.remove("hidden");

  if (newUserEmailInput) newUserEmailInput.value = targetUser.email || "";
  if (newUserNameInput) newUserNameInput.value = targetUser.name || "";
  if (newUserPasswordInput) newUserPasswordInput.value = "";
  if (newUserRoleInput) {
    newUserRoleInput.value = normalizeAllowedRole(targetUser.role, "admin");
  }
  syncRoleFieldPermission();
  if (newUserActiveInput) {
    newUserActiveInput.value = targetUser.isActive ? "1" : "0";
  }

  siteSearchQuery = "";
  if (newUserSitesSearchInput) {
    newUserSitesSearchInput.value = "";
  }
  selectedCreateSiteIds = new Set(normalizeSiteIds(targetUser.siteIds));

  syncCreateSiteFieldState();
  await loadAssignableSites();
  newUserNameInput?.focus();
};

const requestUpdateUser = async (id, payload) => {
  const encodedId = encodeURIComponent(String(id));
  const payloadWithId = {
    id,
    ...payload
  };
  const attempts = [
    { method: "PUT", url: `/api/users/${encodedId}`, body: payload },
    { method: "PUT", url: `/api/users?id=${encodedId}`, body: payloadWithId },
    { method: "PATCH", url: `/api/users/${encodedId}`, body: payload },
    { method: "PATCH", url: `/api/users?id=${encodedId}`, body: payloadWithId },
    { method: "PUT", url: "/api/users", body: payloadWithId },
    { method: "PATCH", url: "/api/users", body: payloadWithId }
  ];

  let lastResponse = null;
  for (const attempt of attempts) {
    const response = await fetchWithTimeout(attempt.url, {
      method: attempt.method,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(attempt.body)
    });
    lastResponse = response;
    if (response.ok) return response;
    if (![404, 405].includes(response.status)) return response;
  }
  if (lastResponse) return lastResponse;
  throw new Error("ไม่พบ API สำหรับแก้ไขผู้ใช้");
};
const requestUpdateUserSites = async (id, siteIds) => {
  const encodedId = encodeURIComponent(String(id));
  const normalizedSiteIds = normalizeSiteIds(Array.isArray(siteIds) ? siteIds : []);
  const payloadSiteIds = { siteIds: normalizedSiteIds };
  const payloadSiteIdsSnake = { site_ids: normalizedSiteIds };
  const payloadCompat = {
    siteIds: normalizedSiteIds,
    site_ids: normalizedSiteIds,
    allowedSiteIds: normalizedSiteIds,
    allowed_site_ids: normalizedSiteIds
  };
  const attempts = [
    { method: "PUT", url: `/api/users/${encodedId}/sites`, body: payloadSiteIds },
    { method: "PATCH", url: `/api/users/${encodedId}/sites`, body: payloadSiteIds },
    { method: "PUT", url: `/api/users/${encodedId}/sites`, body: payloadSiteIdsSnake },
    { method: "PATCH", url: `/api/users/${encodedId}/sites`, body: payloadSiteIdsSnake },
    { method: "PUT", url: `/api/users/${encodedId}/sites`, body: payloadCompat },
    { method: "PATCH", url: `/api/users/${encodedId}/sites`, body: payloadCompat },
    { method: "PUT", url: `/api/users/${encodedId}/sites?id=${encodedId}`, body: payloadSiteIds },
    { method: "PATCH", url: `/api/users/${encodedId}/sites?id=${encodedId}`, body: payloadSiteIdsSnake }
  ];

  let lastResponse = null;
  for (const attempt of attempts) {
    const response = await fetchWithTimeout(attempt.url, {
      method: attempt.method,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(attempt.body)
    });
    lastResponse = response;
    if (response.ok) return response;
    if (![404, 405].includes(response.status)) return response;
  }
  if (lastResponse) return lastResponse;
  throw new Error("ไม่พบ API สำหรับบันทึกสิทธิ์ Plant");
};

const requestFindUserIdByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return "";

  const response = await fetchWithTimeout("/api/users", {
    method: "GET",
    credentials: "same-origin"
  });
  if (!response.ok) return "";

  const payload = await parseResponsePayload(response);
  const rows = extractRows(payload);
  const matched = rows.find((row) => {
    const rowEmail = normalizeEmail(
      row?.email ?? row?.user_email ?? row?.userEmail ?? row?.username
    );
    return rowEmail && rowEmail === normalizedEmail;
  });
  return readUserIdFromRow(matched);
};

const submitUserForm = async () => {
  const wasEditMode = isEditMode();
  const rawEmail = readString(newUserEmailInput?.value);
  const name = readString(newUserNameInput?.value);
  const password = String(newUserPasswordInput?.value || "");
  const roleRaw = normalizeRole(newUserRoleInput?.value || "");
  const role = normalizeAllowedRole(roleRaw, "");
  const isActive = newUserActiveInput?.value === "1";
  const selectedSiteIds = getSelectedCreateSiteIds();
  const typedEmail = normalizeEmail(rawEmail);
  const email = wasEditMode ? typedEmail || normalizeEmail(editingEmail) : typedEmail;

  if (!email || !name) {
    setMessage("กรุณากรอกข้อมูล Email และ Name ให้ครบ", "error");
    return;
  }
  if (!email.includes("@")) {
    setMessage("กรุณากรอก Email ให้ถูกต้อง", "error");
    return;
  }
  if (password && password.length < 8) {
    setMessage("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "error");
    return;
  }
  if (!wasEditMode && !password) {
    setMessage("กรุณากรอกรหัสผ่านสำหรับผู้ใช้ใหม่", "error");
    return;
  }
  if (!role) {
    setMessage("Role ต้องเป็น admin หรือ superadmin เท่านั้น", "error");
    return;
  }
  if (!wasEditMode && role === "superadmin" && normalizeRole(currentUser?.role) !== "superadmin") {
    setMessage("admin ไม่สามารถสร้างบัญชี superadmin ได้", "error");
    return;
  }
  createSubmitBtn.disabled = true;
  createSubmitBtn.textContent = "กำลังบันทึก...";
  setMessage("");

  const payload = {
    email,
    name,
    role,
    is_active: isActive ? 1 : 0,
    isActive: isActive ? 1 : 0
  };
  if (password) {
    payload.password = password;
  }
  if (role === "admin") {
    payload.siteIds = selectedSiteIds;
    payload.site_ids = selectedSiteIds;
    payload.allowedSiteIds = selectedSiteIds;
    payload.allowed_site_ids = selectedSiteIds;
    payload.permissions = {
      siteIds: selectedSiteIds,
      site_ids: selectedSiteIds
    };
  }

  try {
    const response = wasEditMode
      ? await requestUpdateUser(editingUserId, payload)
      : await fetchWithTimeout("/api/users", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
    const body = await parseResponsePayload(response);
    if (!response.ok) {
      throw new Error(
        responseMessage(body, wasEditMode ? "แก้ไขผู้ใช้ไม่สำเร็จ" : "เพิ่มผู้ใช้ไม่สำเร็จ")
      );
    }
    if (role === "admin") {
      let targetUserId = wasEditMode ? normalizeEntityId(editingUserId) : "";
      if (!targetUserId) {
        targetUserId = extractUserIdFromPayload(body, email);
      }
      if (!targetUserId) {
        targetUserId = await requestFindUserIdByEmail(email);
      }
      if (!targetUserId) {
        throw new Error("ไม่พบรหัสผู้ใช้สำหรับบันทึกสิทธิ์ Plant");
      }

      const sitesResponse = await requestUpdateUserSites(targetUserId, selectedSiteIds);
      const sitesPayload = await parseResponsePayload(sitesResponse);
      if (!sitesResponse.ok) {
        throw new Error(responseMessage(sitesPayload, "บันทึกสิทธิ์ Plant ไม่สำเร็จ"));
      }
    }
    closeCreateModal();
    setMessage(wasEditMode ? "แก้ไขผู้ใช้สำเร็จ" : "เพิ่มผู้ใช้สำเร็จ", "success");
    await fetchUsers();
  } catch (error) {
    setMessage(
      friendlyErrorMessage(error, wasEditMode ? "แก้ไขผู้ใช้ไม่สำเร็จ" : "เพิ่มผู้ใช้ไม่สำเร็จ"),
      "error"
    );
  } finally {
    createSubmitBtn.disabled = false;
    createSubmitBtn.textContent = isEditMode() ? "บันทึกการแก้ไข" : "บันทึก";
  }
};

const requestDeleteUser = async (id) => {
  const encodedId = encodeURIComponent(String(id));
  const firstResponse = await fetchWithTimeout(`/api/users/${encodedId}`, {
    method: "DELETE",
    credentials: "same-origin"
  });

  if (firstResponse.ok || ![404, 405].includes(firstResponse.status)) {
    return firstResponse;
  }

  return fetchWithTimeout(`/api/users?id=${encodedId}`, {
    method: "DELETE",
    credentials: "same-origin"
  });
};

const deleteUser = async (target) => {
  if (!target) return;
  if (String(currentUser?.id) === String(target.id)) {
    setMessage("ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่", "error");
    return;
  }
  const confirmed = window.confirm(`ต้องการลบผู้ใช้ ${target.email} ใช่หรือไม่?`);
  if (!confirmed) return;

  setMessage("");
  try {
    const response = await requestDeleteUser(target.id);
    const payload = await parseResponsePayload(response);
    if (!response.ok) {
      throw new Error(responseMessage(payload, "ลบผู้ใช้ไม่สำเร็จ"));
    }
    setMessage("ลบผู้ใช้สำเร็จ", "success");
    await fetchUsers();
  } catch (error) {
    setMessage(friendlyErrorMessage(error, "ลบผู้ใช้ไม่สำเร็จ"), "error");
  }
};

const logout = async () => {
  if (logoutBtn) {
    logoutBtn.disabled = true;
    logoutBtn.textContent = "กำลังออกจากระบบ...";
  }
  try {
    await fetchWithTimeout("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } catch {
    // ignore and redirect
  }
  redirectToLogin();
};

refreshBtn?.addEventListener("click", () => {
  void fetchUsers();
});
openCreateBtn?.addEventListener("click", () => {
  void openCreateModal();
});
createSubmitBtn?.addEventListener("click", () => {
  void submitUserForm();
});
createForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  void submitUserForm();
});
newUserSitesList?.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.type !== "checkbox") return;
  const siteId = toPositiveInt(target.getAttribute("data-site-id"));
  if (!siteId) return;
  if (target.checked) {
    selectedCreateSiteIds.add(siteId);
  } else {
    selectedCreateSiteIds.delete(siteId);
  }
});
newUserSitesSearchInput?.addEventListener("input", () => {
  siteSearchQuery = normalizeSearchText(newUserSitesSearchInput.value);
  renderCreateSiteOptions();
  syncCreateSiteFieldState();
});
newUserRoleInput?.addEventListener("change", syncCreateSiteFieldState);
createCancelBtn?.addEventListener("click", closeCreateModal);
createCloseBtn?.addEventListener("click", closeCreateModal);
createModal?.addEventListener("click", (event) => {
  if (event.target === createModal) closeCreateModal();
});
logoutBtn?.addEventListener("click", logout);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCreateModal();
});

const startUsersPage = async () => {
  const user = await ensureAuthenticated();
  if (!user) return;
  await fetchUsers();
};

renderUsers();
setUserFormMode("create");
syncCreateSiteFieldState();
startUsersPage();
