document.addEventListener('DOMContentLoaded', () => {
    const calendarDays = document.getElementById('calendar-days');
    const monthYear = document.getElementById('month-year');
    const prevMonth = document.getElementById('prev-month');
    const nextMonth = document.getElementById('next-month');
    const addEventBtn = document.getElementById('add-event-btn');
    const modal = document.getElementById('event-modal');
    const closeModal = document.querySelector('.close');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    const deviceInput = document.getElementById('device-name');
    const userNameInput = document.getElementById('user-name');
    const labNameInput = document.getElementById('lap-name');
    const eventDateInput = document.getElementById('event-date');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const purposeInput = document.getElementById('purpose');

    const userId = 1;
    let currentDate = new Date();
    let editingReservationId = null;
    let allReservations = []; // 🧠 نستخدمه مع التقويم

    function renderCalendar() {
        calendarDays.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
    
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        monthYear.textContent = `${monthNames[month]} ${year}`;
    
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('empty');
            calendarDays.appendChild(emptyDay);
        }
    
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-number';
            dayHeader.textContent = day;
    
            dayElement.appendChild(dayHeader);
    
            // 🧠 نجيب كل الحجوزات اللي في نفس اليوم
            const reservationsToday = allReservations.filter(res => res.date === dateStr);
    
            reservationsToday.forEach(res => {
                const resDiv = document.createElement('div');
                resDiv.className = 'calendar-reservation';
                resDiv.innerHTML = `
                    <strong>${res.deviceName}</strong><br>
                    🕒 ${res.startTime} - ${res.endTime}<br>
                    👤 ${res.userName}<br>
                    🎯 ${res.purpose}
                `;
                dayElement.appendChild(resDiv);
            });
    
            calendarDays.appendChild(dayElement);
        }
    }
    
    

    prevMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    addEventBtn.addEventListener('click', () => {
        editingReservationId = null;
        clearModalInputs();
        modal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    confirmBtn.addEventListener('click', () => {
        const reservationData = {
            device_id: parseInt(deviceInput.value),
            date: eventDateInput.value,
            start_time: startTimeInput.value,
            end_time: endTimeInput.value,
            purpose: purposeInput.value,
            userName: userNameInput.value  // 🆕 لو السيرفر يدعمه
        };
        

        if (editingReservationId) {
            updateReservation(editingReservationId, reservationData);
        } else {
            createReservation(userId, reservationData);
        }
    });

    async function fetchReservations() {
        try {
            const response = await fetch(`http://labmangmentsystemapi.runasp.net/api/Reservations`);
            const reservations = await response.json();
    
            if (!Array.isArray(reservations)) {
                console.warn("⚠️ الرد مش Array متوقعة:", reservations);
                return;
            }
    
            allReservations = reservations; // 🧠 نخزنهم لاستخدامهم في التقويم
            renderReservationsTable(reservations);
            renderCalendar(); // 🎯 مهم: نرسم التقويم بعد تحميل الحجوزات
    
        } catch (error) {
            console.error('❌ فشل تحميل الحجوزات من السيرفر الرئيسي:', error);
        }
    }
    
    
    function renderReservationsTable(reservations) {
        const tbody = document.querySelector('.events-table tbody');
        tbody.innerHTML = '';

        reservations.forEach(res => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${res.deviceName || `جهاز رقم ${res.device_id}`}</td>
                <td>${res.date || '—'}</td>
                <td>${res.startTime || res.start_time || ''} - ${res.endTime || res.end_time || ''}</td>
                <td>${res.userName || 'مستخدم غير معروف'}</td>
                <td>${res.labName || 'مختبر غير معروف'}</td>
                <td><span class="status confirmed">مؤكد</span></td>
                <td>
                    <button class="action-btn edit" data-id="${res.id}">تعديل</button>
                    <button class="action-btn delete" data-id="${res.id}">حذف</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                editReservation(id);
            });
        });

        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteReservation(id);
            });
        });
    }

    async function createReservation(userId, data) {
        try {
            console.log("📤 محاولة حجز الجهاز:", data);
    
            const response = await fetch(`https://phy-lab-3-production.up.railway.app/reservations/user/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
    
            const result = await response.json();
            console.log("📥 رد السيرفر:", result);
    
            if (result.success && result.message.includes("تم")) {
                alert("✅ تم إرسال الحجز بنجاح!");
                modal.style.display = 'none';
                fetchReservations();
            }
    
            // ✅ التعامل مع حالة الحجز أو الصيانة
            else if (result.message && (result.message.includes("محجوز") || result.message.includes("صيانة"))) {
                const reasonText = result.message.includes("صيانة") ? "⚠️ الجهاز قيد الصيانة!" : "❌ الجهاز محجوز في هذا الوقت!";
                alert(`${reasonText}\n🔄 جاري عرض البدائل...`);
                getDeviceAlternatives(data.device_id);
            }
    
            else if (result.message === "الجهاز غير موجود") {
                alert("⚠️ الجهاز غير موجود في قاعدة بيانات الذكاء الاصطناعي.");
            } else {
                alert("⚠️ لم يتم تنفيذ الحجز. تحقق من البيانات.");
            }
    
        } catch (error) {
            console.error("❌ فشل إرسال الحجز:", error);
            alert("🚨 حدث خطأ أثناء محاولة الحجز.");
        }
    }
    
    async function getDeviceAlternatives(deviceId) {
        try {
            const response = await fetch(`https://phy-lab-3-production.up.railway.app/devices/${deviceId}/alternatives`);
            const result = await response.json();
    
            console.log("🔍 الأجهزة البديلة:", result);
    
            if (result.success && result.count > 0 && Array.isArray(result.alternatives)) {
                let message = `💡 الجهاز محجوز. هذه الأجهزة البديلة المتاحة:\n\n`;
    
                result.alternatives.forEach(device => {
                    message += `🔸 ${device.name}\n📍 المكان: ${device.location}\n⚙️ الحالة: ${device.status}\n✅ الصحة: ${device.health_percentage}%\n💬 السبب: ${device.recommendation_reason}\n\n`;
                });
    
                alert(message);
            } else {
                alert("⚠️ لا توجد أجهزة بديلة متاحة في الوقت الحالي.");
            }
    
        } catch (error) {
            console.error("❌ فشل في جلب البدائل:", error);
            alert("⚠️ حدث خطأ أثناء جلب الأجهزة البديلة.");
        }
    }
    
      

    async function updateReservation(id, data) {
        try {
            const response = await fetch(`https://phy-lab-3-production.up.railway.app/reservations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result && result.success === true && result.message && result.message.includes("تم")) {
                alert("✅ تم تعديل الحجز!");
                fetchReservations();
                modal.style.display = 'none';
            } else {
                alert("❌ لم يتم تعديل الحجز!");
            }
        } catch (error) {
            console.error('❌ فشل التعديل:', error);
        }
    }

    async function deleteReservation(id) {
        if (!confirm("هل تريد حذف الحجز؟")) return;

        try {
            await fetch(`https://phy-lab-3-production.up.railway.app/reservations/${id}`, {
                method: 'DELETE'
            });
            alert("✅ تم حذف الحجز!");
            fetchReservations();
        } catch (error) {
            console.error('❌ فشل الحذف:', error);
        }
    }

    async function editReservation(id) {
        try {
            const response = await fetch(`https://phy-lab-3-production.up.railway.app/reservations/user/${userId}`);
            const result = await response.json();
            const reservations = Array.isArray(result.reservations) ? result.reservations : [];

            const reservation = reservations.find(res => res.id === parseInt(id));

            if (reservation) {
                editingReservationId = id;
                deviceInput.value = reservation.device_id || '';
                eventDateInput.value = reservation.date || '';
                startTimeInput.value = reservation.start_time || reservation.startTime || '';
                endTimeInput.value = reservation.end_time || reservation.endTime || '';
                purposeInput.value = reservation.purpose || '';
                modal.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ فشل تحميل بيانات الحجز للتعديل:', error);
        }
    }
    async function loadDevices() {
        try {
            const response = await fetch("https://phy-lab-3-production.up.railway.app/devices");
            const result = await response.json();
            const devices = result.devices || result;
    
            deviceInput.innerHTML = '<option disabled selected>اختر الجهاز...</option>';
    
            if (Array.isArray(devices)) {
                devices.forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.id;
                    option.textContent = `${device.name} (ID: ${device.id})`;
                    deviceInput.appendChild(option);
                });
            } else {
                console.warn("⚠️ الرد مش Array:", result);
            }
        } catch (error) {
            console.error("❌ فشل تحميل الأجهزة:", error);
        }
    }    

    function clearModalInputs() {
        deviceInput.value = '';
        userNameInput.value = '';
        labNameInput.value = '';
        eventDateInput.value = '';
        startTimeInput.value = '';
        endTimeInput.value = '';
        purposeInput.value = '';
    }
    loadDevices();
    renderCalendar();
    fetchReservations();

});