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
const newUserEmailInput = document.getElementById("new-user-email");
const newUserNameInput = document.getElementById("new-user-name");
const newUserPasswordInput = document.getElementById("new-user-password");
const newUserRoleInput = document.getElementById("new-user-role");
const newUserActiveInput = document.getElementById("new-user-active");

let users = [];
let currentUser = null;
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

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const redirectToLogin = () => {
  window.location.href = "/login/index.html";
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

const normalizeUser = (row) => {
  if (!row || typeof row !== "object") return null;
  const email = normalizeEmail(row.email ?? row.user_email ?? row.userEmail ?? row.username);
  const id = row.id ?? row.user_id ?? row.userId;
  if (id === undefined || id === null || !email) return null;
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
    role: readString(row.role, row.user_role, row.userRole) || "user",
    isActive: Number(row.is_active ?? row.isActive ?? row.active ?? 1) !== 0,
    lastLoginAt: readString(row.last_login_at, row.lastLoginAt),
    createdAt: readString(row.created_at, row.createdAt)
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

const buildUsersApiUrl = (page, limit) => {
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
          <button
            class="small-btn users-delete-btn"
            type="button"
            data-action="delete"
            data-id="${escapeHtml(String(user.id))}"
            ${isCurrentUser ? "disabled aria-disabled=\"true\" title=\"ไม่สามารถลบบัญชีที่กำลังใช้งาน\"" : ""}
          >
            ลบ
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  userRowsEl.querySelectorAll('button[data-action="delete"]').forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-id");
      if (!id) return;
      const target = users.find((item) => String(item.id) === id);
      if (target) {
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
      if (pageRows.length >= pageLimit) {
        page += 1;
        continue;
      }
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

const closeCreateModal = () => {
  createModal?.classList.add("hidden");
  createForm?.reset();
  if (newUserRoleInput) newUserRoleInput.value = "admin";
  if (newUserActiveInput) newUserActiveInput.value = "1";
};

const openCreateModal = () => {
  createModal?.classList.remove("hidden");
  newUserEmailInput?.focus();
};

const createUser = async () => {
  const email = normalizeEmail(newUserEmailInput?.value);
  const name = readString(newUserNameInput?.value);
  const password = String(newUserPasswordInput?.value || "");
  const role = readString(newUserRoleInput?.value) || "user";
  const isActive = newUserActiveInput?.value === "1";

  if (!email || !name || !password) {
    setMessage("กรุณากรอกข้อมูล Email, Name และ Password ให้ครบ", "error");
    return;
  }
  if (password.length < 8) {
    setMessage("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "error");
    return;
  }

  createSubmitBtn.disabled = true;
  createSubmitBtn.textContent = "กำลังบันทึก...";
  setMessage("");

  const payload = {
    email,
    name,
    password,
    role,
    is_active: isActive ? 1 : 0,
    isActive: isActive ? 1 : 0
  };

  try {
    const response = await fetchWithTimeout("/api/users", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const body = await parseResponsePayload(response);
    if (!response.ok) {
      throw new Error(responseMessage(body, "เพิ่มผู้ใช้ไม่สำเร็จ"));
    }
    closeCreateModal();
    setMessage("เพิ่มผู้ใช้สำเร็จ", "success");
    await fetchUsers();
  } catch (error) {
    setMessage(friendlyErrorMessage(error, "เพิ่มผู้ใช้ไม่สำเร็จ"), "error");
  } finally {
    createSubmitBtn.disabled = false;
    createSubmitBtn.textContent = "บันทึก";
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
openCreateBtn?.addEventListener("click", openCreateModal);
createSubmitBtn?.addEventListener("click", () => {
  void createUser();
});
createForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  void createUser();
});
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
startUsersPage();
