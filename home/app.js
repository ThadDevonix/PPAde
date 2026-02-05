const plants = [
  {
    name: "โฟนิคส์ สํานักงานใหญ่ 10kW",
    country: "Thailand",
    deviceType: "Inverter",
    deviceSn: "SN-TH-001",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-001-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-001-B", status: "online" }
    ]
  },
  {
    name: "โรงเรียนศรีษาบุตรสกุล 80kW อาคารหอประชุม",
    country: "Thailand",
    deviceType: "Inverter",
    deviceSn: "SN-TH-002",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-002-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-002-B", status: "online" }
    ]
  },
  {
    name: "Narai Hill Golf Resort Country Club 50 kW",
    country: "Thailand",
    deviceType: "Meter",
    deviceSn: "SN-TH-003",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-003-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-003-B", status: "online" }
    ]
  },
  {
    name: "บริษัทศรีน้องพาณิชย์ จ.กระบี่",
    country: "Thailand",
    deviceType: "Logger",
    deviceSn: "SN-TH-004",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-004-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-004-B", status: "online" }
    ]
  },
  {
    name: "PEA โรงเรียนชาติเชียรแม่ป่าไผ่ 5kW+op+batt",
    country: "Thailand",
    deviceType: "Inverter",
    deviceSn: "SN-TH-005",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-005-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-005-B", status: "online" }
    ]
  },
  {
    name: "PEA โรงเรียนพิจองซิง จ.แม่ฮาย 5kW+op+batt",
    country: "Thailand",
    deviceType: "Inverter",
    deviceSn: "SN-TH-006",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-006-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-006-B", status: "online" }
    ]
  },
  {
    name: "PEA โรงเรียนเข้นหัวเวียง 5kW+op+batt",
    country: "Thailand",
    deviceType: "Logger",
    deviceSn: "SN-TH-007",
    status: "online",
    devices: [
      { name: "Meter A", sn: "SN-TH-007-A", status: "online" },
      { name: "Meter B", sn: "SN-TH-007-B", status: "online" }
    ]
  }
];

const rowsEl = document.getElementById("rows");
const inputs = {
  plant: document.getElementById("plant")
};

const render = (data) => {
  if (!data.length) {
    rowsEl.innerHTML = '<tr><td class="empty" colspan="3">ไม่พบข้อมูล</td></tr>';
    return;
  }

  rowsEl.innerHTML = data.map((item, idx) => `
    <tr data-index="${idx}">
      <td><span class="status-dot" title="online"></span></td>
      <td><div class="img-ph" aria-label="ภาพโรงไฟฟ้า (placeholder)"></div></td>
      <td>
        <div class="name">${item.name}</div>
      </td>
    </tr>
  `).join("");

  rowsEl.querySelectorAll("tr").forEach((tr) => {
    tr.addEventListener("click", () => {
      const idx = Number(tr.dataset.index);
      const plant = data[idx];
      if (!plant) return;
      localStorage.setItem("selectedPlant", JSON.stringify(plant));
      window.location.href = "./plant.html";
    });
  });
};

const applyFilters = () => {
  const plantText = inputs.plant.value.trim().toLowerCase();

  const filtered = plants.filter((p) => {
    const matchesPlant = !plantText || p.name.toLowerCase().includes(plantText);
    return matchesPlant;
  });
  render(filtered);
};

document.getElementById("search").addEventListener("click", applyFilters);
document.getElementById("reset").addEventListener("click", () => {
  Object.values(inputs).forEach((el) => { el.value = ""; });
  applyFilters();
});

Object.values(inputs).forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFilters();
  });
});

render(plants);
