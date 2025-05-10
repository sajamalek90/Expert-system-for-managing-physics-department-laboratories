// متغيرات عامة
let devicesData = [];
let filteredDevices = [];
let categories = new Set();
let labs = new Set();
let currentDevice = null;

// ثوابت APIs
const API_BASE_URL = 'http://labmangmentsystemapi.runasp.net/api';
const DEVICES_API = `${API_BASE_URL}/Devices`;

// استدعاء الوظائف عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // تحميل بيانات الأجهزة من API
    loadDevicesData();
    
    // إعداد أحداث التصفية والبحث
    setupEventListeners();
    
    // تهيئة نوافذ الموديلات
    initializeModals();
});

// تحميل بيانات الأجهزة من API
async function loadDevicesData() {
    try {
        const response = await fetch(`${DEVICES_API}/GetAllDevices`);
        
        if (!response.ok) {
            throw new Error(`فشل في تحميل بيانات الأجهزة: ${response.status}`);
        }
        
        const data = await response.json();
        
        // تحويل البيانات إلى الشكل المطلوب للعرض
        devicesData = data.map(device => ({
            id: device.id.toString(),
            name: device.name,
            status: mapStatusValue(device.status),
            statusText: device.status,
            serialNumber: device.serialNumber,
            icon: getDeviceIcon(device.name)
        }));
        
        filteredDevices = [...devicesData];
        
        // تحميل بيانات إضافية لكل جهاز للحصول على الفئات والمختبرات
        await loadDevicesDetails();
        
        // عرض الأجهزة
        renderDevices(filteredDevices);
        
        // تحديث قوائم التصفية
        populateFilterDropdowns();
    } catch (error) {
        console.error('حدث خطأ:', error);
        
        // عرض رسالة خطأ للمستخدم
        const devicesContainer = document.getElementById('devices-container');
        devicesContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                حدث خطأ أثناء تحميل البيانات. يرجى تحديث الصفحة أو المحاولة لاحقًا.
            </div>
        `;
    }
}

// تحميل تفاصيل الأجهزة للحصول على الفئات والمختبرات
async function loadDevicesDetails() {
    try {
        // نقوم بتحميل تفاصيل الجهاز الأول فقط للحصول على الفئات والمختبرات
        // هذه الطريقة مؤقتة ويمكن تحسينها في الإصدارات اللاحقة
        if (devicesData.length > 0) {
            const deviceDetails = await fetchDeviceDetails(devicesData[0].id);
            
            // إعداد أيقونات الفئات
            devicesData = devicesData.map(device => {
                return {
                    ...device
                };
            });
        }
    } catch (error) {
        console.error('خطأ في تحميل تفاصيل الأجهزة:', error);
    }
}

// جلب تفاصيل جهاز محدد
async function fetchDeviceDetails(deviceId) {
    try {
        const response = await fetch(`${DEVICES_API}/deviceById/${deviceId}`);
        
        if (!response.ok) {
            throw new Error(`فشل في تحميل تفاصيل الجهاز: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`خطأ في جلب تفاصيل الجهاز ${deviceId}:`, error);
        throw error;
    }
}

// تحديد أيقونة مناسبة للجهاز بناءً على اسمه
function getDeviceIcon(deviceName) {
    const name = deviceName.toLowerCase();
    
    if (name.includes('مجهر') || name.includes('ميكروسكوب') || name.includes('بصر')) {
        return 'fas fa-microscope';
    } else if (name.includes('قياس') || name.includes('مطياف')) {
        return 'fas fa-wave-square';
    } else if (name.includes('حرار') || name.includes('نيتروجين') || name.includes('درجة')) {
        return 'fas fa-temperature-high';
    } else if (name.includes('إشعاع') || name.includes('جاما') || name.includes('نوو')) {
        return 'fas fa-radiation';
    } else if (name.includes('ليزر') || name.includes('ضوئ')) {
        return 'fas fa-bolt';
    } else if (name.includes('مغناطيس')) {
        return 'fas fa-magnet';
    } else if (name.includes('كهرب')) {
        return 'fas fa-plug';
    } else {
        return 'fas fa-atom';
    }
}

// تحويل قيمة الحالة من API إلى قيمة مناسبة للعرض
function mapStatusValue(status) {
    if (!status) return 'unavailable';
    
    status = status.trim();
    
    if (status === 'متاح') {
        return 'available';
    } else if (status === 'غير_متاح' || status === 'غير متاح') {
        return 'unavailable';
    } else if (status === 'قيد_الصيانة' || status === 'قيد الصيانة') {
        return 'maintenance';
    } else {
        return 'unavailable';
    }
}

function mapCategoryValue(category) {
    if (!category) return 'unavailable';
    
    category = category.trim();
    
    if (category === 'أجهزة بصرية') {
        return 'microscope';
    } else if (category === 'أجهزة قياس') {
        return 'measurement';
    } else {
        return 'unavailable';
    }
}

// استخراج الفئات والمختبرات الفريدة للتصفية
function extractUniqueFilters() {
    categories.clear();
    labs.clear();
    
    devicesData.forEach(device => {
        if (device.category) categories.add(device.category);
        if (device.lab) labs.add(device.lab);
    });
}

// تعبئة قوائم التصفية بالقيم الفريدة
function populateFilterDropdowns() {
    const categoryFilter = document.getElementById('category-filter');
    const labFilter = document.getElementById('lab-filter');
    
    // حذف الخيارات القديمة باستثناء الخيار الأول
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    while (labFilter.options.length > 1) {
        labFilter.remove(1);
    }
    
    // إضافة الفئات
    const uniqueCategories = new Set();
    devicesData.forEach(device => {
        if (device.category && !uniqueCategories.has(device.category)) {
            uniqueCategories.add(device.category);
            const option = document.createElement('option');
            option.value = device.category;
            option.textContent = device.category;
            categoryFilter.appendChild(option);
        }
    });
    
    // إضافة المختبرات
    const uniqueLabs = new Set();
    devicesData.forEach(device => {
        if (device.lab && !uniqueLabs.has(device.lab)) {
            uniqueLabs.add(device.lab);
            const option = document.createElement('option');
            option.value = device.lab;
            option.textContent = device.lab;
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
                    <i class="${device.icon || 'fas fa-atom'} device-icon mb-3"></i>
                    <h5>${device.name}</h5>
                    <span class="status-${device.status}">${device.statusText}</span>
                    <p class="text-muted mt-2">رقم الجهاز: ${device.serialNumber || device.id}</p>
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
                          (device.serialNumber && device.serialNumber.toString().includes(searchValue)) ||
                          device.id.toString().includes(searchValue);
        
        return matchCategory && matchStatus && matchLab && matchSearch;
    });
    
    renderDevices(filteredDevices);
}

// عرض تفاصيل الجهاز في نافذة منبثقة
async function showDeviceDetails(deviceId) {
    try {
        // الحصول على تفاصيل الجهاز من API
        const deviceDetails = await fetchDeviceDetails(deviceId);
        currentDevice = deviceDetails;
        
        if (!currentDevice) {
            showAlert('لم يتم العثور على بيانات الجهاز', 'danger');
            return;
        }
        
        // تحديث بيانات الجهاز في النافذة المنبثقة
        document.getElementById('device-details-title').textContent = currentDevice.name;
        const icon = getDeviceIcon(currentDevice.name);
        document.getElementById('device-details-icon').className = `${icon} fa-4x mb-3`;
        
        const statusClass = mapStatusValue(currentDevice.status);
        document.getElementById('device-details-status').className = `status-${statusClass}`;
        document.getElementById('device-details-status').textContent = currentDevice.status;
        
        document.getElementById('device-id').textContent = currentDevice.serialNumber || currentDevice.id;

        // const category = mapCategoryValue(currentDevice.category);
        // document.getElementById('device-category').className = `category-${category} || 'غير محدد'`;
        document.getElementById('device-category').textContent = currentDevice.category || 'غير محدد';
        document.getElementById('device-lab').textContent = currentDevice.location || 'غير محدد';
        
        document.getElementById('device-purchase-date').textContent = formatDate(currentDevice.purchaseDate);
        document.getElementById('device-lifespan').textContent = `${currentDevice.lifespan} سنوات`;
        document.getElementById('device-last-maintenance').textContent = formatDate(currentDevice.lastMaintenance);
        
        // عرض سجل الصيانة
        renderMaintenanceHistory(currentDevice.maintenanceHistory);
        
        // عرض الملاحظات
        document.getElementById('device-notes').textContent = currentDevice.notes || 'لا توجد ملاحظات';
        
        // إضافة زر الحذف
        const modalFooter = document.querySelector('#deviceDetailsModal .modal-footer');
        
        // التحقق من وجود زر الحذف وإزالته إذا كان موجودًا
        const existingDeleteBtn = document.getElementById('delete-device-btn');
        if (existingDeleteBtn) {
            existingDeleteBtn.remove();
        }
        
        // إضافة زر الحذف
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.id = 'delete-device-btn';
        deleteBtn.className = 'btn btn-danger me-auto';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt me-1"></i>حذف';
        deleteBtn.addEventListener('click', () => confirmDeleteDevice(currentDevice.id));
        
        modalFooter.insertBefore(deleteBtn, modalFooter.firstChild);
        
        // عرض النافذة المنبثقة
        $('#deviceDetailsModal').modal('show');
    } catch (error) {
        console.error('خطأ في عرض تفاصيل الجهاز:', error);
        showAlert('حدث خطأ أثناء تحميل تفاصيل الجهاز.', 'danger');
    }
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
        if (record.status === 'قيد التنفيذ') {
            statusClass = 'bg-warning';
        } else if (record.status === 'مجدولة') {
            statusClass = 'bg-info';
        }
        
        recordElement.innerHTML = `
            <span>${formatDate(record.date)}: ${record.description}</span>
            <span class="badge ${statusClass}">${record.status}</span>
        `;
        
        maintenanceContainer.appendChild(recordElement);
    });
}

// عرض نافذة تأكيد الحذف
function confirmDeleteDevice(deviceId) {
    if (!deviceId) return;

    // إنشاء عنصر الموديل
    const modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.setAttribute('tabindex', '-1');
    modalElement.setAttribute('aria-labelledby', 'deleteConfirmModalLabel');
    modalElement.setAttribute('aria-hidden', 'true');
    
    modalElement.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="deleteConfirmModalLabel">تأكيد الحذف</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
                </div>
                <div class="modal-body">
                    <p>هل أنت متأكد من رغبتك في حذف هذا الجهاز؟</p>
                    <p class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>لا يمكن التراجع عن هذه العملية.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                    <button type="button" class="btn btn-danger" id="confirm-delete-btn">
                        <i class="fas fa-trash-alt me-1"></i>تأكيد الحذف
                    </button>
                </div>
            </div>
        </div>
    `;

    // إضافة الموديل إلى الصفحة
    document.body.appendChild(modalElement);

    // إنشاء كائن الموديل
    const modal = new bootstrap.Modal(modalElement);

    // إضافة مستمع الحدث لزر التأكيد
    const confirmBtn = modalElement.querySelector('#confirm-delete-btn');
    confirmBtn.addEventListener('click', () => {
        modal.hide();
        deleteDevice(deviceId);
    });

    // إزالة الموديل من الصفحة عند إغلاقه
    modalElement.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modalElement);
    });

    // عرض الموديل
    modal.show();
}

// حذف جهاز
async function deleteDevice(deviceId) {
    try {
        if (!deviceId) {
            showAlert('معرف الجهاز غير صالح', 'danger');
            return;
        }

        // إظهار مؤشر التحميل
        const deleteBtn = document.getElementById('delete-device-btn');
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>جاري الحذف...';
        }

        const response = await fetch(`${DEVICES_API}/deleteDeviceById/${deviceId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit' // تغيير من 'include' إلى 'omit'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `فشل في حذف الجهاز: ${response.status}`);
        }
        
        // إغلاق النافذة المنبثقة
        $('#deviceDetailsModal').modal('hide');
        
        // عرض رسالة نجاح
        showAlert('تم حذف الجهاز بنجاح!', 'success');
        
        // إعادة تحميل بيانات الأجهزة
        await loadDevicesData();
    } catch (error) {
        console.error('خطأ في حذف الجهاز:', error);
        
        // إعادة تفعيل زر الحذف
        const deleteBtn = document.getElementById('delete-device-btn');
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt me-1"></i>حذف';
        }

        // عرض رسالة خطأ مناسبة
        let errorMessage = 'حدث خطأ أثناء محاولة حذف الجهاز.';
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
        } else if (error.message.includes('401')) {
            errorMessage = 'غير مصرح لك بحذف هذا الجهاز. يرجى تسجيل الدخول مرة أخرى.';
        } else if (error.message.includes('404')) {
            errorMessage = 'لم يتم العثور على الجهاز. قد يكون قد تم حذفه مسبقاً.';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.';
        }
        
        showAlert(errorMessage, 'danger');
    }
}

// عرض نافذة حجز جهاز
function showReservationModal(deviceId) {
    const device = devicesData.find(device => device.id == deviceId);
    
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
async function handleAddDevice(event) {
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
    
    // إنشاء كائن الجهاز الجديد للإرسال إلى API
    const newDevice = {
        name: deviceName,
        serialNumber: Math.floor(Math.random() * 100000000), // إنشاء رقم تسلسلي عشوائي
        category: document.getElementById('device-category').options[document.getElementById('device-category').selectedIndex].text,
        location: document.getElementById('device-lab').options[document.getElementById('device-lab').selectedIndex].text,
        status: document.getElementById('device-status').options[document.getElementById('device-status').selectedIndex].text,
        purchaseDate: devicePurchaseDate,
        lifespan: parseInt(deviceLifespan),
        notes: deviceNotes
    };
    
    try {
        const response = await fetch(`${DEVICES_API}/AddDevice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newDevice)
        });
        
        if (!response.ok) {
            throw new Error(`فشل في إضافة الجهاز: ${response.status}`);
        }
        
        // إخفاء النافذة المنبثقة
        $('#addDeviceModal').modal('hide');
        
        // عرض رسالة نجاح
        showAlert('تم إضافة الجهاز بنجاح!', 'success');
        
        // إعادة تحميل بيانات الأجهزة
        loadDevicesData();
    } catch (error) {
        console.error('خطأ في إضافة الجهاز:', error);
        showAlert('حدث خطأ أثناء محاولة إضافة الجهاز.', 'danger');
    }
}

// تعديل بيانات جهاز
async function editDevice(deviceId) {
    try {
        if (!deviceId) {
            showAlert('معرف الجهاز غير صالح', 'danger');
            return;
        }

        // الحصول على بيانات الجهاز الحالية
        const deviceDetails = await fetchDeviceDetails(deviceId);
        
        if (!deviceDetails) {
            showAlert('لم يتم العثور على بيانات الجهاز', 'danger');
            return;
        }

        // تعبئة نموذج التعديل بالبيانات الحالية
        document.getElementById('edit-device-id').value = deviceDetails.id;
        document.getElementById('edit-device-name').value = deviceDetails.name;
        
        // تحديد القيمة المناسبة في قائمة الفئات
        const categorySelect = document.getElementById('edit-device-category');
        for (let i = 0; i < categorySelect.options.length; i++) {
            if (categorySelect.options[i].text === deviceDetails.category) {
                categorySelect.selectedIndex = i;
                break;
            }
        }
        
        // تحديد القيمة المناسبة في قائمة المختبرات
        const labSelect = document.getElementById('edit-device-lab');
        for (let i = 0; i < labSelect.options.length; i++) {
            if (labSelect.options[i].text === deviceDetails.location) {
                labSelect.selectedIndex = i;
                break;
            }
        }
        
        // تحديد القيمة المناسبة في قائمة الحالة
        const statusSelect = document.getElementById('edit-device-status');
        for (let i = 0; i < statusSelect.options.length; i++) {
            if (statusSelect.options[i].text === deviceDetails.status) {
                statusSelect.selectedIndex = i;
                break;
            }
        }
        
        // تعبئة باقي الحقول
        document.getElementById('edit-device-purchase-date').value = deviceDetails.purchaseDate ? new Date(deviceDetails.purchaseDate).toISOString().split('T')[0] : '';
        document.getElementById('edit-device-lifespan').value = deviceDetails.lifespan || '';
        document.getElementById('edit-device-notes').value = deviceDetails.notes || '';
        
        // إغلاق نافذة التفاصيل وفتح نافذة التعديل
        $('#deviceDetailsModal').modal('hide');
        
        // تأخير قصير قبل فتح نافذة التعديل
        setTimeout(() => {
            $('#editDeviceModal').modal('show');
        }, 500);
    } catch (error) {
        console.error('خطأ في تحميل بيانات الجهاز للتعديل:', error);
        showAlert('حدث خطأ أثناء محاولة تحميل بيانات الجهاز للتعديل.', 'danger');
    }
}

// معالجة تحديث بيانات الجهاز
async function handleUpdateDevice(event) {
    event.preventDefault();
    
    const deviceId = document.getElementById('edit-device-id').value;
    const deviceName = document.getElementById('edit-device-name').value;
    const deviceCategory = document.getElementById('edit-device-category').value;
    const deviceLab = document.getElementById('edit-device-lab').value;
    const deviceStatus = document.getElementById('edit-device-status').value;
    const devicePurchaseDate = document.getElementById('edit-device-purchase-date').value;
    const deviceLifespan = document.getElementById('edit-device-lifespan').value;
    const deviceNotes = document.getElementById('edit-device-notes').value;
    
    // التحقق من صحة البيانات
    if (!deviceName || !deviceCategory || !deviceLab || !deviceStatus || !devicePurchaseDate || !deviceLifespan) {
        showAlert('يرجى ملء جميع الحقول المطلوبة', 'danger');
        return;
    }
    
    // إنشاء كائن لتحديث بيانات الجهاز
    const updatedDevice = {
        id: deviceId,
        name: deviceName,
        serialNumber: currentDevice.serialNumber,
        category: document.getElementById('edit-device-category').options[document.getElementById('edit-device-category').selectedIndex].text,
        location: document.getElementById('edit-device-lab').options[document.getElementById('edit-device-lab').selectedIndex].text,
        status: document.getElementById('edit-device-status').options[document.getElementById('edit-device-status').selectedIndex].text,
        purchaseDate: devicePurchaseDate,
        lifespan: parseInt(deviceLifespan),
        notes: deviceNotes
    };
    
    try {
        const response = await fetch(`${DEVICES_API}/updateDeviceById/${deviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedDevice)
        });
        
        if (!response.ok) {
            throw new Error(`فشل في تحديث بيانات الجهاز: ${response.status}`);
        }
        
        // إخفاء النافذة المنبثقة
        $('#editDeviceModal').modal('hide');
        
        // عرض رسالة نجاح
        showAlert('تم تحديث بيانات الجهاز بنجاح!', 'success');
        
        // إعادة تحميل بيانات الأجهزة
        loadDevicesData();
    } catch (error) {
        console.error('خطأ في تحديث بيانات الجهاز:', error);
        showAlert('حدث خطأ أثناء محاولة تحديث بيانات الجهاز.', 'danger');
    }
}

// إضافة مستمع الحدث لنموذج التعديل
document.addEventListener('DOMContentLoaded', () => {
    const editDeviceForm = document.getElementById('edit-device-form');
    if (editDeviceForm) {
        editDeviceForm.addEventListener('submit', handleUpdateDevice);
    }
});

// إعادة تعيين نموذج إضافة/تعديل الجهاز
function resetAddDeviceForm() {
    // إعادة تعيين حقول النموذج
    document.getElementById('add-device-form').reset();
    
    // إعادة نص زر الإرسال
    const submitButton = document.querySelector('#add-device-form button[type="submit"]');
    submitButton.textContent = 'إضافة جهاز';
    
    // إعادة عنوان النافذة
    document.getElementById('addDeviceModalLabel').textContent = 'إضافة جهاز جديد';
    
    // إزالة معرف الجهاز إذا كان موجودًا
    const deviceIdInput = document.getElementById('edit-device-id');
    if (deviceIdInput) {
        deviceIdInput.value = '';
    }
    
    // إعادة وظيفة النموذج لإضافة جهاز جديد
    const form = document.getElementById('add-device-form');
    form.removeEventListener('submit', handleUpdateDevice);
    form.addEventListener('submit', handleAddDevice);
}

// تنسيق التاريخ للعرض
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// عرض رسالة تنبيه للمستخدم
function showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alerts-container');
    
    // إنشاء عنصر التنبيه
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.setAttribute('role', 'alert');
    
    // إضافة محتوى التنبيه
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button>
    `;
    
    // إضافة عنصر التنبيه إلى الحاوية
    alertsContainer.appendChild(alertElement);
    
    // إزالة التنبيه تلقائيًا بعد 5 ثوانٍ
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => alertElement.remove(), 300);
    }, 5000);
}

// تهيئة نوافذ الموديلات
function initializeModals() {
    // نافذة إضافة/تعديل جهاز
    const addDeviceModal = document.getElementById('addDeviceModal');
    if (addDeviceModal) {
        addDeviceModal.addEventListener('hidden.bs.modal', resetAddDeviceForm);
    }
    
    // نافذة حجز جهاز
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleReservation);
    }
    
    // إضافة زر تعديل إلى نافذة تفاصيل الجهاز
    const deviceDetailsModal = document.getElementById('deviceDetailsModal');
    if (deviceDetailsModal) {
        // إضافة زر تعديل
        const editBtnExist = document.getElementById('edit-device-btn');
        if (!editBtnExist) {
            const modalFooter = deviceDetailsModal.querySelector('.modal-footer');
            const editBtn = document.createElement('button');
            editBtn.type = 'button';
            editBtn.id = 'edit-device-btn';
            editBtn.className = 'btn btn-primary';
            editBtn.innerHTML = '<i class="fas fa-edit me-1"></i>تعديل';
            editBtn.addEventListener('click', () => {
                if (currentDevice) {
                    editDevice(currentDevice.id);
                }
            });
            
            // إضافة الزر إلى نهاية شريط الأزرار
            modalFooter.appendChild(editBtn);
        }
    }
}

// إضافة صيانة جديدة للجهاز
async function addMaintenance(deviceId) {
    try {
        // الحصول على بيانات نموذج الصيانة
        const maintenanceDate = document.getElementById('maintenance-date').value;
        const maintenanceDescription = document.getElementById('maintenance-description').value;
        const maintenanceStatus = document.getElementById('maintenance-status').value;
        
        // التحقق من صحة البيانات
        if (!maintenanceDate || !maintenanceDescription || !maintenanceStatus) {
            showAlert('يرجى ملء جميع حقول الصيانة المطلوبة', 'danger');
            return;
        }
        
        // إنشاء كائن سجل الصيانة الجديد
        const newMaintenance = {
            date: maintenanceDate,
            description: maintenanceDescription,
            status: document.getElementById('maintenance-status').options[document.getElementById('maintenance-status').selectedIndex].text
        };
        
        // إضافة سجل الصيانة إلى الجهاز
        const response = await fetch(`${DEVICES_API}/addMaintenanceRecord/${deviceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newMaintenance)
        });
        
        if (!response.ok) {
            throw new Error(`فشل في إضافة سجل الصيانة: ${response.status}`);
        }
        
        // عرض رسالة نجاح
        showAlert('تم إضافة سجل الصيانة بنجاح!', 'success');
        
        // إعادة تحميل بيانات الجهاز وتحديث سجل الصيانة
        const deviceDetails = await fetchDeviceDetails(deviceId);
        renderMaintenanceHistory(deviceDetails.maintenanceHistory);
        
        // إعادة تعيين نموذج الصيانة
        document.getElementById('maintenance-form').reset();
    } catch (error) {
        console.error('خطأ في إضافة سجل الصيانة:', error);
        showAlert('حدث خطأ أثناء محاولة إضافة سجل الصيانة.', 'danger');
    }
}

// عرض نافذة جدولة صيانة
function showMaintenanceModal(deviceId) {
    // تعيين التاريخ الافتراضي إلى اليوم
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('maintenance-date').value = formattedDate;
    document.getElementById('maintenance-date').min = formattedDate;
    
    // إعادة تعيين حقول النموذج الأخرى
    document.getElementById('maintenance-description').value = '';
    document.getElementById('maintenance-status').value = 'scheduled';
    
    // تعيين معرف الجهاز في النموذج
    document.getElementById('maintenance-device-id').value = deviceId;
    
    // إضافة حدث إرسال النموذج
    const form = document.getElementById('maintenance-form');
    form.onsubmit = (event) => {
        event.preventDefault();
        addMaintenance(deviceId);
    };
    
    // عرض النافذة المنبثقة
    $('#maintenanceModal').modal('show');
}

// تصدير بيانات الأجهزة إلى ملف CSV
function exportDevicesToCSV() {
    if (devicesData.length === 0) {
        showAlert('لا توجد بيانات للتصدير', 'warning');
        return;
    }
    
    // تحديد أعمدة التصدير
    const headers = ['معرف', 'اسم الجهاز', 'الرقم التسلسلي', 'الفئة', 'المختبر', 'الحالة', 'تاريخ الشراء', 'العمر الافتراضي', 'ملاحظات'];
    
    // إنشاء الصفوف للبيانات
    const rows = devicesData.map(device => [
        device.id,
        device.name,
        device.serialNumber || '',
        device.category || '',
        device.location || '',
        device.status || '',
        device.purchaseDate ? formatDate(device.purchaseDate) : '',
        device.lifespan || '',
        device.notes || ''
    ]);
    
    // إضافة رأس الجدول كصف أول
    rows.unshift(headers);
    
    // تحويل البيانات إلى نص CSV
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    rows.forEach(row => {
        csvContent += row.join(',') + '\r\n';
    });
    
    // إنشاء رابط للتحميل
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `devices_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    
    // تنفيذ النقر التلقائي لبدء التحميل
    link.click();
    
    // إزالة الرابط
    document.body.removeChild(link);
}

// استيراد بيانات الأجهزة من ملف CSV
function importDevicesFromCSV(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const contents = e.target.result;
        
        // تقسيم المحتويات إلى صفوف
        const rows = contents.split('\r\n');
        if (rows.length <= 1) {
            showAlert('ملف CSV فارغ أو غير صالح', 'warning');
            return;
        }
        
        // استخراج رؤوس الأعمدة
        const headers = rows[0].split(',');
        
        // مؤشرات للأعمدة المطلوبة
        const nameIndex = headers.indexOf('اسم الجهاز');
        const serialNumberIndex = headers.indexOf('الرقم التسلسلي');
        const categoryIndex = headers.indexOf('الفئة');
        const labIndex = headers.indexOf('المختبر');
        const statusIndex = headers.indexOf('الحالة');
        const purchaseDateIndex = headers.indexOf('تاريخ الشراء');
        const lifespanIndex = headers.indexOf('العمر الافتراضي');
        const notesIndex = headers.indexOf('ملاحظات');
        
        // التحقق من وجود جميع الأعمدة المطلوبة
        if (nameIndex === -1 || categoryIndex === -1 || labIndex === -1 || statusIndex === -1) {
            showAlert('صيغة ملف CSV غير صحيحة. تأكد من وجود جميع الأعمدة المطلوبة', 'danger');
            return;
        }
        
        // تحويل الصفوف إلى كائنات أجهزة
        const devices = [];
        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue;
            
            const cols = rows[i].split(',');
            
            // إنشاء كائن الجهاز
            const device = {
                name: cols[nameIndex],
                serialNumber: cols[serialNumberIndex] || Math.floor(Math.random() * 100000000),
                category: cols[categoryIndex],
                location: cols[labIndex],
                status: cols[statusIndex],
                purchaseDate: cols[purchaseDateIndex] || new Date().toISOString().slice(0, 10),
                lifespan: cols[lifespanIndex] || 10,
                notes: cols[notesIndex] || ''
            };
            
            devices.push(device);
        }
        
        // استيراد الأجهزة إلى قاعدة البيانات
        let successCount = 0;
        let errorCount = 0;
        
        for (const device of devices) {
            try {
                const response = await fetch(`${DEVICES_API}/AddDevice`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(device)
                });
                
                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.error('خطأ في استيراد الجهاز:', error);
                errorCount++;
            }
        }
        
        // عرض رسالة بنتيجة الاستيراد
        if (successCount > 0) {
            showAlert(`تم استيراد ${successCount} جهاز بنجاح${errorCount > 0 ? ` وفشل استيراد ${errorCount} جهاز` : ''}`, errorCount > 0 ? 'warning' : 'success');
            
            // إعادة تحميل بيانات الأجهزة
            loadDevicesData();
        } else {
            showAlert('فشل استيراد الأجهزة', 'danger');
        }
        
        // إعادة تعيين حقل تحميل الملف
        event.target.value = '';
    };
    
    reader.readAsText(file, 'UTF-8');
}

// إضافة أزرار التصدير والاستيراد إلى الواجهة
function addExportImportButtons() {
    const actionsContainer = document.querySelector('.buttons-container');
    
    if (!actionsContainer) {
        console.warn('Container for export/import buttons not found');
        return;
    }
    
    // إضافة زر التصدير
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-outline-primary me-2';
    exportBtn.innerHTML = '<i class="fas fa-file-export me-1"></i>تصدير';
    exportBtn.addEventListener('click', exportDevicesToCSV);
    
    // إنشاء عنصر إدخال الملف للاستيراد
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.csv';
    importInput.style.display = 'none';
    importInput.id = 'import-csv';
    importInput.addEventListener('change', importDevicesFromCSV);
    
    // إنشاء زر للاستيراد يفتح مربع حوار اختيار الملف
    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn-outline-primary';
    importBtn.innerHTML = '<i class="fas fa-file-import me-1"></i>استيراد';
    importBtn.addEventListener('click', () => importInput.click());
    
    // إضافة العناصر إلى الواجهة
    actionsContainer.appendChild(exportBtn);
    actionsContainer.appendChild(importBtn);
    actionsContainer.appendChild(importInput);
}

// إضافة وظيفة عرض الإشعارات والتنبيهات
function setupNotifications() {
    // إنشاء عنصر للإشعارات
    const notificationsContainer = document.createElement('div');
    notificationsContainer.id = 'notifications-container';
    notificationsContainer.className = 'position-fixed top-0 end-0 p-3';
    notificationsContainer.style.zIndex = '1080';
    document.body.appendChild(notificationsContainer);
    
    // البحث عن أجهزة بحاجة إلى صيانة
    function checkDevicesNeedingMaintenance() {
        const today = new Date();
        const devicesNeedingMaintenance = devicesData.filter(device => {
            if (!device.lastMaintenance) return false;
            
            const lastMaintenance = new Date(device.lastMaintenance);
            const monthsDiff = (today.getFullYear() - lastMaintenance.getFullYear()) * 12 + today.getMonth() - lastMaintenance.getMonth();
            
            // الصيانة مطلوبة إذا مضى أكثر من 6 أشهر منذ آخر صيانة
            return monthsDiff >= 6;
        });
        
        if (devicesNeedingMaintenance.length > 0) {
            showNotification(`هناك ${devicesNeedingMaintenance.length} جهاز بحاجة إلى صيانة`, 'warning');
        }
    }
    
    // عرض إشعار
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `toast align-items-center text-white bg-${type} border-0`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        notification.setAttribute('aria-atomic', 'true');
        
        notification.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="إغلاق"></button>
            </div>
        `;
        
        notificationsContainer.appendChild(notification);
        
        // إظهار الإشعار
        const toast = new bootstrap.Toast(notification, {
            autohide: true,
            delay: 5000
        });
        toast.show();
        
        // إزالة الإشعار بعد الإخفاء
        notification.addEventListener('hidden.bs.toast', () => {
            notification.remove();
        });
    }
    
    // التحقق من الأجهزة بعد تحميل البيانات
    document.addEventListener('deviceDataLoaded', checkDevicesNeedingMaintenance);
    
    // عرض الإشعارات بعد تحميل البيانات
    document.addEventListener('deviceDataLoaded', () => {
        const devicesNeedingMaintenance = devicesData.filter(device => device.status === 'maintenance');
        if (devicesNeedingMaintenance.length > 0) {
            showNotification(`هناك ${devicesNeedingMaintenance.length} جهاز قيد الصيانة حاليًا`, 'info');
        }
    });
    
    // إرسال حدث لتأكيد تحميل البيانات
    document.addEventListener('DOMContentLoaded', () => {
        window.setTimeout(() => {
            document.dispatchEvent(new Event('deviceDataLoaded'));
        }, 2000);
    });
}

// استدعاء الوظائف الإضافية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // إضافة أزرار التصدير والاستيراد
    addExportImportButtons();
    
    // إعداد نظام الإشعارات
    setupNotifications();
});