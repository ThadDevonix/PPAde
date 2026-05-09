const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordToggleBtn = document.getElementById("password-toggle");
const passwordToggleText = document.querySelector(".password-toggle-text");
const submitBtn = document.getElementById("login-submit");
const messageEl = document.getElementById("login-message");

function tLogin(key, fallback, params) {
  if (typeof window.t === "function") {
    const v = window.t(key, params);
    if (v !== key) return v;
  }
  return params
    ? String(fallback || "").replace(/\{(\w+)\}/g, (_m, k) => params[k] ?? "")
    : fallback || "";
}

const setPasswordVisibility = (isVisible) => {
  if (!passwordInput || !passwordToggleBtn) return;
  passwordInput.type = isVisible ? "text" : "password";
  passwordToggleBtn.classList.toggle("is-visible", isVisible);
  passwordToggleBtn.setAttribute("aria-pressed", isVisible ? "true" : "false");
  const buttonLabel = isVisible
    ? tLogin("login.action.hide_password", "ซ่อนรหัสผ่าน")
    : tLogin("login.action.show_password", "แสดงรหัสผ่าน");
  passwordToggleBtn.setAttribute("aria-label", buttonLabel);
  passwordToggleBtn.setAttribute("title", buttonLabel);
  if (passwordToggleText) passwordToggleText.textContent = buttonLabel;
};

const setMessage = (text, type = "info") => {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.classList.remove("error", "success");
  if (type === "error") messageEl.classList.add("error");
  if (type === "success") messageEl.classList.add("success");
};

const resolveDefaultAppPath = () => {
  const path = window.location.pathname;
  if (path.endsWith("/login/index.html")) {
    return path.replace(/\/login\/index\.html$/, "/index.html");
  }
  if (path.endsWith("/login/")) {
    return path.replace(/\/login\/$/, "/index.html");
  }
  if (path.endsWith("/login")) {
    return path.replace(/\/login$/, "/index.html");
  }
  return "/index.html";
};

const resolveRedirectTarget = () => {
  const defaultPath = resolveDefaultAppPath();
  const rawTarget = new URLSearchParams(window.location.search).get("redirect");
  if (!rawTarget) return defaultPath;
  try {
    const targetUrl = new URL(rawTarget, window.location.origin);
    if (targetUrl.origin !== window.location.origin) return defaultPath;
    const targetPath = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    if (!targetPath.startsWith("/")) return defaultPath;
    if (
      targetPath === "/login" ||
      targetPath === "/login/" ||
      targetPath === "/login/index.html"
    ) {
      return defaultPath;
    }
    return targetPath;
  } catch {
    return defaultPath;
  }
};

const redirectToApp = () => {
  window.location.replace(resolveRedirectTarget());
};

const checkSession = async () => {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "same-origin"
    });
    if (response.ok) redirectToApp();
  } catch {
    // ignore session check errors
  }
};

passwordToggleBtn?.addEventListener("click", () => {
  const isVisible = passwordInput?.type === "text";
  setPasswordVisibility(!isVisible);
});

setPasswordVisibility(false);

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput?.value.trim();
  const password = passwordInput?.value || "";
  if (!email || !password) {
    setMessage(tLogin("login.message.fill_required", "กรุณากรอกอีเมลและรหัสผ่าน"), "error");
    return;
  }

  submitBtn.disabled = true;
  setMessage(tLogin("login.message.signing_in", "กำลังเข้าสู่ระบบ..."));

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.message || tLogin("login.message.failed", "เข้าสู่ระบบไม่สำเร็จ"), "error");
      return;
    }

    setMessage(tLogin("login.message.success", "เข้าสู่ระบบสำเร็จ"), "success");
    redirectToApp();
  } catch {
    setMessage(tLogin("login.message.network_error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"), "error");
  } finally {
    submitBtn.disabled = false;
  }
});

checkSession();

document.addEventListener("i18n:changed", () => {
  try { setPasswordVisibility(passwordInput?.type === "text"); } catch { /* ignore */ }
});
