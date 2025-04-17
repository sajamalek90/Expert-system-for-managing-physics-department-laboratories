// بيانات المستخدمين
let users = [];
let currentUserId = null;
let currentPage = 1;
const rowsPerPage = 5;

// تحميل البيانات عند بدء التشغيل
document.addEventListener('DOMContentLoaded', function() {
  loadUsers();
  setupEventListeners();
});

// تحميل بيانات المستخدمين من ملف JSON خارجي
function loadUsers() {
  showLoading(true);
  
  fetch('users.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('فشل في جلب البيانات');
      }
      return response.json();
    })
    .then(data => {
      users = data.users || data; // يعتمد على هيكل ملف JSON
      updateTable();
    })
    .catch(error => {
      console.error('حدث خطأ:', error);
      showAlert('حدث خطأ أثناء جلب بيانات المستخدمين', 'danger');
    })
    .finally(() => {
      showLoading(false);
    });
  }

// إعداد معالجات الأحداث
function setupEventListeners() {
  // البحث
  document.getElementById("searchInput").addEventListener("input", updateTable);
  
  
  document.querySelectorAll("#userTabs .nav-link").forEach(tab => {
    tab.addEventListener("click", function(e) {
      e.preventDefault();
      document.querySelectorAll("#userTabs .nav-link").forEach(el => el.classList.remove("active"));
      this.classList.add("active");
      currentPage = 1;
      updateTable();
    });
  });
  
  // إضافة مستخدم
  document.getElementById("addUserForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    if (this.checkValidity()) {
      addUser();
    } else {
      this.classList.add('was-validated');
    }
  });
  
  // تعديل مستخدم
  document.getElementById("editUserForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    if (this.checkValidity()) {
      updateUser();
    } else {
      this.classList.add('was-validated');
    }
  });
  
  // تأكيد الحذف
  document.getElementById("confirmDeleteBtn").addEventListener("click", function() {
    deleteUser();
  });

  
}

// عرض البيانات في الجدول
function renderTable(data) {
  const tbody = document.getElementById("userTableBody");
  tbody.innerHTML = "";
  
  let start = (currentPage - 1) * rowsPerPage;
  let end = start + rowsPerPage;
  let pageUsers = data.slice(start, end);
  
  if (pageUsers.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="7" class="text-center py-4">لا توجد بيانات متاحة</td>`;
    tbody.appendChild(row);
    return;
  }
  
  pageUsers.forEach((user) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.idNumber}</td>
      <td>${getUserTypeArabic(user.type)}</td>
      <td><span class="status-badge ${user.status === 'active' ? 'status-active' : 'status-inactive'}">
        ${user.status === 'active' ? 'نشط' : 'غير نشط'}
      </span></td>
      <td>${formatDate(user.registrationDate)}</td>
      <td class="action-buttons">
        <button class="btn btn-warning btn-sm" onclick="openEditModal('${user.id}')">
          <i class="fas fa-edit me-1"></i>تعديل
        </button>
        <button class="btn btn-danger btn-sm" onclick="showDeleteConfirmation('${user.id}')">
          <i class="fas fa-trash me-1"></i>حذف
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  renderPagination(data.length);
}

// تحويل نوع المستخدم إلى العربية
function getUserTypeArabic(type) {
  const types = {
    'admin': 'مشرف',
    'technician': 'فني',
    'student': 'طالب'
  };
  return types[type] || type;
}

// تنسيق التاريخ
function formatDate(dateString) {
  if (!dateString) return 'غير معروف';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG');
}

// عرض ترقيم الصفحات
function renderPagination(total) {
  const totalPages = Math.ceil(total / rowsPerPage);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  
  if (totalPages <= 1) return;
  
  // زر السابق
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link" href="#" aria-label="السابق"><span aria-hidden="true">&laquo;</span></a>`;
  prevLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      updateTable();
    }
  });
  pagination.appendChild(prevLi);
  
  // الصفحات
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  if (startPage > 1) {
    const li = document.createElement("li");
    li.className = "page-item";
    li.innerHTML = `<a class="page-link" href="#">1</a>`;
    li.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = 1;
      updateTable();
    });
    pagination.appendChild(li);
    
    if (startPage > 2) {
      const dots = document.createElement("li");
      dots.className = "page-item disabled";
      dots.innerHTML = `<span class="page-link">...</span>`;
      pagination.appendChild(dots);
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = i;
      updateTable();
    });
    pagination.appendChild(li);
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement("li");
      dots.className = "page-item disabled";
      dots.innerHTML = `<span class="page-link">...</span>`;
      pagination.appendChild(dots);
    }
    
    const li = document.createElement("li");
    li.className = "page-item";
    li.innerHTML = `<a class="page-link" href="#">${totalPages}</a>`;
    li.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage = totalPages;
      updateTable();
    });
    pagination.appendChild(li);
  }
  
  // زر التالي
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link" href="#" aria-label="التالي"><span aria-hidden="true">&raquo;</span></a>`;
  nextLi.addEventListener("click", (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      updateTable();
    }
  });
  pagination.appendChild(nextLi);
}

// تحديث الجدول
function updateTable() {
  let search = document.getElementById("searchInput").value.toLowerCase();
  let role = document.querySelector("#userTabs .nav-link.active").dataset.role;
  
  let filtered = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search) || 
                        user.email.toLowerCase().includes(search) || 
                        user.idNumber.toString().includes(search);
    const matchesRole = role === "all" || user.type === role;
    return matchesSearch && matchesRole;
  });
  
  renderTable(filtered);
}

// فتح نموذج التعديل
function openEditModal(userId) {
  const user = users.find(u => u.id == userId);
  
  if (user) {
    document.getElementById("editUserId").value = user.id;
    document.getElementById("editName").value = user.name;
    document.getElementById("editEmail").value = user.email;
    document.getElementById("editId").value = user.idNumber;
    document.getElementById("editType").value = user.type;
    document.getElementById("editStatus").value = user.status;
    
    const editModal = new bootstrap.Modal(document.getElementById("editUserModal"));
    editModal.show();
  }
}

// عرض تأكيد الحذف
function showDeleteConfirmation(userId) {
  currentUserId = userId;
  const deleteModal = new bootstrap.Modal(document.getElementById("confirmDeleteModal"));
  deleteModal.show();
}

// إضافة مستخدم جديد
function addUser() {
  const today = new Date().toISOString().split('T')[0];
  
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    name: document.getElementById("nameInput").value,
    email: document.getElementById("emailInput").value,
    idNumber: document.getElementById("idInput").value,
    type: document.getElementById("typeInput").value,
    status: "active",
    registrationDate: today
  };
  
  users.unshift(newUser);
  
  // إغلاق النموذج وإعادة تعيينه
  const addModal = bootstrap.Modal.getInstance(document.getElementById("addUserModal"));
  addModal.hide();
  document.getElementById("addUserForm").reset();
  document.getElementById("addUserForm").classList.remove('was-validated');
  
  // تحديث الجدول
  currentPage = 1;
  updateTable();
  
  // إظهار رسالة نجاح
  showAlert('تم إضافة المستخدم بنجاح', 'success');
}

// تحديث بيانات المستخدم
function updateUser() {
  const userId = document.getElementById("editUserId").value;
  const userIndex = users.findIndex(u => u.id == userId);
  
  if (userIndex !== -1) {
    users[userIndex] = {
      ...users[userIndex],
      name: document.getElementById("editName").value,
      email: document.getElementById("editEmail").value,
      idNumber: document.getElementById("editId").value,
      type: document.getElementById("editType").value,
      status: document.getElementById("editStatus").value
    };
    
    // إغلاق النموذج
    const editModal = bootstrap.Modal.getInstance(document.getElementById("editUserModal"));
    editModal.hide();
    
    // تحديث الجدول
    updateTable();
    
    // إظهار رسالة نجاح
    showAlert('تم تحديث بيانات المستخدم بنجاح', 'success');
  }
}

// حذف المستخدم
function deleteUser() {
  users = users.filter(u => u.id != currentUserId);
  
  // إغلاق النموذج
  const deleteModal = bootstrap.Modal.getInstance(document.getElementById("confirmDeleteModal"));
  deleteModal.hide();
  
  // تحديث الجدول
  currentPage = 1;
  updateTable();
  
  // إظهار رسالة نجاح
  showAlert('تم حذف المستخدم بنجاح', 'success');
}

// إظهار/إخفاء مؤشر التحميل
function showLoading(show) {
  document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
  document.querySelector('.table-responsive').style.display = show ? 'none' : 'block';
}

// إظهار رسالة تنبيه
function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
  alertDiv.style.zIndex = '9999';
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => alertDiv.remove(), 150);
  }, 3000);
}