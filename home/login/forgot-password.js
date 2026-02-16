const form = document.getElementById("forgot-form");
const emailInput = document.getElementById("forgot-email");
const submitBtn = document.getElementById("forgot-submit");
const messageEl = document.getElementById("forgot-message");

const setMessage = (text, type = "info") => {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.classList.remove("error", "success");
  if (type === "error") messageEl.classList.add("error");
  if (type === "success") messageEl.classList.add("success");
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = emailInput?.value.trim();
  if (!email) {
    setMessage("กรุณากรอกอีเมล", "error");
    return;
  }

  submitBtn.disabled = true;
  setMessage("กำลังส่งคำขอ...");

  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({ email })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.message || "ส่งคำขอไม่สำเร็จ", "error");
      return;
    }
    setMessage(
      payload.message || "หากอีเมลนี้มีในระบบ เราจะส่งลิงก์รีเซ็ตไปให้",
      "success"
    );
    form.reset();
  } catch {
    setMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
  } finally {
    submitBtn.disabled = false;
  }
});
