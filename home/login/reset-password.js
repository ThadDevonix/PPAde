const form = document.getElementById("reset-form");
const passwordInput = document.getElementById("new-password");
const confirmInput = document.getElementById("confirm-password");
const submitBtn = document.getElementById("reset-submit");
const messageEl = document.getElementById("reset-message");
const token = new URLSearchParams(window.location.search).get("token") || "";

const setMessage = (text, type = "info") => {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.classList.remove("error", "success");
  if (type === "error") messageEl.classList.add("error");
  if (type === "success") messageEl.classList.add("success");
};

if (!token) {
  setMessage("ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน", "error");
  submitBtn.disabled = true;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!token) return;

  const password = passwordInput?.value || "";
  const confirmPassword = confirmInput?.value || "";

  if (password.length < 8) {
    setMessage("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "error");
    return;
  }
  if (password !== confirmPassword) {
    setMessage("รหัสผ่านใหม่ไม่ตรงกัน", "error");
    return;
  }

  submitBtn.disabled = true;
  setMessage("กำลังบันทึกรหัสผ่านใหม่...");

  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token, password })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.message || "รีเซ็ตรหัสผ่านไม่สำเร็จ", "error");
      return;
    }

    setMessage("รีเซ็ตรหัสผ่านสำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ...", "success");
    setTimeout(() => {
      window.location.replace("/login/index.html");
    }, 900);
  } catch {
    setMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
  } finally {
    submitBtn.disabled = false;
  }
});
