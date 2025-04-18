document.addEventListener("DOMContentLoaded", function () {
    // التحقق من حالة تسجيل الدخول
    // if (localStorage.getItem("isLoggedIn") !== "true") {
    //     window.location.href = "login.html";
    // }

    // زر تسجيل الخروج
    document.getElementById("logout-btn").addEventListener("click", function () {
        localStorage.removeItem("isLoggedIn");
        window.location.href = "login.html";
    });

    // تصفية الأجهزة
    function filterDevices() {
        const filterValue = document.getElementById("device-filter").value;
        const rows = document.querySelectorAll("#device-table-body tr");

        rows.forEach(row => {
            if (filterValue === "جميع الأجهزة" || row.cells[0].textContent === filterValue) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    }

    // التنقل بين الصفحات (محاكاة فقط)
    let currentPage = 1;

    function goToPage(direction) {
        if (direction === "next") {
            currentPage++;
        } else if (direction === "prev" && currentPage > 1) {
            currentPage--;
        }
        document.getElementById("current-page").textContent = currentPage;
    }

    // تصدير إلى PDF باستخدام jsPDF
    function exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("سجل استخدام الأجهزة", 10, 10);

        const rows = [];
        document.querySelectorAll("#device-table-body tr").forEach(row => {
            const rowData = Array.from(row.children).map(cell => cell.textContent);
            rows.push(rowData);
        });

        doc.autoTable({
            head: [["اسم الجهاز", "رقم الجهاز", "المستخدم", "تاريخ الاستخدام", "وقت البدء", "وقت الانتهاء", "إجمالي الساعات"]],
            body: rows,
            margin: { top: 20 }
        });

        doc.save("device-usage.pdf");
    }

    // تصدير إلى Excel باستخدام SheetJS
    function exportExcel() {
        const wb = XLSX.utils.book_new();
        const ws_data = [["اسم الجهاز", "رقم الجهاز", "المستخدم", "تاريخ الاستخدام", "وقت البدء", "وقت الانتهاء", "إجمالي الساعات"]];

        document.querySelectorAll("#device-table-body tr").forEach(row => {
            const rowData = Array.from(row.children).map(cell => cell.textContent);
            ws_data.push(rowData);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, "استخدام الأجهزة");
        XLSX.writeFile(wb, "device-usage.xlsx");
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
                }
            });
        });
    }

    // التعامل مع النقر على روابط الشريط الجانبي
    // const navLinks = document.querySelectorAll(".nav-link");
    // const contentSections = document.querySelectorAll(".content-section");

    // navLinks.forEach(link => {
    //     link.addEventListener("click", function (e) {
    //         e.preventDefault();

    //         navLinks.forEach(l => l.classList.remove("active"));
    //         this.classList.add("active");

    //         contentSections.forEach(section => {
    //             section.style.display = "none";
    //         });

    //         const page = this.getAttribute("data-page");
    //         const targetSection = document.getElementById(page);
    //         if (targetSection) {
    //             targetSection.style.display = "block";

    //             if (page === "reports") {
    //                 setupReportLinks();
    //                 showReport('usage');

    //                 // ربط أحداث تصدير PDF وExcel
    //                 const exportPDFBtn = document.querySelector('.export-buttons button[onclick="exportPDF()"]');
    //                 const exportExcelBtn = document.querySelector('.export-buttons button[onclick="exportExcel()"]');
    //                 if (exportPDFBtn) exportPDFBtn.addEventListener('click', exportPDF);
    //                 if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportExcel);

    //                 // ربط أحداث تصفية الأجهزة
    //                 const deviceFilter = document.getElementById("device-filter");
    //                 if (deviceFilter) deviceFilter.addEventListener('change', filterDevices);

    //                 // ربط أزرار الصفحات
    //                 setupPagination();
    //             }
    //         }
    //     });
    // });

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

    // التهيئة الأولية إذا تم تحميل التقارير مباشرة
    if (document.getElementById('reports').style.display === 'block') {
        setupReportLinks();
        showReport('usage');
        setupPagination();
    }
});
