// بيانات المستخدمين
let users = [];
let currentUserId = null;
let currentPage = 1;
const rowsPerPage = 5;

// إضافة مخزن للتغييرات المحلية
const localUserChanges = {};

// تحميل البيانات عند بدء التشغيل
document.addEventListener('DOMContentLoaded', function() {
  loadUsers();
  setupEventListeners();
});

// تحميل بيانات المستخدمين من API
function loadUsers() {
  showLoading(true);
  console.log('جاري تحميل البيانات...');
  
  fetch('http://labmangmentsystemapi.runasp.net/api/Auth/AllUsers', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    cache: 'no-cache' // منع التخزين المؤقت للمتصفح
  })
    .then(response => {
      console.log('استجابة API:', response.status, response.statusText);
      if (!response.ok) {
        throw new Error(`فشل في جلب البيانات: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // console.log('البيانات المستلمة:', data);
          data.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));


      updateTable();
    })
    .catch(error => {
      console.error('حدث خطأ:', error);
      users = []; // استخدم قائمة فارغة في حالة الخطأ
      showAlert(`حدث خطأ أثناء جلب بيانات المستخدمين: ${error.message}`, 'danger');
      updateTable(); // قم بتحديث الجدول حتى في حالة الخطأ
    })
    .finally(() => {
      showLoading(false);
    });
}

// إعداد معالجات الأحداث
function setupEventListeners() {
  // البحث مع تأخير زمني
  let searchTimeout;
  document.getElementById("searchInput").addEventListener("input", function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      updateTable();
    }, 300); // تقليل وقت التأخير إلى 300 مللي ثانية
  });
  
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

// تحويل حالة المستخدم إلى العربية
function getStatusArabic(status) {
  if (!status) return 'غير نشط';
  
  const statusMap = {
    'active': 'نشط',
    'inactive': 'غير نشط',
    'نشط': 'نشط',
    'غير نشط': 'غير نشط',
    true: 'نشط',
    false: 'غير نشط'
  };
  return statusMap[status] || 'غير نشط';
}

// تحويل حالة المستخدم إلى الإنجليزية (للاستخدام في نموذج التعديل)
function getStatusEnglish(status) {
  if (!status) return 'inactive';
  
  const statusValue = String(status).toLowerCase();
  return (statusValue === 'نشط' || statusValue === 'active' || status === true) ? 'active' : 'inactive';
}

// عرض البيانات في الجدول
function renderTable(data) {
  // console.log('جاري عرض البيانات:', data);
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
    // console.log('معالجة مستخدم:', user);
    const status = getStatusArabic(user.status);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.name || ''}</td>
      <td>${user.email || ''}</td>
      <td>${user.nationalId || ''}</td>
      <td>${getUserTypeArabic(user.type) || ''}</td>
      <td><span class="status-badge ${status === 'نشط' ? 'status-active' : 'status-inactive'}">
        ${status}
      </span></td>
      <td>${formatDate(user.registrationDate) || ''}</td>
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
  if (!type) return '';
  
  const types = {
    'admin': 'دكتور',
    'technician': 'فني',
    'student': 'طالب',
    'Admin': 'دكتور',
    'Technician': 'فني',
    'Student': 'طالب',
    'دكتور': 'دكتور',
    'فني': 'فني',
    'طالب': 'طالب'
  };
  return types[type] || type;
}

// تنسيق التاريخ
function formatDate(dateString) {
  if (!dateString) return 'غير معروف';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'غير معروف';
    return date.toLocaleDateString('ar-EG');
  } catch (e) {
    return 'غير معروف';
  }
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
  if (currentPage > 1) {
    prevLi.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage--;
      updateTable();
    });
  }
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
  if (currentPage < totalPages) {
    nextLi.addEventListener("click", (e) => {
      e.preventDefault();
      currentPage++;
      updateTable();
    });
  }
  pagination.appendChild(nextLi);
}

// تحديث الجدول مع البحث والفلترة
function updateTable() {
  let search = document.getElementById("searchInput").value.toLowerCase();
  let activeTab = document.querySelector("#userTabs .nav-link.active");
  let role = activeTab ? activeTab.dataset.role : "all"; // fallback to 'all'

  
  // console.log('معايير البحث:', { search, role });
  showLoading(true);

  let apiUrl = 'http://labmangmentsystemapi.runasp.net/api/Auth/AllUsers';
  
  // إذا كان هناك بحث، نستخدم نقطة نهاية البحث
  if (search) {
    apiUrl = `http://labmangmentsystemapi.runasp.net/api/Auth/Search?query=${encodeURIComponent(search)}`;
    console.log('رابط البحث:', apiUrl);
  }
  // إذا كان هناك فلتر، نستخدم نقطة نهاية الفلتر
  else if (role !== 'all') {
    // تحويل نوع المستخدم إلى المصطلح المناسب للـ API
    let userType;
    if (role === 'student') userType = 'طالب';
    else if (role === 'technician') userType = 'فني';
    else if (role === 'admin') userType = 'دكتور';
    else userType = role;
    
    apiUrl = `http://labmangmentsystemapi.runasp.net/api/Auth/Filter?type=${encodeURIComponent(userType)}`;
    console.log('رابط الفلتر:', apiUrl);
  }

  fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    cache: 'no-cache'
  })
    .then(response => {
      
      // response.json().sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));

      console.log('استجابة API للبحث:', response.status, response.statusText);
      if (!response.ok) {
        throw new Error(`فشل في جلب البيانات: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      data.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));

      // console.log('نتيجة البحث:', data);
      if (Array.isArray(data)) {
        // مراجعة البيانات وحل مشكلة الحالة
        users = data.map(user => {
          // تصحيح حالة المستخدم إذا كانت خطأ
          if (user.status === false || user.status === 'false') {
            user.status = 'غير نشط';
          } else if (user.status === true || user.status === 'true') {
            user.status = 'نشط';
          }
          
          // تطبيق التغييرات المحلية إذا وجدت
          const userIdStr = String(user.id);
          if (localUserChanges[userIdStr] && localUserChanges[userIdStr].status) {
            console.log(`تطبيق الحالة المحلية للمستخدم ${user.name} في البحث: ${localUserChanges[userIdStr].status}`);
            user.status = localUserChanges[userIdStr].status;
          }
          
          return user;
        });
        
       
        
      } else if (data && typeof data === 'object') {
        // إذا كانت النتيجة كائن واحد، نحوله إلى مصفوفة
        const user = data;
        // تصحيح حالة المستخدم إذا كانت خطأ
        if (user.status === false || user.status === 'false') {
          user.status = 'غير نشط';
        } else if (user.status === true || user.status === 'true') {
          user.status = 'نشط';
        }
        
        // تطبيق التغييرات المحلية إذا وجدت
        const userIdStr = String(user.id);
        if (localUserChanges[userIdStr] && localUserChanges[userIdStr].status) {
          console.log(`تطبيق الحالة المحلية للمستخدم ${user.name} في البحث: ${localUserChanges[userIdStr].status}`);
          user.status = localUserChanges[userIdStr].status;
        }
        
        // التحقق من عدم حذف المستخدم محلياً
        if (!(localUserChanges[userIdStr] && localUserChanges[userIdStr].deleted)) {
          users = [user];
        } else {
          console.log(`استبعاد المستخدم المحذوف محلياً من نتائج البحث: ${user.name} (${user.id})`);
          users = [];
        }
      } else {
        users = [];
        console.warn('تم استلام بيانات غير صالحة من API');
      }
      renderTable(users);
    })
    .catch(error => {
      console.error('حدث خطأ في البحث:', error);
      users = []; // استخدم قائمة فارغة في حالة الخطأ
      showAlert(`حدث خطأ أثناء جلب البيانات: ${error.message}`, 'danger');
      renderTable(users); // عرض جدول فارغ في حالة الخطأ
    })
    .finally(() => {
      showLoading(false);
    });
}

// فتح نموذج التعديل
function openEditModal(userId) {
  console.log('فتح نافذة التعديل للمستخدم بالمعرف:', userId);
  
  // تحويل userId إلى سلسلة نصية للمقارنة
  const userIdStr = String(userId);
  const user = users.find(u => String(u.id) === userIdStr);
  
  if (user) {
    console.log("userrrrrrrrrrr", user);
    
    try {
      console.log('بيانات المستخدم للتعديل:', user);
      document.getElementById("editUserId").value = user.id;
      document.getElementById("editName").value = user.name || '';
      document.getElementById("editEmail").value = user.email || '';
      document.getElementById("editId").value = user.nationalId || '';
      document.getElementById("editType").value= user.type||''
     
      
      // استخدام دالة getStatusEnglish لتحويل الحالة إلى القيمة المناسبة للنموذج (active/inactive)
      document.getElementById("editStatus").value = getStatusEnglish(user.status);
      
      // عرض النافذة
      const editModalEl = document.getElementById('editUserModal');
      let editModal = bootstrap.Modal.getInstance(editModalEl);
      if (!editModal) {
        editModal = new bootstrap.Modal(editModalEl);
      }
      editModal.show();

    } catch (error) {
      console.error('حدث خطأ أثناء تعبئة نموذج التعديل:', error, error.stack);
      showAlert('حدث خطأ أثناء محاولة فتح نموذج التعديل.', 'danger');
    }
  } else {
    console.warn('لم يتم العثور على المستخدم بالـ ID:', userId);
    console.log('المستخدمين المتاحين:', users);
    showAlert('لم يتم العثور على بيانات المستخدم المحدد.', 'warning');
  }
}

// عرض تأكيد الحذف
function showDeleteConfirmation(userId) {

  console.log('عرض تأكيد الحذف للمستخدم:', userId);
  currentUserId = userId;
  const deleteModalEl = document.getElementById("confirmDeleteModal");
  let deleteModal = bootstrap.Modal.getInstance(deleteModalEl);
  if (!deleteModal) {
    deleteModal = new bootstrap.Modal(deleteModalEl);
  }
  deleteModal.show();
}

// إضافة مستخدم جديد
function addUser() {
  const nameInput = document.getElementById('nameInput');
  const emailInput = document.getElementById('emailInput');
  const idInput = document.getElementById('idInput');
  const phoneInput = document.getElementById('phoneInput');
  const passwordInput = document.getElementById('passwordInput');
  const typeInput = document.getElementById('typeInput');
  const statusInput = document.getElementById('statusInput');
  
  // التحقق من صحة الحقول
  if (!nameInput.value || !emailInput.value || !idInput.value || !phoneInput.value || 
      !passwordInput.value || !typeInput.value || !statusInput.value) {
    showAlert('يرجى ملء جميع الحقول المطلوبة', 'warning');
    return;
  }
  
  // تجهيز بيانات المستخدم الجديد
  const newUser = {
    name: nameInput.value,
    email: emailInput.value,
    nationalId: idInput.value,
    phoneNumber: phoneInput.value,
    type: typeInput.value,
    status: statusInput.value,
    registrationDate: new Date().toISOString(),
    password: passwordInput.value
  };
  
  console.log('بيانات المستخدم الجديد:', newUser);
  
  showLoading(true);
  
  fetch('http://labmangmentsystemapi.runasp.net/api/Auth/AddUser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(newUser)
  })
    .then(response => {
      console.log(response);
      console.log("he hereeee");
      
      // First check if the response is okay
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(text || 'فشل في إضافة المستخدم');
        });
      }
      console.log("i'm not hereeee");

      return response.json();
    })
    .then(data => {
      

      console.log("i'm hereeee");
      
      console.log('نتيجة إضافة المستخدم:', data);
      
      // المشكلة كانت هنا - تم تعديل التحقق من نجاح العملية
      if (data) {
        showAlert('✅ تم إضافة المستخدم بنجاح', 'success');
      console.log("whereee");
        
        // إغلاق المودال بعد النجاح
        const addUserModalClose = document.getElementById('closeUserModal');
        // const addUserModal = bootstrap.Modal.getInstance(addUserModalEl);
        addUserModalClose.click()
        
        // إعادة تعيين النموذج
        document.getElementById('addUserForm').reset();
        document.getElementById('addUserForm').classList.remove('was-validated');
        
        // تحديث قائمة المستخدمين
        loadUsers();
      } else {
        // رسالة الخطأ من الخادم إن وجدت
        const errorMsg = data.message || 'لم يتم إضافة المستخدم - تحقق من البيانات';
        showAlert(`⚠️ ${errorMsg}`, 'warning');
      }
    })
    .catch(error => {
      console.error('حدث خطأ:', error);
      
      // محاولة استخراج رسالة الخطأ بشكل صحيح
      let errorMessage = 'حدث خطأ أثناء إضافة المستخدم';
      try {
        if (error.message) {
          const parsedError = JSON.parse(error.message);
          errorMessage = parsedError.message || errorMessage;
        }
      } catch (e) {
        errorMessage = error.message || errorMessage;
      }
      
      showAlert(`❌ ${errorMessage}`, 'danger');
    })
    .finally(() => {
      showLoading(false);
    });
}

// تحديث بيانات المستخدم
function updateUser() {
  const userId = document.getElementById('editUserId').value;
  const nameInput = document.getElementById('editName');
  const emailInput = document.getElementById('editEmail');
  const idInput = document.getElementById('editId');
  const typeInput = document.getElementById('editType');
  const statusInput = document.getElementById('editStatus');

  console.log('بيانات التحديث:', {
    userId,
    name: nameInput.value,
    email: emailInput.value,
    nationalId: idInput.value,
    type: typeInput.value,
    status: statusInput.value
  });

  // التحقق من صحة البيانات
  if (!nameInput.value || !emailInput.value || !idInput.value || !typeInput.value) {
    showAlert('يرجى ملء جميع الحقول المطلوبة', 'warning');
    return;
  }

  // البحث عن المستخدم الحالي للاحتفاظ بالبيانات الموجودة
  const userIdStr = String(userId);
  const currentUserIndex = users.findIndex(u => String(u.id) === userIdStr);
  const currentUser = currentUserIndex !== -1 ? users[currentUserIndex] : {};

  // تحويل نوع المستخدم إلى العربية

  // تحويل الحالة بشكل واضح وصريح للـ API

  

  const updatedUser = {
    id: userId,
    name: nameInput.value,
    email: emailInput.value,
    nationalId: idInput.value,
    type: typeInput.value,
    status: statusInput.value, // استخدام القيمة العربية التي تم تعيينها أعلاه
    // الاحتفاظ بالبيانات الموجودة إذا كانت متاحة
    registrationDate: currentUser.registrationDate || new Date().toISOString(),
    phoneNumber: currentUser.phoneNumber || "01012345678",
    password: currentUser.password || "12345678"
  };

  console.log('بيانات المستخدم المرسلة للتحديث:', updatedUser);

  // حفظ التغييرات محليًا للتغلب على مشاكل الخادم
 

  showLoading(true);

  fetch(`http://labmangmentsystemapi.runasp.net/api/Auth/UpdateUserById/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(updatedUser)
  })
    .then(response => {
      console.log('رمز الاستجابة للتعديل:', response.status, response.statusText);
      
      if (!response.ok) {
        return response.text().then(text => {
          console.error('نص خطأ التعديل:', text);
          throw new Error(text || 'فشل في تحديث بيانات المستخدم');
        });
      }
      
      // محاولة تحليل الرد كـ JSON، وإذا فشل فالعودة بكائن نجاح بسيط
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        return { success: true, user: updatedUser };
      }
    })
    .then(data => {
      console.log('نتيجة تحديث المستخدم:', data);
      
      // تحديث البيانات في المصفوفة المحلية
      if (currentUserIndex !== -1) {
        // تحديث المستخدم الموجود في المصفوفة
        users[currentUserIndex] = {
          ...users[currentUserIndex],
          ...updatedUser
        };
        
        // تحديث الجدول فورًا لعرض التغييرات للمستخدم
        renderTable(users);
      }
      
      showAlert('تم تحديث بيانات المستخدم بنجاح', 'success');
      
      // إغلاق النافذة
      const editUserModalEl = document.getElementById('editUserModal');
      const editUserModal = bootstrap.Modal.getInstance(editUserModalEl);
      if (editUserModal) {
        editUserModal.hide();
      }
      
      // مسح النموذج
      document.getElementById('editUserForm').reset();
      document.getElementById('editUserForm').classList.remove('was-validated');
      
      // إعادة تحميل البيانات من الخادم للتأكد من المزامنة
      loadUsers();
    })
    .catch(error => {
      console.error('حدث خطأ في تحديث المستخدم:', error);
      showAlert(`حدث خطأ أثناء تحديث بيانات المستخدم: ${error.message}`, 'danger');
    })
    .finally(() => {
      showLoading(false);
    });
}

// حذف المستخدم
function deleteUser() {
  console.log(currentUserId,"user id");
  
  // if (!currentUserId) {
  //   console.error('لا يوجد معرف للمستخدم المراد حذفه');
  //   showAlert('حدث خطأ: لم يتم تحديد المستخدم', 'danger');
  //   console.log("we heteeeeeeeeeeeeeee");
    
  //   return;
  // }

  // console.log('جاري حذف المستخدم بالمعرف:', currentUserId);
  // console.log('نوع المعرف:', typeof currentUserId);
  // console.log('المستخدم المحدد:', users.find(u => u.id === currentUserId));
  
  showLoading(true);
console.log("V222222", currentUserId);

  const deleteUrl = `http://labmangmentsystemapi.runasp.net/api/Auth/DeleteUserById/${currentUserId}`;
  console.log('رابط الحذف:', deleteUrl);

  fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
    .then(response => {
      console.log('رمز الاستجابة للحذف:', response.status, response.statusText);
      console.log('رأس الاستجابة:', response.headers);
      
      if (!response.ok) {
        return response.text().then(text => {
          console.error('نص الخطأ:', text);
          throw new Error(text || 'فشل في حذف المستخدم');
        });
      }
      
      return { success: true };
    })
    .then(data => {
      console.log('نتيجة عملية الحذف:', data);
      
      // إغلاق المودال
      const deleteModalEl = document.getElementById('confirmDeleteModal');
      const deleteModal = bootstrap.Modal.getInstance(deleteModalEl);
      if (deleteModal) {
        deleteModal.hide();
      }
      
      showAlert('تم حذف المستخدم بنجاح', 'success');
      
      // إعادة تحميل البيانات
      loadUsers();
    })
    .catch(error => {
      console.error('حدث خطأ في عملية الحذف:', error);
      showAlert(`حدث خطأ أثناء حذف المستخدم: ${error.message}`, 'danger');
    })
    .finally(() => {
      showLoading(false);
      currentUserId = null;
    });
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