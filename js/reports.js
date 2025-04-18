document.addEventListener("DOMContentLoaded", function () {
    // Mock dataset for device usage records
    const deviceData = [
        { device: "ميكروسكوب بصري", deviceId: "001", user: "محمد أحمد", date: "2025-04-10", startTime: "09:00", endTime: "11:30", hours: "2.5" },
        { device: "محلل طيفي", deviceId: "015", user: "سارة محمد", date: "2025-04-09", startTime: "13:00", endTime: "16:00", hours: "3.0" },
        { device: "مولد إشعاع", deviceId: "008", user: "أحمد علي", date: "2025-04-08", startTime: "10:00", endTime: "12:00", hours: "2.0" },
        { device: "ميكروسكوب بصري", deviceId: "002", user: "خالد حسن", date: "2025-04-07", startTime: "14:00", endTime: "16:30", hours: "2.5" },
        { device: "محلل طيفي", deviceId: "016", user: "فاطمة علي", date: "2025-04-06", startTime: "09:30", endTime: "12:30", hours: "3.0" },
        { device: "مولد إشعاع", deviceId: "009", user: "يوسف محمد", date: "2025-04-05", startTime: "11:00", endTime: "13:00", hours: "2.0" },
        { device: "ميكروسكوب بصري", deviceId: "003", user: "ليلى سعيد", date: "2025-04-04", startTime: "08:00", endTime: "10:00", hours: "2.0" },
        { device: "محلل طيفي", deviceId: "017", user: "عمر خالد", date: "2025-04-03", startTime: "15:00", endTime: "18:00", hours: "3.0" },
        { device: "مولد إشعاع", deviceId: "010", user: "نورا أحمد", date: "2025-04-02", startTime: "12:00", endTime: "14:30", hours: "2.5" }
    ];

    const rowsPerPage = 3; // Number of rows per page
    let currentPage = 1; // Current page
    const totalPages = Math.ceil(deviceData.length / rowsPerPage); // Total number of pages

    // Function to render table rows for the current page
    function renderTable(data = deviceData) {
        const tableBody = document.getElementById("device-table-body");
        tableBody.innerHTML = ""; // Clear existing rows

        // Calculate start and end indices for the current page
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const pageData = data.slice(start, end);

        // Populate table with rows
        pageData.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.device}</td>
                <td>${row.deviceId}</td>
                <td>${row.user}</td>
                <td>${row.date}</td>
                <td>${row.startTime}</td>
                <td>${row.endTime}</td>
                <td>${row.hours}</td>
            `;
            tableBody.appendChild(tr);
        });

        // Update current page display
        document.getElementById("current-page").textContent = currentPage;

        // Update pagination button states
        updatePaginationButtons();
    }

    // Function to update pagination button states
    function updatePaginationButtons() {
        const prevButton = document.querySelector('.pagination button[onclick="goToPage(\'prev\')"]');
        const nextButton = document.querySelector('.pagination button[onclick="goToPage(\'next\')"]');

        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
    }

    // Pagination navigation
    function goToPage(direction) {
        if (direction === "next" && currentPage < totalPages) {
            currentPage++;
        } else if (direction === "prev" && currentPage > 1) {
            currentPage--;
        }
        renderTable(); // Re-render table with current page data
    }

    // تصفية الأجهزة
    function filterDevices() {
        const filterValue = document.getElementById("device-filter").value;
        let filteredData = deviceData;

        if (filterValue !== "جميع الأجهزة") {
            filteredData = deviceData.filter(row => row.device === filterValue);
        }

        // Reset to page 1 when filtering
        currentPage = 1;
        renderTable(filteredData);
    }

    // تصدير إلى PDF باستخدام jsPDF
    function exportPDF() {
        try {
            if (!window.jspdf) throw new Error('jsPDF library not loaded');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Add Amiri font (replace with actual base64 or CDN)
            const amiriFont = 'data:font/ttf;base64,AAEAAAARA...'; // Shortened; use actual Amiri font base64
            doc.addFileToVFS('Amiri-Regular.ttf', amiriFont);
            doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');

            // Alternatively, use CDN (uncomment if base64 not available)
            // doc.addFont('https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUp.ttf', 'Amiri', 'normal');

            // Set font and direction
            doc.setFont('Amiri');
            doc.setLanguage('ar');
            doc.setFontSize(12);

            // Add title with RTL
            doc.text('سجل استخدام الأجهزة', 280, 10, { align: 'right' });

            // Prepare table data
            const rows = deviceData.map(row => [
                row.device, row.deviceId, row.user, row.date, row.startTime, row.endTime, row.hours
            ]);

            // Generate table with RTL support
            doc.autoTable({
                head: [['اسم الجهاز', 'رقم الجهاز', 'المستخدم', 'تاريخ الاستخدام', 'وقت البدء', 'وقت الانتهاء', 'إجمالي الساعات']],
                body: rows,
                margin: { top: 20, right: 10, left: 10 },
                styles: { font: 'Amiri', halign: 'right', fontSize: 8 },
                headStyles: { fillColor: [74, 109, 167], textColor: [255, 255, 255] },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 50 },
                    3: { cellWidth: 40 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 30 },
                    6: { cellWidth: 30 }
                },
                didDrawCell: (data) => {
                    if (data.section === 'body') {
                        data.cell.styles.textColor = [0, 0, 0];
                    }
                }
            });

            doc.save('device-usage.pdf');
        } catch (error) {
            console.error('PDF Export Error:', error);
            alert('حدث خطأ أثناء تصدير PDF. تأكد من تحميل مكتبة jsPDF.');
        }
    }

    // تصدير إلى Excel باستخدام SheetJS
    function exportExcel() {
        try {
            if (!window.XLSX) throw new Error('SheetJS library not loaded');
            const wb = XLSX.utils.book_new();
            const ws_data = [['اسم الجهاز', 'رقم الجهاز', 'المستخدم', 'تاريخ الاستخدام', 'وقت البدء', 'وقت الانتهاء', 'إجمالي الساعات']];

            deviceData.forEach(row => {
                ws_data.push([row.device, row.deviceId, row.user, row.date, row.startTime, row.endTime, row.hours]);
            });

            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            ws['!cols'] = [
                { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
            ];
            ws['!rtl'] = true; // Enable RTL for Arabic text

            XLSX.utils.book_append_sheet(wb, ws, 'استخدام الأجهزة');
            XLSX.writeFile(wb, 'device-usage.xlsx');
        } catch (error) {
            console.error('Excel Export Error:', error);
            alert('حدث خطأ أثناء تصدير Excel. تأكد من تحميل مكتبة SheetJS.');
        }
    }

    // إظهار التقرير المحدد
    function showReport(reportType) {
        document.querySelectorAll('.report').forEach(report => {
            report.style.display = 'none';
        });
        const targetReport = document.getElementById(reportType + '-report');
        if (targetReport) {
            targetReport.style.display = 'block';
        }
    }

    // إعداد روابط التقارير
    function setupReportLinks() {
        const reportLinks = document.querySelectorAll('.container nav a');
        reportLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const reportType = this.getAttribute('data-report-type');
                if (reportType) {
                    showReport(reportType);
                    if (reportType === 'usage') {
                        currentPage = 1; // Reset to page 1 when switching to usage report
                        renderTable();
                    }
                }
            });
        });
    }

    // إعداد الصفحات
    function setupPagination() {
        const paginationButtons = document.querySelectorAll('.pagination button');
        paginationButtons.forEach(button => {
            button.addEventListener('click', function () {
                const direction = this.textContent.includes('السابق') ? 'prev' : 'next';
                goToPage(direction);
            });
        });
    }

    // زر تسجيل الخروج
    document.getElementById("logout-btn").addEventListener("click", function () {
        localStorage.removeItem("isLoggedIn");
        window.location.href = "login.html";
    });

    // التهيئة الأولية
    if (document.getElementById('reports').style.display === 'block' || document.getElementById('reports').style.display === '') {
        setupReportLinks();
        showReport('usage');
        setupPagination();
        renderTable(); // Initial table render
        document.getElementById("device-filter").addEventListener('change', filterDevices);

        // Bind export buttons
        const pdfButton = document.querySelector('button[onclick="exportPDF()"]');
        const excelButton = document.querySelector('button[onclick="exportExcel()"]');
        if (pdfButton) pdfButton.addEventListener('click', exportPDF);
        if (excelButton) excelButton.addEventListener('click', exportExcel);
    }
});