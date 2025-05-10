document.addEventListener("DOMContentLoaded", function () {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
        console.log("المستخدم غير مسجل الدخول، يتم إعادة التوجيه إلى login.html");
        window.location.href = "login.html";
        return; // إيقاف تنفيذ باقي الكود
    }

    // Helper function to get query parameters from input fields or other sources
    function getQueryParams() {
        const device = document.getElementById("device-filter")?.value || "";
        const startDate = document.getElementById("start-date")?.value || "";
        const endDate = document.getElementById("end-date")?.value || "";
        const params = new URLSearchParams();
        if (device && device !== "جميع الأجهزة") params.append("device", device);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        return params.toString();
    }

    // Helper function to get the Bearer token from localStorage
    function getAuthToken() {
        return localStorage.getItem("token") || "";
    }

    // تصدير إلى PDF
    async function exportPDF() {
        try {
            const queryParams = getQueryParams();
            const token = getAuthToken();
            if (!token) throw new Error("No authorization token found");

            const response = await fetch(`http://labmangmentsystemapi.runasp.net/api/export/pdf?${queryParams}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "device-usage.pdf";
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("حدث خطأ أثناء تصدير PDF: " + error.message);
        }
    }

    // تصدير إلى Excel
    async function exportExcel() {
        try {
            const queryParams = getQueryParams();
            const token = getAuthToken();
            if (!token) throw new Error("No authorization token found");

            const response = await fetch(`http://labmangmentsystemapi.runasp.net/api/export/excel?${queryParams}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error(`Failed to fetch Excel: ${response.status}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "device-usage.xlsx";
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Excel Export Error:", error);
            alert("حدث خطأ أثناء تصدير Excel: " + error.message);
        }
    }

    // تسجيل الخروج باستخدام API
    async function logout() {
        try {
            const token = getAuthToken();
            if (!token) throw new Error("No authorization token found");

            const response = await fetch('http://labmangmentsystemapi.runasp.net/api/Auth/Logout', {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Logout request narrated with status ${response.status}`);
            }

            const data = await response.json();
            if (data.status === "success") {
                // إزالة البيانات من localStorage
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("remember");
                console.log("تم تسجيل الخروج بنجاح، يتم إعادة التوجيه إلى login.html");
                // إعادة التوجيه مباشرة إلى صفحة تسجيل الدخول
                window.location.href = "login.html";
            } else {
                throw new Error(data.message || "فشل تسجيل الخروج");
            }
        } catch (error) {
            console.error('Logout Error:', error);
            // في حالة حدوث خطأ، قم بإزالة البيانات محليًا وإعادة التوجيه مباشرة
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("remember");
            console.log("خطأ أثناء تسجيل الخروج، يتم إعادة التوجيه إلى login.html");
            window.location.href = "login.html";
        }
    }

    // التهيئة الأولية
    const pdfButton = document.querySelector('button[onclick="exportPDF()"]');
    const excelButton = document.querySelector('button[onclick="exportExcel()"]');
    const logoutButton = document.getElementById("logout-btn");

    if (pdfButton) pdfButton.addEventListener('click', exportPDF);
    if (excelButton) excelButton.addEventListener('click', exportExcel);
    if (logoutButton) logoutButton.addEventListener('click', logout);

    // JavaScript to handle report type toggling
    document.querySelectorAll('.report-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            // Remove active class from all links
            document.querySelectorAll('.report-link').forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
            // Hide Power BI section
            document.getElementById('power-bi-section').style.display = 'none';
            // Show report content section
            document.getElementById('report-content-section').style.display = 'block';
            // Hide all report contents
            document.querySelectorAll('.report-content').forEach(content => content.style.display = 'none');
            // Show the selected report content
            const reportType = this.getAttribute('data-report-type');
            document.getElementById(`${reportType}-report`).style.display = 'block';
        });
    });
});