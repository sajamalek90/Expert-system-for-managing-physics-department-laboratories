window.onload = function () {
  fetchDataAndDisplay();
  fetchMaintenanceHistory();
  populateDeviceList();
  fetchMaintenanceAnalytics(); // جلب بيانات تحليل الصيانة
  showSection("maintenanceSection");
  updateNotificationCount();
};

// تعبئة قائمة الأجهزة يدويًا
function populateDeviceList() {
  const deviceList = [
    "جهاز قياس الحرارة",
    "مجهر إلكتروني",
    "جهاز تحليل الدم",
    "جهاز قياس الضغط",
    "جهاز الأشعة السينية",
    "جهاز قياس السكر",
    "جهاز التصوير المقطعي",
    "جهاز قياس الكوليسترول",
    "جهاز تحليل البول",
    "جهاز قياس النبض",
    "جهاز التنفس الصناعي"
  ];
  const deviceSelect = document.getElementById("deviceNameInput");
  deviceList.forEach(device => {
    const option = document.createElement("option");
    option.value = device;
    option.textContent = device;
    deviceSelect.appendChild(option);
  });
}

// جلب بيانات الصيانة المجدولة من الـ API وعرضها
function fetchDataAndDisplay() {
  fetch("http://labmangmentsystemapi.runasp.net/api/Maintenance/all")
    .then(response => {
      if (!response.ok) throw new Error("حدث خطأ أثناء جلب البيانات");
      return response.json();
    })
    .then(data => {
      populateMaintenanceTable(data);
    })
    .catch(error => {
      console.error("فشل في تحميل البيانات:", error);
      alert("تعذر تحميل بيانات الصيانة من الخادم.");
    });
}

// جلب سجل الصيانة التاريخي من الـ API وعرضه
function fetchMaintenanceHistory() {
  fetch("http://labmangmentsystemapi.runasp.net/api/Maintenance/MaintenanceHistory")
    .then(response => {
      if (!response.ok) throw new Error("حدث خطأ أثناء جلب سجل الصيانة");
      return response.json();
    })
    .then(data => {
      populateMaintenanceHistoryTable(data);
    })
    .catch(error => {
      console.error("فشل في تحميل سجل الصيانة:", error);
      alert("تعذر تحميل سجل الصيانة من الخادم.");
    });
}

// جلب بيانات تحليل الصيانة من الـ API
function fetchMaintenanceAnalytics() {
  fetch("https://phy-lab-3-production.up.railway.app/maintenance/analytics")
    .then(response => {
      if (!response.ok) throw new Error("حدث خطأ أثناء جلب بيانات التحليل");
      return response.json();
    })
    .then(data => {
      if (data.success) {
        populateFutureMaintenanceTable(data.future_maintenance);
        if (typeof Chart !== "undefined") {
          createMonthlyCostChart(data.monthly_costs);
          createMaintenanceFrequencyChart(data.maintenance_frequency);
        } else {
          console.error("Chart.js غير متاح. تأكدي من تحميل المكتبة.");
          alert("تعذر تحميل الرسوم البيانية. تأكدي من تحميل مكتبة Chart.js.");
        }
      } else {
        throw new Error("فشل في جلب بيانات التحليل");
      }
    })
    .catch(error => {
      console.error("فشل في تحميل بيانات التحليل:", error);
      alert("تعذر تحميل بيانات تحليل الصيانة من الخادم.");
    });
}

// تعبئة جدول الصيانة المجدولة بالبيانات
function populateMaintenanceTable(data) {
  console.log("البيانات المستلمة من API:", data);

  const tableBody = document.getElementById("maintenanceTableBody");
  tableBody.innerHTML = "";

  const statusDisplayMap = {
    "Scheduled": "مجدولة",
    "InProgress": "قيد التنفيذ",
    "Completed": "مكتملة",
    "Cancelled": "ملغاة"
  };

  const priorityDisplayMap = {
    "High": "عالية",
    "Medium": "متوسطة",
    "Low": "منخفضة",
    "1": "عالية"
  };

  data.forEach(record => {
    const row = document.createElement("tr");
    row.dataset.id = record.id;

    const priorityClass = record.priority === "High" || record.priority === "1" ? "bg-danger" :
      record.priority === "Medium" ? "bg-warning text-dark" : "bg-success";

    const statusClass = record.status === "Scheduled" ? "bg-info" :
      record.status === "InProgress" ? "bg-warning text-dark" :
      record.status === "Completed" ? "bg-success" : "bg-secondary";

    const actionButtons = `
      ${record.status === "Scheduled" ? '<button class="btn btn-primary btn-sm start-btn">بدء</button>' : ''}
      ${record.status === "InProgress" ? '<button class="btn btn-success btn-sm complete-btn">إكمال</button>' : ''}
      <button class="btn btn-outline-primary btn-sm edit-btn">تعديل</button>
      <button class="btn btn-outline-danger btn-sm delete-btn">إلغاء</button>
    `;

    row.innerHTML = `
      <td>${record.deviceName}</td>
      <td>${record.maintenanceType || "غير محدد"}</td>
      <td>${record.scheduledDate ? record.scheduledDate.split("T")[0] : "-"}</td>
      <td>${record.responsible}</td>
      <td>${record.reason || "غير محدد"}</td>
      <td><span class="badge ${priorityClass}">${priorityDisplayMap[record.priority] || record.priority || "غير محدد"}</span></td>
      <td><span class="badge ${statusClass}">${statusDisplayMap[record.status] || record.status}</span></td>
      <td>${actionButtons}</td>
    `;

    tableBody.appendChild(row);
  });

  updateNotificationCount();
}

// تعبئة جدول سجل الصيانة بالبيانات
function populateMaintenanceHistoryTable(data) {
  console.log("سجل الصيانة المستلم من API:", data);

  const tableBody = document.getElementById("maintenanceHistoryTableBody");
  tableBody.innerHTML = "";

  data.forEach(record => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${record.deviceName}</td>
      <td>${record.maintenanceType || "غير محدد"}</td>
      <td>${record.scheduledDate ? record.scheduledDate.split("T")[0] : "-"}</td>
      <td>${record.responsible}</td>
      <td>${record.cost || "-"}</td>
      <td>${record.notes || "-"}</td>
      <td><button class="btn btn-outline-info btn-sm">عرض التقرير</button></td>
    `;
    tableBody.appendChild(row);
  });
}

// تعبئة جدول توقعات الصيانة المستقبلية
function populateFutureMaintenanceTable(data) {
  const tableBody = document.getElementById("futureMaintenanceTableBody");
  tableBody.innerHTML = "";

  const priorityClassMap = {
    "منخفضة": "bg-success",
    "متوسطة": "bg-warning text-dark",
    "عالية": "bg-danger",
    "طارئة": "bg-danger"
  };

  data.forEach(record => {
    const row = document.createElement("tr");
    const priorityClass = priorityClassMap[record.priority] || "bg-secondary";
    row.innerHTML = `
      <td>${record.device_name}</td>
      <td>${record.maintenance_type}</td>
      <td>${record.expected_date}</td>
      <td>${record.expected_cost}</td>
      <td>${record.current_hours}</td>
      <td><span class="badge ${priorityClass}">${record.priority}</span></td>
      <td><button class="btn btn-outline-primary btn-sm schedule-btn" data-device-id="${record.device_id}">جدولة</button></td>
    `;
    tableBody.appendChild(row);
  });

  // إضافة حدث لزر "جدولة"
  document.querySelectorAll(".schedule-btn").forEach(button => {
    button.addEventListener("click", function () {
      const deviceId = this.dataset.deviceId;
      const device = data.find(item => item.device_id == deviceId);
      if (device) {
        document.getElementById("deviceNameInput").value = device.device_name;
        document.getElementById("maintenanceTypeInput").value = device.maintenance_type;
        showScheduleForm();
      }
    });
  });
}

// إنشاء الرسم البياني لتكلفة الصيانة الشهرية
function createMonthlyCostChart(data) {
  const ctx = document.getElementById("monthlyCostChart").getContext("2d");
  const labels = data.map(item => `${item.month}/${item.year}`);
  const costs = data.map(item => item.total_cost);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "تكلفة الصيانة (ريال)",
        data: costs,
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "الشهر/السنة"
          }
        },
        y: {
          title: {
            display: true,
            text: "التكلفة (ريال)"
          },
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
}

// إنشاء الرسم البياني لتكرار الصيانة حسب نوع الجهاز
function createMaintenanceFrequencyChart(data) {
  const ctx = document.getElementById("maintenanceFrequencyChart").getContext("2d");
  const labels = data.map(item => item.category);
  const counts = data.map(item => item.count);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "عدد مرات الصيانة",
        data: counts,
        backgroundColor: "#28a745",
        borderColor: "#28a745",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "نوع الجهاز"
          }
        },
        y: {
          title: {
            display: true,
            text: "عدد مرات الصيانة"
          },
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
}

// عرض نموذج الجدولة
function showScheduleForm() {
  document.getElementById("scheduleForm").style.display = "block";
}

// إخفاء نموذج الجدولة
function hideScheduleForm() {
  document.getElementById("scheduleForm").style.display = "none";
  document.getElementById("deviceNameInput").value = "";
  document.getElementById("maintenanceTypeInput").value = "";
  document.getElementById("responsibleInput").value = "";
  document.getElementById("reasonInput").value = "";
}

// جدولة صيانة جديدة
function scheduleMaintenance() {
  const deviceName = document.getElementById("deviceNameInput").value;
  const maintenanceType = document.getElementById("maintenanceTypeInput").value;
  const responsible = document.getElementById("responsibleInput").value;
  const reason = document.getElementById("reasonInput").value;

  if (!deviceName || !maintenanceType || !responsible || !reason) {
    alert("يرجى ملء جميع الحقول المطلوبة!");
    return;
  }

  const maintenanceData = {
    deviceName,
    type: maintenanceType,
    responsible,
    reason
  };

  fetch("http://labmangmentsystemapi.runasp.net/api/Maintenance/addScheduledMaintenance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(maintenanceData)
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(errorText => {
          throw new Error(`فشل في جدولة الصيانة: ${errorText}`);
        });
      }
      return response.text().then(text => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      });
    })
    .then(() => {
      alert("تمت جدولة الصيانة بنجاح!");
      hideScheduleForm();
      fetchDataAndDisplay();
    })
    .catch(error => {
      console.error("خطأ أثناء الجدولة:", error);
      alert(error.message);
    });
}

// التعامل مع أزرار الجدول (حذف، حفظ، تعديل، بدء، إكمال)
document.addEventListener("click", function (e) {
  const btn = e.target;
  const row = btn.closest("tr");

  if (!row) return;

  const id = row.dataset.id;

  // زر "إلغاء"
  if (btn.classList.contains("delete-btn")) {
    if (confirm("هل أنت متأكد من الإلغاء؟")) {
      fetch(`http://labmangmentsystemapi.runasp.net/api/Maintenance/cancel/${id}`, {
        method: "PUT"
      })
        .then(response => {
          if (!response.ok) throw new Error("فشل في إلغاء السجل");
          row.remove();
          updateNotificationCount();
          alert("تم إلغاء السجل بنجاح!");
        })
        .catch(error => {
          console.error("خطأ أثناء الإلغاء:", error);
          alert("حدث خطأ أثناء إلغاء السجل.");
        });
    }
  }

  // زر "حفظ" بعد التعديل
  else if (btn.classList.contains("save-btn")) {
    const inputs = row.querySelectorAll("input, select");
    const values = Array.from(inputs).map(input => input.value);

    const priorityMap = {
      "عالية": "High",
      "متوسطة": "Medium",
      "منخفضة": "Low"
    };

    const statusMap = {
      "مجدولة": "Scheduled",
      "قيد التنفيذ": "InProgress",
      "مكتملة": "Completed",
      "ملغاة": "Cancelled"
    };

    const updatedData = {
      deviceName: values[0],
      type: values[1],
      scheduledDate: values[2] ? new Date(values[2]).toISOString() : null,
      responsible: values[3],
      reason: values[4],
      priority: priorityMap[values[5]] || values[5],
      status: statusMap[values[6]] || values[6],
      notes: "",
      cost: 0,
      startAt: null,
      endAt: null
    };

    fetch(`http://labmangmentsystemapi.runasp.net/api/Maintenance/update/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedData)
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(errorText => {
            throw new Error(`فشل في تحديث السجل: ${errorText}`);
          });
        }
        alert("تم تحديث السجل بنجاح!");
        fetchDataAndDisplay();
      })
      .catch(error => {
        console.error("خطأ أثناء التحديث:", error);
        alert(error.message);
      });
  }

  // زر "تعديل"
  else if (btn.classList.contains("edit-btn")) {
    const cells = row.querySelectorAll("td");
    const values = Array.from(cells).slice(0, 7).map(cell => cell.textContent.trim());

    let dateValue = values[2];
    try {
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const day = String(parsedDate.getDate()).padStart(2, "0");
        dateValue = `${year}-${month}-${day}`;
      } else {
        dateValue = "";
      }
    } catch {
      dateValue = "";
    }

    row.innerHTML = `
      <td><input type="text" class="form-control" value="${values[0]}"></td>
      <td><input type="text" class="form-control" value="${values[1]}"></td>
      <td><input type="date" class="form-control" value="${dateValue}"></td>
      <td><input type="text" class="form-control" value="${values[3]}"></td>
      <td><input type="text" class="form-control" value="${values[4]}"></td>
      <td>
        <select class="form-select">
          <option value="منخفضة" ${values[5].includes("منخفضة") ? "selected" : ""}>منخفضة</option>
          <option value="متوسطة" ${values[5].includes("متوسطة") ? "selected" : ""}>متوسطة</option>
          <option value="عالية" ${values[5].includes("عالية") ? "selected" : ""}>عالية</option>
        </select>
      </td>
      <td>
        <select class="form-select">
          <option value="مجدولة" ${values[6].includes("مجدولة") ? "selected" : ""}>مجدولة</option>
          <option value="قيد التنفيذ" ${values[6].includes("قيد التنفيذ") ? "selected" : ""}>قيد التنفيذ</option>
          <option value="مكتملة" ${values[6].includes("مكتملة") ? "selected" : ""}>مكتملة</option>
        </select>
      </td>
      <td>
        <button class="btn btn-success btn-sm save-btn">حفظ</button>
        <button class="btn btn-danger btn-sm delete-btn">إلغاء</button>
      </td>
    `;
  }

  // زر "بدء"
  else if (btn.classList.contains("start-btn")) {
    fetch(`http://labmangmentsystemapi.runasp.net/api/Maintenance/startTime/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ startAt: new Date().toISOString() })
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(errorText => {
            throw new Error(`فشل في تحديث وقت البدء: ${errorText}`);
          });
        }
        const cells = row.querySelectorAll("td");
        const values = Array.from(cells).slice(0, 7).map(cell => cell.textContent.trim());

        const updatedData = {
          deviceName: values[0],
          type: values[1],
          scheduledDate: values[2] !== "-" ? new Date(values[2]).toISOString() : null,
          responsible: values[3],
          reason: values[4],
          priority: values[5] === "عالية" ? "High" : values[5] === "متوسطة" ? "Medium" : "Low",
          status: "InProgress",
          notes: "",
          cost: 0,
          startAt: new Date().toISOString(),
          endAt: null
        };

        return fetch(`http://labmangmentsystemapi.runasp.net/api/Maintenance/update/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updatedData)
        });
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(errorText => {
            throw new Error(`فشل في تحديث الحالة: ${errorText}`);
          });
        }
        alert("تم بدء الصيانة!");
        fetchDataAndDisplay();
      })
      .catch(error => {
        console.error("خطأ أثناء تحديث وقت البدء أو الحالة:", error);
        alert(error.message);
      });
  }

  // زر "إكمال"
  else if (btn.classList.contains("complete-btn")) {
    const maintenanceData = {
      endAt: new Date().toISOString(),
      cost: 0,
      notes: "تم الإكمال بنجاح"
    };

    fetch(`http://labmangmentsystemapi.runasp.net/api/Maintenance/endTime/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(maintenanceData)
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(errorText => {
            throw new Error(`فشل في تحديث وقت الانتهاء: ${errorText}`);
          });
        }
        alert("تم إكمال الصيانة!");
        fetchDataAndDisplay();
      })
      .catch(error => {
        console.error("خطأ أثناء تحديث وقت الانتهاء:", error);
        alert(error.message);
      });
  }
});

// تحديث عدد التنبيهات
function updateNotificationCount() {
  const rowCount = document.querySelectorAll("#maintenanceTableBody tr").length;
  const notificationCount = document.getElementById("notificationCount");
  if (notificationCount) {
    notificationCount.textContent = rowCount;
  }
}

// البحث في الجدول
document.getElementById("searchInput").addEventListener("keyup", function () {
  const filter = this.value.toLowerCase();
  document.querySelectorAll("#maintenanceTableBody tr").forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  });
});

// التحكم في عرض الأقسام
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(section => {
    section.style.display = "none";
  });
  const target = document.getElementById(sectionId);
  if (target) target.style.display = "block";
}

//api/maintenance/priority/update-all

fetch('https://phy-lab-3-production.up.railway.app/api/maintenance/priority/update-all', {
  method: 'PUT'
}).catch(error => {
  // متطبعش حاجة خالص
});