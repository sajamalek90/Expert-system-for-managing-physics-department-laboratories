// وظيفة تسجيل الدخول
document.getElementById('login-btn')?.addEventListener('click', function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username && password) {
        window.location.href = 'dashboard.html';
    } else {
        alert('الرجاء إدخال اسم المستخدم وكلمة المرور');
    }
});

// وظيفة تسجيل الخروج
document.getElementById('logout-btn')?.addEventListener('click', function() {
    window.location.href = 'login.html';
});

// تنشيط العنصر النشط في القائمة الجانبية
document.addEventListener('DOMContentLoaded', function() {
    // تحديد الصفحة الحالية
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    // إزالة النشط من جميع الروابط
    document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.remove('active');
    });
    
    // إضافة النشط للرابط الحالي
    const activeLink = document.querySelector(`.nav-link[href="${currentPage}.html"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
});