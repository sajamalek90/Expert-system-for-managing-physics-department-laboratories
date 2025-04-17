    // لما المستخدم يضغط على زر "إكمال"
    document.querySelectorAll('.btn-success').forEach(function(button) {
        button.addEventListener('click', function() {
          const row = this.closest('tr');
          
          // تغيير الحالة إلى "مكتملة"
          const statusCell = row.querySelectorAll('td')[5];
          statusCell.innerHTML = '<span class="badge bg-success">مكتملة</span>';
          
          // إخفاء زر الإكمال بعد التنفيذ
          this.remove();
          
          // عرض رسالة تأكيد
          alert("تم إكمال الصيانة بنجاح!");
        });
      });
    
      // عند الضغط على زر "إلغاء"
      document.querySelectorAll('.btn-outline-danger').forEach(function(cancelButton) {
        cancelButton.addEventListener('click', function() {
          const confirmed = confirm("هل أنت متأكد من إلغاء هذه العملية؟");
          if (confirmed) {
            const row = this.closest('tr');
            row.remove(); // حذف الصف بالكامل
          }
        });
      });
      // الجزء الخاص بالsearch
      document.getElementById("searchInput").addEventListener("keyup", function () {
    let filter = this.value.toLowerCase();
    let rows = document.querySelectorAll("table tbody tr");
  
    rows.forEach(function (row) {
      let text = row.textContent.toLowerCase();
      if (text.includes(filter)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  });
  
  const tableBody = document.getElementById("maintenanceTableBody");
  const notificationCount = document.getElementById("notificationCount");
  const addRowBtn = document.getElementById("addRowBtn");

  // تحديث عدد التنبيهات
  function updateNotificationCount() {
    const rowCount = tableBody.querySelectorAll("tr").length;
    notificationCount.textContent = rowCount;
  }

  // إضافة صف جديد
  addRowBtn.addEventListener("click", function () {
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
      <td><input type="text" class="form-control" placeholder="اسم الجهاز"></td>
      <td><input type="text" class="form-control" placeholder="نوع الصيانة"></td>
      <td><input type="date" class="form-control"></td>
      <td><input type="text" class="form-control" placeholder="المسؤول"></td>
      <td>
        <select class="form-select">
          <option value="منخفضة">منخفضة</option>
          <option value="متوسطة">متوسطة</option>
          <option value="عالية">عالية</option>
        </select>
      </td>
      <td>
        <select class="form-select">
          <option value="مجدولة">مجدولة</option>
          <option value="قيد التنفيذ">قيد التنفيذ</option>
          <option value="مكتملة">مكتملة</option>
        </select>
      </td>
      <td>
        <button class="btn btn-success btn-sm save-btn">حفظ</button>
        <button class="btn btn-danger btn-sm delete-btn">إلغاء</button>
      </td>
    `;

    tableBody.appendChild(newRow);
    updateNotificationCount();
  });

  // حذف صف أو حفظ التعديلات أو الدخول لوضع التعديل
  document.addEventListener("click", function (e) {
    const btn = e.target;

    // حذف صف
    if (btn.classList.contains("delete-btn")) {
      const row = btn.closest("tr");
      row.remove();
      updateNotificationCount();
    }

    // حفظ صف جديد أو حفظ تعديل
    if (btn.classList.contains("save-btn")) {
      const row = btn.closest("tr");
      const cells = row.querySelectorAll("td");
      const values = [];

      for (let i = 0; i < 6; i++) {
        const input = cells[i].querySelector("input, select");
        values.push(input.value);
      }

      row.innerHTML = `
        <td>${values[0]}</td>
        <td>${values[1]}</td>
        <td>${values[2]}</td>
        <td>${values[3]}</td>
        <td>${values[4]}</td>
        <td>${values[5]}</td>
        <td>
          <button class="btn btn-warning btn-sm edit-btn">تعديل</button>
          <button class="btn btn-danger btn-sm delete-btn">إلغاء</button>
        </td>
      `;

      updateNotificationCount();
    }

    // تفعيل التعديل
    if (btn.classList.contains("edit-btn")) {
      const row = btn.closest("tr");
      const cells = row.querySelectorAll("td");
      const values = [];

      for (let i = 0; i < 6; i++) {
        values.push(cells[i].textContent);
      }

      row.innerHTML = `
        <td><input type="text" class="form-control" value="${values[0]}"></td>
        <td><input type="text" class="form-control" value="${values[1]}"></td>
        <td><input type="date" class="form-control" value="${values[2]}"></td>
        <td><input type="text" class="form-control" value="${values[3]}"></td>
        <td>
          <select class="form-select">
            <option value="منخفضة" ${values[4] === "منخفضة" ? "selected" : ""}>منخفضة</option>
            <option value="متوسطة" ${values[4] === "متوسطة" ? "selected" : ""}>متوسطة</option>
            <option value="عالية" ${values[4] === "عالية" ? "selected" : ""}>عالية</option>
          </select>
        </td>
        <td>
          <select class="form-select">
            <option value="مجدولة" ${values[5] === "مجدولة" ? "selected" : ""}>مجدولة</option>
            <option value="قيد التنفيذ" ${values[5] === "قيد التنفيذ" ? "selected" : ""}>قيد التنفيذ</option>
            <option value="مكتملة" ${values[5] === "مكتملة" ? "selected" : ""}>مكتملة</option>
          </select>
        </td>
        <td>
          <button class="btn btn-success btn-sm save-btn">حفظ</button>
          <button class="btn btn-danger btn-sm delete-btn">إلغاء</button>
        </td>
      `;
    }
  });

  // أول مرة
  updateNotificationCount();

  
  
  
  
  
 