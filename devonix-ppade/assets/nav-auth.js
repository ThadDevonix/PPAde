(function () {
  const authUserEl = document.getElementById("auth-user");
  const logoutBtn = document.getElementById("logout-btn");
  if (!authUserEl && !logoutBtn) return;

  const redirectToLogin = () => {
    const here = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const params = new URLSearchParams();
    params.set("redirect", here);
    window.location.href = `/login/index.html?${params.toString()}`;
  };

  const fetchMe = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      return data?.user || null;
    } catch (_err) {
      return null;
    }
  };

  const doLogout = async () => {
    if (logoutBtn) {
      logoutBtn.disabled = true;
      logoutBtn.textContent = "กำลังออกจากระบบ...";
    }
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch (_err) {
      // ignore — force redirect regardless
    }
    redirectToLogin();
  };

  if (logoutBtn) logoutBtn.addEventListener("click", doLogout);

  fetchMe().then((user) => {
    if (!user) {
      redirectToLogin();
      return;
    }
    if (authUserEl) {
      const label = user.name || user.email || "ผู้ใช้งาน";
      authUserEl.textContent = `ผู้ใช้: ${label}`;
    }
  });
})();
