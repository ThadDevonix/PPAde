(function () {
  const guideModal = document.getElementById("bill-guide-modal");
  const guideOpenBtns = document.querySelectorAll(".bill-guide-trigger");
  const guideCloseBtn = document.getElementById("bill-guide-close");
  const guideTocEl = document.getElementById("bill-guide-toc");
  const guideDetailEl = document.getElementById("bill-guide-detail");
  if (!guideModal || !guideOpenBtns.length || !guideTocEl || !guideDetailEl) return;

  const TOPICS_FALLBACK = [
    {
      id: "intro",
      title: "เริ่มต้นใช้งาน",
      pages: [
        {
          title: "ภาพรวมของระบบบิล",
          html: `
            <p>ระบบ Billing ของ PPAde รองรับการออกบิลค่าไฟ <strong>2 รูปแบบหลัก</strong>:</p>
            <ul class="guide-list">
              <li><strong>กำหนดวัน (Manual)</strong> — เลือกช่วงวันที่และอัตราเอง สร้างบิลทันที</li>
              <li><strong>อัตโนมัติ (Auto)</strong> — ตั้ง cutoff day ระบบจะออกบิลให้ตามรอบทุกเดือน</li>
            </ul>
            <p>การคำนวณรองรับทั้ง <strong>ค่าเดี่ยว</strong> (มิเตอร์ × field 1 ตัว) และ <strong>สูตรคำนวณ</strong> (เช่น meter A − meter B) พร้อมเพิ่ม <em>คอลัมน์เสริม</em> ในตารางบิลได้</p>
            <div class="guide-note">
              <strong>เริ่มที่ไหน?</strong>
              <p>เปิดหน้า Plant detail → กด tab <strong>Billing</strong> → จะเห็นแถบสลับ "ออกบิลแบบกำหนดวัน" / "ออกบิลอัตโนมัติ"</p>
            </div>`
        },
        {
          title: "สิทธิ์การใช้งาน",
          html: `
            <p>เพื่อสร้าง/แก้/ลบบิล ผู้ใช้ต้องมีสิทธิ์เข้าถึง Plant นั้น และมี role ตามตาราง:</p>
            <table class="guide-table">
              <thead>
                <tr><th>การกระทำ</th><th>Superadmin</th><th>Admin</th></tr>
              </thead>
              <tbody>
                <tr><td>ดูบิล</td><td>✅</td><td>✅ (เฉพาะ plant ในสิทธิ์)</td></tr>
                <tr><td>สร้าง/แก้บิล manual</td><td>✅</td><td>✅</td></tr>
                <tr><td>ตั้ง/แก้ auto schedule</td><td>✅</td><td>✅</td></tr>
                <tr><td>ลบบิล</td><td>✅</td><td>✅</td></tr>
                <tr><td>ลบ auto schedule (รีเซ็ตทั้งรอบ)</td><td>✅</td><td>❌</td></tr>
              </tbody>
            </table>
            <p class="guide-tip">ทุก action จะถูกบันทึกใน <strong>History Edit</strong> โดยอัตโนมัติ</p>`
        }
      ]
    },
    {
      id: "manual",
      title: "ออกบิลแบบกำหนดวัน",
      pages: [
        {
          title: "ขั้นตอนที่ 1 — เปิด modal",
          html: `
            <ol class="guide-steps">
              <li>เลือก tab <strong>"ออกบิลแบบกำหนดวัน"</strong> ในแถบ Billing</li>
              <li>กดปุ่ม <strong>"+ สร้างบิลใหม่"</strong> มุมขวาบน</li>
              <li>Modal "สร้างใบแจ้งค่าไฟ" จะเปิดขึ้นมา</li>
            </ol>`
        },
        {
          title: "ขั้นตอนที่ 2 — ตั้งช่วงวันที่",
          html: `
            <p>กรอกข้อมูลในส่วนแรก:</p>
            <ul class="guide-list">
              <li><strong>วันที่เริ่ม</strong> — วันแรกของรอบ (เช่น 1/05/2569)</li>
              <li><strong>ถึงวันที่</strong> — วันสุดท้าย (เช่น 31/05/2569)</li>
            </ul>
            <div class="guide-warn">
              <strong>ข้อจำกัด</strong>
              <p>ช่วงวันที่ออกบิลได้สูงสุด 60 วัน หากเกินระบบจะแจ้งเตือน</p>
            </div>`
        },
        {
          title: "ขั้นตอนที่ 3 — อัตราและประเภท",
          html: `
            <ul class="guide-list">
              <li><strong>อัตรา (฿/kWh)</strong> — ราคาต่อหน่วย (รับทศนิยม 3 ตำแหน่ง)</li>
              <li><strong>ประเภทอัตรา</strong> — เลือก "Flat rate" (อัตราเดียว) หรือ "TOU" (Time of Use)</li>
            </ul>`
        },
        {
          title: "ขั้นตอนที่ 4 — รูปแบบคำนวณหน่วย",
          html: `
            <p>เลือก 1 ใน 2 รูปแบบ:</p>
            <ul class="guide-list">
              <li><strong>ออกบิลค่าเดี่ยว</strong> — เลือกมิเตอร์ 1 ตัว + field 1 ค่า</li>
              <li><strong>ออกบิลแบบคำนวณ</strong> — สร้างสูตร 2 พจน์ เช่น <code>meter-A.energy_in − meter-B.energy_out</code></li>
            </ul>
            <p>กดปุ่ม reset (วงกลมลูกศร) ถ้าอยากล้างค่าเริ่มใหม่</p>`
        },
        {
          title: "ขั้นตอนที่ 5 — ยืนยัน",
          html: `
            <ol class="guide-steps">
              <li>ตรวจสอบข้อมูลทั้งหมด</li>
              <li>กดปุ่ม <strong>"สร้างบิล"</strong></li>
              <li>ระบบจะแสดง <strong>spinner กำลังสร้างบิล...</strong> ขณะดึงข้อมูลรายวันจาก API</li>
              <li>เมื่อเสร็จ alert จะแจ้งหมายเลขใบบิล + ยอดรวม</li>
              <li>บิลปรากฏในตารางประวัติด้านล่าง</li>
            </ol>
            <div class="guide-tip">หากเกิด error ระหว่างสร้าง ระบบจะแจ้งเตือน — ตรวจสอบเครือข่าย/สิทธิ์ผู้ใช้แล้วลองอีกครั้ง</div>`
        }
      ]
    },
    {
      id: "auto",
      title: "ออกบิลอัตโนมัติ",
      pages: [
        {
          title: "Auto Schedule คืออะไร",
          html: `
            <p>Auto Schedule = รอบบิลที่ตั้งไว้ล่วงหน้า ระบบจะออกบิลให้อัตโนมัติเมื่อถึงวันที่ตัดรอบของแต่ละเดือน</p>
            <ul class="guide-list">
              <li>กำหนด <strong>cutoff day</strong> 1–31 (เช่น 5 = ตัดรอบทุกวันที่ 5)</li>
              <li>1 plant ตั้งได้หลายรอบ (เช่น วันที่ 5 + วันที่ 25)</li>
              <li>เมื่อถึงวัน → ระบบดึงข้อมูล + capture เลขมิเตอร์ live + สร้างบิล + บันทึกใน history</li>
            </ul>`
        },
        {
          title: "ขั้นตอนตั้งรอบใหม่",
          html: `
            <ol class="guide-steps">
              <li>เลือก tab <strong>"ออกบิลอัตโนมัติ"</strong></li>
              <li>กด <strong>"ตั้งค่าอัตโนมัติ"</strong></li>
              <li>เลือก cutoff day, อัตรา, รูปแบบคำนวณ, มิเตอร์</li>
              <li>กด <strong>"บันทึกอัตโนมัติ"</strong></li>
              <li>รอบจะปรากฏในตาราง "รายการรอบบิลอัตโนมัติที่ตั้งค่าไว้"</li>
            </ol>`
        },
        {
          title: "ดูตัวอย่าง / ออกบิลทันที",
          html: `
            <p>ในตารางรอบอัตโนมัติแต่ละรายการ มี action:</p>
            <ul class="guide-list">
              <li><strong>"ดูตัวอย่าง"</strong> — preview บิลของรอบล่าสุดเต็มเดือน (ยังไม่ commit)</li>
              <li><strong>"ดูตัวอย่างปัจจุบัน"</strong> — preview ตั้งแต่ต้นรอบ ถึงวันนี้ (partial)</li>
              <li><strong>"สร้างบิล"</strong> — ออกบิลทันทีด้วยข้อมูลที่ครบถึงปัจจุบัน บันทึกใน history</li>
            </ul>`
        },
        {
          title: "ลบ / แก้รอบ",
          html: `
            <ul class="guide-list">
              <li><strong>แก้</strong> — กด edit ที่รอบใน modal — เปลี่ยนค่าได้ทุกอย่าง</li>
              <li><strong>ลบ</strong> — Superadmin เท่านั้น (Admin ลบไม่ได้)</li>
              <li>ทุกการเปลี่ยนแปลงบันทึกใน <strong>History Edit</strong></li>
            </ul>`
        },
        {
          title: "เลขมิเตอร์ก่อน / หลัง",
          html: `
            <p>บิล <strong>auto</strong> เท่านั้นที่บันทึกเลขมิเตอร์สะสม (Live API totalizer):</p>
            <ul class="guide-list">
              <li><strong>"หลัง"</strong> = ค่า kWh ปัจจุบันจาก API ตอนสร้างบิล</li>
              <li><strong>"ก่อน"</strong> = ค่า "หลัง" ของบิล auto ใบก่อนหน้า (plant + meter เดียวกัน)</li>
              <li>บิลแรกของ meter จะแสดง "—" ในช่อง "ก่อน" (ไม่มีอ้างอิง)</li>
            </ul>
            <p>แสดงเป็นการ์ดเล็กต่อมิเตอร์บนหัวบิล (preview + PDF)</p>`
        }
      ]
    },
    {
      id: "formula",
      title: "สูตร / คอลัมน์เสริม",
      pages: [
        {
          title: "สูตรพื้นฐาน 2 พจน์",
          html: `
            <p>โหมด "ออกบิลแบบคำนวณ" สร้างสูตรจากมิเตอร์ 2 ตัว ตัวคั่นด้วย operator <code>+ − × ÷</code></p>
            <p class="guide-example">ตัวอย่าง: <code>Solar.energy_in − MDB.energy_out</code> = energy net ที่เหลือใช้</p>
            <ul class="guide-list">
              <li>เลือก <strong>มิเตอร์ A</strong> + field A</li>
              <li>เลือก <strong>operator</strong> (+, −, ×, ÷)</li>
              <li>เลือก <strong>มิเตอร์ B</strong> + field B</li>
              <li>ตั้ง <strong>"ชื่อผลคำนวณ"</strong> ที่จะใช้แสดงในใบบิล</li>
            </ul>`
        },
        {
          title: "Formula Columns — เพิ่มคอลัมน์",
          html: `
            <p>ตารางบิลปกติมี 1 คอลัมน์ผลรวม (จากสูตรหลัก) แต่คุณเพิ่มได้อีกหลายคอลัมน์:</p>
            <ol class="guide-steps">
              <li>กด <strong>"+ เพิ่มคอลัมน์"</strong> — เพิ่มคอลัมน์แบบ basic (มิเตอร์ × field)</li>
              <li>กด <strong>"+ เพิ่มคอลัมคำนวณ"</strong> — เพิ่มคอลัมน์ที่มีสูตร (เหมือนพื้นฐาน 2 พจน์)</li>
              <li>กด <strong>"ลบคอลัมน์"</strong> — ลบคอลัมน์ล่าสุด</li>
            </ol>
            <p>แต่ละคอลัมน์มี <strong>checkbox include</strong> — ติ๊ก = นับรวมในยอด, ไม่ติ๊ก = แสดงค่าแต่ไม่นับ</p>`
        },
        {
          title: "ตัวอย่าง use case",
          html: `
            <ul class="guide-list">
              <li><strong>โซลาร์ + กริด</strong>: คอลัมน์ Solar / MDB In / MDB Out / Net (excluded)</li>
              <li><strong>หลายมิเตอร์ tenant</strong>: คอลัมน์ tenant 1 / tenant 2 / tenant 3 รวมยอด</li>
              <li><strong>หักลดหย่อน</strong>: คอลัมน์ raw + คอลัมน์ส่วนลด (excluded)</li>
            </ul>`
        }
      ]
    },
    {
      id: "preview",
      title: "Preview & PDF",
      pages: [
        {
          title: "ดูตัวอย่างบิล",
          html: `
            <p>คลิก <strong>"ดูตัวอย่าง"</strong> ที่แถวบิลในประวัติ</p>
            <ul class="guide-list">
              <li>เปิด modal ขนาด A4 — pagination ตามจำนวนแถวรายวัน</li>
              <li>หัวบิลมี ข้อมูลบริษัท + รายละเอียดงวด</li>
              <li>ใบ auto: มีตารางสรุปเลขมิเตอร์ก่อน/หลังต่อมิเตอร์</li>
              <li>ตารางรายวัน + ผลรวม</li>
              <li>ผลสรุปยอดรวม + ราคา</li>
            </ul>`
        },
        {
          title: "ดาวน์โหลด PDF",
          html: `
            <ol class="guide-steps">
              <li>เปิด preview ของบิล</li>
              <li>กด <strong>"ดาวน์โหลด PDF"</strong></li>
              <li>ระบบใช้ <code>window.print()</code> ของ browser → เลือก "Save as PDF"</li>
              <li>ตั้ง paper size: A4, margins: None</li>
            </ol>
            <p class="guide-tip">PDF จะคงสีตารางและการ์ดเลขมิเตอร์เหมือนใน preview</p>`
        }
      ]
    },
    {
      id: "history",
      title: "History Edit",
      pages: [
        {
          title: "ทุก action ถูกบันทึก",
          html: `
            <p>tab <strong>"History Edit"</strong> ใน Plant detail แสดง audit log ของทุกการเปลี่ยนแปลง:</p>
            <ul class="guide-list">
              <li><strong>สร้างบิล</strong> (manual + auto) — เขียวเข้ม</li>
              <li><strong>ลบบิล</strong> — แดง</li>
              <li><strong>เพิ่ม/ลบ/แก้ auto schedule</strong> — เหลือง / เขียว / แดง</li>
            </ul>
            <p>แต่ละ entry: avatar + ชื่อ + role + รายละเอียด + เวลา (relative + absolute)</p>`
        },
        {
          title: "Filter",
          html: `
            <ul class="guide-list">
              <li><strong>ประเภท</strong>: ทั้งหมด / บิล / รอบอัตโนมัติ</li>
              <li><strong>วันที่</strong>: เลือกวันใน date picker → แสดงเฉพาะวันนั้น</li>
              <li>กดปุ่ม <strong>🔄</strong> เพื่อโหลดข้อมูลล่าสุดจาก server</li>
            </ul>`
        },
        {
          title: "ใครเห็น log ใครได้บ้าง",
          html: `
            <p>Audit log <strong>shared per plant</strong> — ใครก็ตามที่เข้า Plant ได้ จะเห็น log ทั้งหมดของ Plant นั้น (ไม่ filter ตาม actor)</p>
            <p>ข้อมูล <code>actor</code> มาจาก server session — ปลอมไม่ได้ฝั่ง client</p>
            <p>เก็บล่าสุด 500 entries ต่อ plant — เก่ากว่านั้นจะถูกตัดออก</p>`
        }
      ]
    }
  ];

  const getTopics = () => {
    if (typeof window.getI18nGuideTopics === "function") {
      const topics = window.getI18nGuideTopics();
      if (Array.isArray(topics) && topics.length) return topics;
    }
    return TOPICS_FALLBACK;
  };

  let activeTopicId = getTopics()[0].id;
  let activePageIndex = 0;

  const escapeHtml = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);

  const findTopic = (id) => {
    const topics = getTopics();
    return topics.find((t) => t.id === id) || topics[0];
  };

  const renderToc = () => {
    guideTocEl.innerHTML = getTopics().map(
      (topic, index) => `
        <button class="bill-guide-toc-item ${topic.id === activeTopicId ? "active" : ""}"
                data-topic-id="${escapeHtml(topic.id)}"
                type="button">
          <span class="bill-guide-toc-num">${index + 1}</span>
          <span class="bill-guide-toc-text">${escapeHtml(topic.title)}</span>
          <span class="bill-guide-toc-meta">${topic.pages.length}</span>
        </button>`
    ).join("");
  };

  const renderDetail = () => {
    const topic = findTopic(activeTopicId);
    const totalPages = topic.pages.length;
    const safeIndex = Math.max(0, Math.min(activePageIndex, totalPages - 1));
    activePageIndex = safeIndex;
    const page = topic.pages[safeIndex];
    const tt = (key, fallback, params) => {
      if (typeof window.t === "function") {
        const v = window.t(key, params);
        if (v !== key) return v;
      }
      return params
        ? String(fallback || "").replace(/\{(\w+)\}/g, (_m, k) => params[k] ?? "")
        : fallback || "";
    };
    const pagerHtml =
      totalPages > 1
        ? `
          <nav class="bill-guide-pager" aria-label="${escapeHtml(tt("guide.title", "Guide"))}">
            <button class="bill-guide-pager-btn" data-pager="prev" type="button" ${safeIndex === 0 ? "disabled" : ""}>${escapeHtml(tt("guide.pager.prev", "‹ ก่อนหน้า"))}</button>
            <div class="bill-guide-pager-numbers">
              ${topic.pages
                .map(
                  (_, i) =>
                    `<button class="bill-guide-pager-num ${i === safeIndex ? "active" : ""}" data-pager-idx="${i}" type="button" aria-label="${i + 1}">${i + 1}</button>`
                )
                .join("")}
            </div>
            <button class="bill-guide-pager-btn" data-pager="next" type="button" ${safeIndex === totalPages - 1 ? "disabled" : ""}>${escapeHtml(tt("guide.pager.next", "ถัดไป ›"))}</button>
          </nav>`
        : "";
    const progressText = tt("guide.page_progress", "หน้า {current} จาก {total}", {
      current: safeIndex + 1,
      total: totalPages
    });
    guideDetailEl.innerHTML = `
      <header class="bill-guide-detail-head">
        <p class="bill-guide-eyebrow">${escapeHtml(topic.title)}</p>
        <h4 class="bill-guide-detail-title">${escapeHtml(page.title)}</h4>
        ${totalPages > 1 ? `<p class="bill-guide-detail-progress">${escapeHtml(progressText)}</p>` : ""}
      </header>
      <div class="bill-guide-detail-body">${page.html}</div>
      ${pagerHtml}`;
    guideDetailEl.scrollTop = 0;
  };

  const render = () => {
    // Re-resolve in case lang changed and active id is no longer valid
    const topics = getTopics();
    if (!topics.find((t) => t.id === activeTopicId)) {
      activeTopicId = topics[0].id;
      activePageIndex = 0;
    }
    renderToc();
    renderDetail();
  };
  window.renderBillGuide = render;

  guideTocEl.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-topic-id]");
    if (!btn) return;
    const id = btn.getAttribute("data-topic-id");
    if (!id || id === activeTopicId) return;
    activeTopicId = id;
    activePageIndex = 0;
    render();
  });

  guideDetailEl.addEventListener("click", (event) => {
    const numBtn = event.target.closest("[data-pager-idx]");
    if (numBtn) {
      const idx = Number(numBtn.getAttribute("data-pager-idx"));
      if (Number.isFinite(idx)) {
        activePageIndex = idx;
        renderDetail();
      }
      return;
    }
    const stepBtn = event.target.closest("[data-pager]");
    if (stepBtn) {
      const dir = stepBtn.getAttribute("data-pager");
      const topic = findTopic(activeTopicId);
      if (dir === "prev" && activePageIndex > 0) activePageIndex -= 1;
      if (dir === "next" && activePageIndex < topic.pages.length - 1) activePageIndex += 1;
      renderDetail();
    }
  });

  const openModal = () => {
    if (!guideModal) return;
    guideModal.classList.remove("hidden");
    render();
    document.body.classList.add("bill-guide-open");
  };
  const closeModal = () => {
    if (!guideModal) return;
    guideModal.classList.add("hidden");
    document.body.classList.remove("bill-guide-open");
  };

  guideOpenBtns.forEach((btn) => btn.addEventListener("click", openModal));
  guideCloseBtn?.addEventListener("click", closeModal);
  guideModal.addEventListener("click", (event) => {
    if (event.target === guideModal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !guideModal.classList.contains("hidden")) {
      closeModal();
    }
  });
})();
