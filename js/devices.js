// متغيرات عامة
let devicesData = [];
let filteredDevices = [];
let categories = [];
let labs = [];
let currentDevice = null;

// استدعاء الوظائف عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // تحميل بيانات الأجهزة من ملف JSON
    loadDevicesData();
    
    // إعداد أحداث التصفية والبحث
    setupEventListeners();
    
    // تهيئة نوافذ الموديلات
    initializeModals();
});

// تحميل بيانات الأجهزة من ملف JSON
function loadDevicesData() {
    fetch('devices.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل في تحميل بيانات الأجهزة!');
            }
            return response.json();
        })
        .then(data => {
            devicesData = data;
            filteredDevices = [...data];
            
            // استخراج الفئات والمختبرات الفريدة
            extractUniqueFilters();
            
            // عرض الأجهزة
            renderDevices(filteredDevices);
            
            // تحديث قوائم التصفية
            populateFilterDropdowns();
        })
        .catch(error => {
            console.error('حدث خطأ:', error);
            
            // عرض رسالة خطأ للمستخدم
            const devicesContainer = document.getElementById('devices-container');
            devicesContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    حدث خطأ أثناء تحميل البيانات. يرجى تحديث الصفحة أو المحاولة لاحقًا.
                </div>
            `;
        });
}

// استخراج الفئات والمختبرات الفريدة للتصفية
function extractUniqueFilters() {
    const categoriesSet = new Set();
    const labsSet = new Set();
    
    devicesData.forEach(device => {
        categoriesSet.add(device.category);
        labsSet.add(device.lab);
    });
    
    categories = Array.from(categoriesSet);
    labs = Array.from(labsSet);
}

// تعبئة قوائم التصفية بالقيم الفريدة
function populateFilterDropdowns() {
    const categoryFilter = document.getElementById('category-filter');
    const labFilter = document.getElementById('lab-filter');
    
    // تعبئة قائمة الفئات
    categories.forEach(category => {
        const foundDevice = devicesData.find(device => device.category === category);
        if (foundDevice) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = foundDevice.categoryText;
            categoryFilter.appendChild(option);
        }
    });
    
    // تعبئة قائمة المختبرات
    labs.forEach(lab => {
        const foundDevice = devicesData.find(device => device.lab === lab);
        if (foundDevice) {
            const option = document.createElement('option');
            option.value = lab;
            option.textContent = foundDevice.labText;
            labFilter.appendChild(option);
        }
    });
}

// عرض الأجهزة في الصفحة
function renderDevices(devices) {
    const devicesContainer = document.getElementById('devices-container');
    devicesContainer.innerHTML = '';
    
    if (devices.length === 0) {
        devicesContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info" role="alert">
                    <i class="fas fa-info-circle me-2"></i>
                    لا توجد أجهزة تطابق معايير البحث.
                </div>
            </div>
        `;
        return;
    }
    
    devices.forEach(device => {
        const deviceElement = document.createElement('div');
        deviceElement.className = 'col-md-4 mb-4';
        deviceElement.innerHTML = `
            <div class="card h-100">
                <div class="card-body text-center device-details-card">
                    <i class="${device.icon} device-icon mb-3"></i>
                    <h5>${device.name}</h5>
                    <span class="status-${device.status}">${device.statusText}</span>
                    <p class="text-muted mt-2">رقم الجهاز: ${device.id}</p>
                    <div class="mt-3">
                        <button class="btn btn-sm ${device.status === 'available' ? 'btn-primary' : 'btn-secondary'} me-2" 
                                ${device.status !== 'available' ? 'disabled' : ''} 
                                data-device-id="${device.id}" 
                                onclick="showReservationModal('${device.id}')">
                            <i class="fas fa-calendar-plus me-1"></i>حجز
                        </button>
                        <button class="btn btn-sm btn-outline-primary" 
                                data-device-id="${device.id}" 
                                onclick="showDeviceDetails('${device.id}')">
                            <i class="fas fa-info-circle me-1"></i>التفاصيل
                        </button>
                    </div>
                </div>
            </div>
        `;
        devicesContainer.appendChild(deviceElement);
    });
}

// إعداد أحداث التصفية والبحث
function setupEventListeners() {
    // أحداث تصفية الفئات
    document.getElementById('category-filter').addEventListener('change', filterDevices);
    
    // أحداث تصفية الحالة
    document.getElementById('status-filter').addEventListener('change', filterDevices);
    
    // أحداث تصفية المختبرات
    document.getElementById('lab-filter').addEventListener('change', filterDevices);
    
    // بحث عن جهاز
    document.getElementById('search-device').addEventListener('input', filterDevices);
    
    // زر إضافة جهاز
    document.getElementById('add-device-btn').addEventListener('click', () => {
        resetAddDeviceForm();
        $('#addDeviceModal').modal('show');
    });
    
    // زر فلتر
    document.getElementById('filter-btn').addEventListener('click', () => {
        const filtersCard = document.getElementById('filters-card');
        if (filtersCard.classList.contains('d-none')) {
            filtersCard.classList.remove('d-none');
        } else {
            filtersCard.classList.add('d-none');
        }
    });
    
    // نموذج إضافة جهاز
    document.getElementById('add-device-form').addEventListener('submit', handleAddDevice);
}

// تصفية الأجهزة بناءً على الفلاتر المحددة
function filterDevices() {
    const categoryValue = document.getElementById('category-filter').value;
    const statusValue = document.getElementById('status-filter').value;
    const labValue = document.getElementById('lab-filter').value;
    const searchValue = document.getElementById('search-device').value.trim().toLowerCase();
    
    filteredDevices = devicesData.filter(device => {
        const matchCategory = categoryValue === 'all' || device.category === categoryValue;
        const matchStatus = statusValue === 'all' || device.status === statusValue;
        const matchLab = labValue === 'all' || device.lab === labValue;
        const matchSearch = device.name.toLowerCase().includes(searchValue) || 
                          device.id.toLowerCase().includes(searchValue);
        
        return matchCategory && matchStatus && matchLab && matchSearch;
    });
    
    renderDevices(filteredDevices);
}

// عرض تفاصيل الجهاز في نافذة منبثقة
function showDeviceDetails(deviceId) {
    currentDevice = devicesData.find(device => device.id === deviceId);
    
    if (!currentDevice) return;
    
    // تحديث بيانات الجهاز في النافذة المنبثقة
    document.getElementById('device-details-title').textContent = currentDevice.name;
    document.getElementById('device-details-icon').className = `${currentDevice.icon} fa-4x mb-3`;
    document.getElementById('device-details-status').className = `status-${currentDevice.status}`;
    document.getElementById('device-details-status').textContent = currentDevice.statusText;
    
    document.getElementById('device-id').textContent = currentDevice.id;
    document.getElementById('device-category').textContent = currentDevice.categoryText;
    document.getElementById('device-lab').textContent = currentDevice.labText;
    
    document.getElementById('device-purchase-date').textContent = formatDate(currentDevice.purchaseDate);
    document.getElementById('device-lifespan').textContent = `${currentDevice.lifespan} سنوات`;
    document.getElementById('device-last-maintenance').textContent = formatDate(currentDevice.lastMaintenance);
    
    // عرض سجل الصيانة
    renderMaintenanceHistory(currentDevice.maintenanceHistory);
    
    // عرض الملاحظات
    document.getElementById('device-notes').textContent = currentDevice.notes || 'لا توجد ملاحظات';
    
    // عرض النافذة المنبثقة
    $('#deviceDetailsModal').modal('show');
}

// عرض سجل الصيانة
function renderMaintenanceHistory(history) {
    const maintenanceContainer = document.getElementById('maintenance-history');
    maintenanceContainer.innerHTML = '';
    
    if (!history || history.length === 0) {
        maintenanceContainer.innerHTML = '<p>لا يوجد سجل صيانة لهذا الجهاز.</p>';
        return;
    }
    
    history.forEach(record => {
        const recordElement = document.createElement('div');
        recordElement.className = 'd-flex justify-content-between mb-2';
        
        let statusClass = 'bg-success';
        if (record.status === 'in-progress') {
            statusClass = 'bg-warning';
        } else if (record.status === 'scheduled') {
            statusClass = 'bg-info';
        }
        
        recordElement.innerHTML = `
            <span>${formatDate(record.date)}: ${record.description}</span>
            <span class="badge ${statusClass}">${getStatusText(record.status)}</span>
        `;
        
        maintenanceContainer.appendChild(recordElement);
    });
}

// تحويل حالة الصيانة إلى نص
function getStatusText(status) {
    switch (status) {
        case 'completed':
            return 'مكتملة';
        case 'in-progress':
            return 'قيد التنفيذ';
        case 'scheduled':
            return 'مجدولة';
        default:
            return status;
    }
}

// عرض نافذة حجز جهاز
function showReservationModal(deviceId) {
    const device = devicesData.find(device => device.id === deviceId);
    
    if (!device || device.status !== 'available') return;
    
    // تعبئة بيانات النموذج
    document.getElementById('reservation-device').value = device.name;
    document.getElementById('reservation-device-id').value = device.id;
    
    // تعيين التاريخ الافتراضي إلى اليوم
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('reservation-date').value = formattedDate;
    document.getElementById('reservation-date').min = formattedDate;
    
    // إعادة تعيين حقول النموذج الأخرى
    document.getElementById('start-time').value = '';
    document.getElementById('end-time').value = '';
    document.getElementById('reservation-purpose').value = '';
    
    // عرض النافذة المنبثقة
    $('#reservationModal').modal('show');
}

// تنفيذ حجز جهاز
function handleReservation(event) {
    event.preventDefault();
    
    // هنا يمكن إضافة التحقق من صحة البيانات
    const deviceId = document.getElementById('reservation-device-id').value;
    const date = document.getElementById('reservation-date').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const purpose = document.getElementById('reservation-purpose').value;
    
    // التحقق من صحة البيانات
    if (!date || !startTime || !endTime || !purpose) {
        showAlert('يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    // هنا يمكن إرسال بيانات الحجز إلى الخادم
    // في هذا المثال، سنعرض رسالة نجاح فقط
    
    // إخفاء النافذة المنبثقة
    $('#reservationModal').modal('hide');
    
    // عرض رسالة نجاح
    showAlert('تم تأكيد الحجز بنجاح!', 'success');
}

// معالجة إضافة جهاز جديد
function handleAddDevice(event) {
    event.preventDefault();
    
    // الحصول على بيانات النموذج
    const deviceName = document.getElementById('device-name').value;
    const deviceCategory = document.getElementById('device-category').value;
    const deviceLab = document.getElementById('device-lab').value;
    const deviceStatus = document.getElementById('device-status').value;
    const devicePurchaseDate = document.getElementById('device-purchase-date').value;
    const deviceLifespan = document.getElementById('device-lifespan').value;
    const deviceNotes = document.getElementById('device-notes').value;
    
    // التحقق من صحة البيانات
    if (!deviceName || !deviceCategory || !deviceLab || !deviceStatus || !devicePurchaseDate || !deviceLifespan) {
        showAlert('يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    // إنشاء معرّف جهاز جديد
    const categoryPrefix = deviceCategory.substring(0, 3).toUpperCase();
    const newId = `PHY-${categoryPrefix}-${String(devicesData.length + 1).padStart(3, '0')}`;
    
    // إنشاء كائن الجهاز الجديد
    const newDevice = {
        id: newId,
        name: deviceName,
        icon: getCategoryIcon(deviceCategory),
        status: deviceStatus,
        statusText: getStatusTextFromValue(deviceStatus),
        category: deviceCategory,
        categoryText: document.getElementById('device-category').options[document.getElementById('device-category').selectedIndex].text,
        lab: deviceLab,
        labText: document.getElementById('device-lab').options[document.getElementById('device-lab').selectedIndex].text,
        purchaseDate: devicePurchaseDate,
        lifespan: parseInt(deviceLifespan),
        lastMaintenance: '',
        maintenanceHistory: [],
        notes: deviceNotes
    };
    
    // إضافة الجهاز إلى المصفوفة
    devicesData.push(newDevice);
    
    // تحديث عرض الأجهزة
    filterDevices();
    
    // إخفاء النافذة المنبثقة
    $('#addDeviceModal').modal('hide');
    
    // عرض رسالة نجاح
    showAlert('تم إضافة الجهاز بنجاح!', 'success');
}

// الحصول على أيقونة الفئة
function getCategoryIcon(category) {
    switch (category) {
        case 'optical':
            return 'fas fa-microscope';
        case 'measurement':
            return 'fas fa-wave-square';
        case 'thermal':
            return 'fas fa-temperature-high';
        case 'radiation':
            return 'fas fa-radiation';
        default:
            return 'fas fa-atom';
    }
}

// تحويل قيمة الحالة إلى نص
function getStatusTextFromValue(status) {
    switch (status) {
        case 'available':
            return 'متاح';
        case 'unavailable':
            return 'غير متاح';
        case 'maintenance':
            return 'قيد الصيانة';
        default:
            return status;
    }
}

// تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

// إعادة تعيين نموذج إضافة جهاز
function resetAddDeviceForm() {
    document.getElementById('add-device-form').reset();
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('device-purchase-date').value = formattedDate;
}

// تهيئة النوافذ المنبثقة
function initializeModals() {
    // نموذج حجز جهاز
    document.getElementById('reservation-form').addEventListener('submit', handleReservation);
    
    // زر التعديل في نافذة تفاصيل الجهاز
    document.getElementById('edit-device-btn').addEventListener('click', () => {
        if (currentDevice) {
            editDevice(currentDevice.id);
        }
    });
}

// تعديل بيانات جهاز
function editDevice(deviceId) {
    // سيتم تنفيذ هذه الوظيفة لاحقًا
    console.log(`تعديل الجهاز: ${deviceId}`);
    $('#deviceDetailsModal').modal('hide');
    
    // يمكن هنا إضافة منطق لفتح نافذة تعديل بيانات الجهاز
}

// عرض رسالة تنبيه
function showAlert(message, type) {
    const alertsContainer = document.getElementById('alerts-container');
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button>
    `;
    
    alertsContainer.appendChild(alertElement);
    
    // إزالة التنبيه تلقائيًا بعد 5 ثواني
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => {
            alertsContainer.removeChild(alertElement);
        }, 150);
    }, 5000);
}