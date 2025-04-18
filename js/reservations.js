document.addEventListener('DOMContentLoaded', () => {
    const calendarDays = document.getElementById('calendar-days');
    const monthYear = document.getElementById('month-year');
    const prevMonth = document.getElementById('prev-month');
    const nextMonth = document.getElementById('next-month');

    let currentDate = new Date(2025, 3); // أبريل 2025

    function renderCalendar() {
        calendarDays.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const monthNames = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        monthYear.textContent = `${monthNames[month]} ${year}`;

        // إضافة أيام فارغة قبل بداية الشهر
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            calendarDays.appendChild(emptyDay);
        }

        // إضافة أيام الشهر
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.textContent = day;

            // إضافة مؤشر حدث في 15 أبريل
            if (day === 15) {
                dayElement.classList.add('event-day');
                const eventIndicator = document.createElement('span');
                eventIndicator.classList.add('event-indicator');
                eventIndicator.textContent = '9:00-11:30';
                dayElement.appendChild(eventIndicator);
            }

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

    renderCalendar();
});