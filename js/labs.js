document.addEventListener("DOMContentLoaded", function () {
    // تعريف API_BASE_URL
    const API_BASE_URL = "http://labmangmentsystemapi.runasp.net";

    // التحقق من تسجيل الدخول
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const token = localStorage.getItem("token");
    if (!isLoggedIn || !token) {
        console.log("المستخدم غير مسجل الدخول، يتم إعادة التوجيه إلى login.html");
        window.location.href = "login.html";
        return;
    }

    // عناصر DOM
    const alertsContainer = document.getElementById("alerts-container");
    const loadingSpinner = document.getElementById("loading-spinner");
    const tbody = document.querySelector("tbody");
    const modal = document.getElementById("addLabModal");
    const form = document.getElementById("labForm");
    const saveButton = document.getElementById("saveLabBtn");
    const saveSpinner = document.getElementById("saveSpinner");

    // متغير لتخزين الـ Modal instance
    let modalInstance = null;

    // دالة لإظهار تنبيهات
    function showAlert(message, type = "success") {
        const alert = document.createElement("div");
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = "alert";
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="إغلاق"></button>
        `;
        alertsContainer.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    // دالة لإظهار/إخفاء مؤشر التحميل
    function toggleLoading(show, isModal = false) {
        if (isModal) {
            saveSpinner.classList.toggle("d-none", !show);
            saveButton.disabled = show;
        } else {
            loadingSpinner.classList.toggle("d-none", !show);
        }
    }

    // دالة للتحقق من صحة البيانات المستلمة
    function validateLabData(lab) {
        if (!lab || typeof lab !== "object") return false;
        if (typeof lab.id !== "number") return false;
        if (typeof lab.name !== "string") lab.name = "غير محدد";
        if (typeof lab.type !== "string") lab.type = "غير محدد";
        if (typeof lab.location !== "string") lab.location = "غير محدد";
        if (typeof lab.capacity !== "number" || lab.capacity < 0) lab.capacity = 0;
        if (!["Active", "Inactive"].includes(lab.status)) lab.status = "Inactive";
        if (typeof lab.operatingHours !== "number" || lab.operatingHours < 0) lab.operatingHours = 0;
        return true;
    }

    // دالة للتحقق من استجابة الإضافة أو التعديل
    function validateApiResponse(data) {
        return data && (data.message === "تمت الإضافة بنجاح" || data.message === "تم إضافة المعمل بنجاح" || data.message === "تمت عملية التعديل بنجاح" || data.message === "تم تعديل بيانات المعمل بنجاح");
    }

    // دالة لجلب المعامل من الـ API
    async function getLabs() {
        toggleLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/Laboratory/getAllLabs`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                if (response.status === 401) {
                    showAlert("جلسة تسجيل الدخول منتهية، يرجى تسجيل الدخول مجددًا", "danger");
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("token");
                    window.location.href = "login.html";
                    return [];
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `خطأ HTTP! الحالة: ${response.status}`);
            }
            const labs = await response.json();
            return Array.isArray(labs) ? labs.filter(validateLabData) : [];
        } catch (e) {
            console.error("خطأ في جلب المعامل:", e);
            showAlert(e.message || "فشل في جلب قائمة المعامل", "danger");
            return [];
        } finally {
            toggleLoading(false);
        }
    }

    // دالة لعرض المعامل في الجدول
    function displayLabs(labs) {
        tbody.innerHTML = "";
        labs.forEach((lab) => {
            const statusMap = {
                Active: { text: "نشط", class: "success" },
                Inactive: { text: "غير نشط", class: "danger" },
            };
            const status = statusMap[lab.status] || { text: "غير معروف", class: "warning" };
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${lab.name}</td>
                <td>${lab.type}</td>
                <td>${lab.location}</td>
                <td>${lab.capacity} طالب</td>
                <td><span class="badge bg-${status.class}">${status.text}</span></td>
                <td>${lab.operatingHours} ساعة</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${lab.id}" disabled>تعديل</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${lab.id}" data-name="${lab.name}" disabled>حذف</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // إضافة مستمعي الأحداث للأزرار بعد إنشائها
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.disabled = false;
            btn.addEventListener("click", () => editLab(parseInt(btn.getAttribute("data-id"))));
        });
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.disabled = false;
            btn.addEventListener("click", () => deleteLab(parseInt(btn.getAttribute("data-id")), btn.getAttribute("data-name")));
        });
    }

    // دالة لإضافة أو تحديث معمل في الجدول
    async function updateTable() {
        const labs = await getLabs();
        displayLabs(labs);
    }

    // دالة للتحقق من صحة حقول النموذج
    function validateForm() {
        const name = form.querySelector("#labName").value.trim();
        const type = form.querySelector("#labType").value.trim();
        const location = form.querySelector("#labLocation").value.trim();
        const capacity = parseInt(form.querySelector("#labCapacity").value);
        const status = form.querySelector("#labStatus").value;
        const operatingHours = parseInt(form.querySelector("#labOperatingHours").value);
        const isValid = name &&
            type &&
            location &&
            !isNaN(capacity) && capacity >= 1 &&
            ["Active", "Inactive"].includes(status) &&
            !isNaN(operatingHours) && operatingHours >= 0;
        saveButton.disabled = !isValid;
        return isValid;
    }

    form.addEventListener("input", validateForm);

    async function addLab() {
        if (!validateForm()) {
            showAlert("يرجى ملء جميع الحقول بشكل صحيح", "danger");
            return;
        }
        if (!confirm("هل أنت متأكد من إضافة المعمل؟")) return;
        toggleLoading(true, true);

        const name = form.querySelector("#labName").value.trim();
        const type = form.querySelector("#labType").value.trim();
        const location = form.querySelector("#labLocation").value.trim();
        const capacity = parseInt(form.querySelector("#labCapacity").value);
        const status = form.querySelector("#labStatus").value;
        const operatingHours = parseInt(form.querySelector("#labOperatingHours").value);

        try {
            const response = await fetch(`${API_BASE_URL}/api/Laboratory/addLab`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ name, type, location, capacity, status, operatingHours }),
            });

            const responseData = await response.json();
            if (!response.ok || !validateApiResponse(responseData)) {
                throw new Error(responseData.message || "فشل في إضافة المعمل");
            }

            showAlert("تم إضافة المعمل بنجاح", "success");

            // تحديث الجدول
            await updateTable();

            // إغلاق المودال باستخدام الـ Modal instance إذا موجود، أو بطريقة Bootstrap افتراضية
            if (modalInstance) {
                modalInstance.hide();
            } else {
                const tempModalInstance = bootstrap.Modal.getInstance(modal);
                if (tempModalInstance) {
                    tempModalInstance.hide();
                } else {
                    // إغلاق يدوي إذا فشلت الطرق السابقة
                    modal.classList.remove("show");
                    modal.style.display = "none";
                    const backdrop = document.querySelector(".modal-backdrop");
                    if (backdrop) backdrop.remove();
                    document.body.classList.remove("modal-open");
                }
            }

            form.reset();
        } catch (e) {
            console.error("خطأ في إضافة المعمل:", e);
            showAlert(e.message || "فشل في إضافة المعمل", "danger");
        } finally {
            toggleLoading(false, true);
        }
    }

    window.editLab = async function (id) {
        toggleLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/Laboratory/getLabById/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `خطأ HTTP! الحالة: ${response.status}`);
            }
            const lab = await response.json();
            if (!validateLabData(lab)) {
                throw new Error("البيانات المستلمة غير صحيحة");
            }

            modal.querySelector(".modal-title").textContent = "تعديل معمل";
            form.querySelector("#labName").value = lab.name;
            form.querySelector("#labType").value = lab.type;
            form.querySelector("#labLocation").value = lab.location;
            form.querySelector("#labCapacity").value = lab.capacity;
            form.querySelector("#labStatus").value = lab.status;
            form.querySelector("#labOperatingHours").value = lab.operatingHours;

            validateForm();
            saveButton.onclick = () => updateLab(id);

            // تخزين الـ Modal instance
            modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
        } catch (e) {
            console.error("خطأ في جلب بيانات المعمل:", e);
            showAlert(e.message || "فشل في جلب بيانات المعمل", "danger");
        } finally {
            toggleLoading(false);
        }
    };

    async function updateLab(id) {
        if (!validateForm()) {
            showAlert("يرجى ملء جميع الحقول بشكل صحيح", "danger");
            return;
        }
        if (!confirm("هل أنت متأكد من تعديل المعمل؟")) return;
        toggleLoading(true, true);

        const name = form.querySelector("#labName").value.trim();
        const type = form.querySelector("#labType").value.trim();
        const location = form.querySelector("#labLocation").value.trim();
        const capacity = parseInt(form.querySelector("#labCapacity").value);
        const status = form.querySelector("#labStatus").value;
        const operatingHours = parseInt(form.querySelector("#labOperatingHours").value);

        try {
            const response = await fetch(`${API_BASE_URL}/api/Laboratory/updateLabById/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ id, name, type, location, capacity, status, operatingHours }),
            });

            const responseData = await response.json();
            if (!response.ok || !validateApiResponse(responseData)) {
                throw new Error(responseData.message || "فشل في تعديل المعمل");
            }

            showAlert("تم تعديل المعمل بنجاح", "success");

            // تحديث الجدول
            await updateTable();

            // إغلاق المودال
            if (modalInstance) {
                modalInstance.hide();
            }

            form.reset();
        } catch (e) {
            console.error("خطأ في تعديل المعمل:", e);
            showAlert(e.message || "فشل في تعديل المعمل", "danger");
        } finally {
            toggleLoading(false, true);
        }
    }

    window.deleteLab = async function (id, name) {
        if (!confirm(`هل أنت متأكد من حذف معمل "${name}"؟`)) return;
        toggleLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/Laboratory/deleteLabById/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: `خطأ HTTP! الحالة: ${response.status}` };
                }
                throw new Error(errorData.message || `خطأ HTTP! الحالة: ${response.status}`);
            }
            let result;
            try {
                result = await response.json();
            } catch {
                result = { message: "تم حذف المعمل بنجاح" };
            }
            showAlert(result.message || "تم حذف المعمل بنجاح", "success");
            await updateTable();
        } catch (e) {
            console.error("خطأ في حذف المعمل:", e, {
                status: e.status,
                url: `${API_BASE_URL}/api/Laboratory/deleteLabById/${id}`,
            });
            if (e.message.includes("Failed to fetch")) {
                showAlert("فشل في الاتصال بالخادم، قد تكون هناك مشكلة في CORS أو الخادم", "danger");
            } else {
                showAlert(e.message || "فشل في حذف المعمل", "danger");
            }
        } finally {
            toggleLoading(false);
        }
    };

    // دالة لتصدير البيانات إلى Excel عبر الـ API
    window.exportExcel = async function () {
        toggleLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/export/labs/excel`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    showAlert("جلسة تسجيل الدخول منتهية، يرجى تسجيل الدخول مجددًا", "danger");
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("token");
                    window.location.href = "login.html";
                    return;
                }
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: `خطأ HTTP! الحالة: ${response.status}` };
                }
                throw new Error(errorData.message || `خطأ HTTP! الحالة: ${response.status}`);
            }

            // معالجة الاستجابة كملف Excel
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Labs_Report.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            showAlert("تم تصدير البيانات إلى Excel بنجاح", "success");
        } catch (e) {
            console.error("خطأ في تصدير Excel:", e);
            if (e.message.includes("Failed to fetch")) {
                showAlert("فشل في الاتصال بالخادم، قد تكون هناك مشكلة في CORS أو الخادم", "danger");
            } else {
                showAlert(e.message || "فشل في تصدير البيانات إلى Excel", "danger");
            }
        } finally {
            toggleLoading(false);
        }
    };

    // دالة لتصدير البيانات إلى PDF عبر الـ API
    window.exportPDF = async function () {
        toggleLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/export/labs/pdf`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    showAlert("جلسة تسجيل الدخول منتهية، يرجى تسجيل الدخول مجددًا", "danger");
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("token");
                    window.location.href = "login.html";
                    return;
                }
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: `خطأ HTTP! الحالة: ${response.status}` };
                }
                throw new Error(errorData.message || `خطأ HTTP! الحالة: ${response.status}`);
            }

            // معالجة الاستجابة كملف PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Labs_Report.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            showAlert("تم تصدير البيانات إلى PDF بنجاح", "success");
        } catch (e) {
            console.error("خطأ في تصدير PDF:", e);
            if (e.message.includes("Failed to fetch")) {
                showAlert("فشل في الاتصال بالخادم، قد تكون هناك مشكلة في CORS أو الخادم", "danger");
            } else {
                showAlert(e.message || "فشل في تصدير البيانات إلى PDF", "danger");
            }
        } finally {
            toggleLoading(false);
        }
    };

    modal.addEventListener("hidden.bs.modal", function () {
        this.querySelector(".modal-title").textContent = "إضافة معمل جديد";
        form.reset();
        validateForm();
        saveButton.onclick = addLab;
        modalInstance = null; // إعادة تعيين الـ Modal instance
    });

    saveButton.onclick = addLab;

    async function initializeLabs() {
        const labs = await getLabs();
        displayLabs(labs);
    }

    initializeLabs();
});