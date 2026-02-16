const resendApiUrl = process.env.AUTH_MAIL_API_URL || "https://api.resend.com/emails";
const resendApiKey = process.env.RESEND_API_KEY || "";
const mailFrom = process.env.AUTH_MAIL_FROM || "";
const allowLogFallback = process.env.AUTH_DEV_RESET_LOG !== "false";

const renderResetEmailHtml = (name, resetUrl) => `
  <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">
    <h2 style="margin:0 0 12px">รีเซ็ตรหัสผ่าน</h2>
    <p style="margin:0 0 10px">สวัสดี ${name},</p>
    <p style="margin:0 0 12px">
      มีคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีนี้ กรุณากดลิงก์ด้านล่างเพื่อกำหนดรหัสผ่านใหม่
    </p>
    <p style="margin:0 0 14px">
      <a href="${resetUrl}" style="color:#2563eb;text-decoration:underline">ตั้งรหัสผ่านใหม่</a>
    </p>
    <p style="margin:0;color:#64748b;font-size:13px">
      ลิงก์นี้มีอายุจำกัด หากคุณไม่ได้ทำรายการนี้ สามารถเพิกเฉยต่ออีเมลนี้ได้
    </p>
  </div>
`;

export const sendResetPasswordEmail = async ({ to, name, resetUrl }) => {
  if (!resendApiKey || !mailFrom) {
    if (allowLogFallback) {
      console.info(`[AUTH] Reset link for ${to}: ${resetUrl}`);
    }
    return { delivered: false, provider: "log" };
  }

  const payload = {
    from: mailFrom,
    to: [to],
    subject: "รีเซ็ตรหัสผ่านบัญชี PPAde",
    html: renderResetEmailHtml(name || to, resetUrl)
  };

  const response = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`ส่งอีเมลรีเซ็ตรหัสผ่านไม่สำเร็จ (${response.status}) ${detail}`);
  }

  return { delivered: true, provider: "resend" };
};
