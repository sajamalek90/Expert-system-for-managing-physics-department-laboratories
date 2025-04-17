document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();
    const remember = document.getElementById("remember").checked;

    let isValid = true;

    // إعادة تعيين رسائل الخطأ
    document.getElementById("usernameError").textContent = "";
    document.getElementById("passwordError").textContent = "";

    // التحقق من اسم المستخدم
    if (username === "") {
        document.getElementById("usernameError").textContent = "يرجى إدخال اسم المستخدم.";
        isValid = false;
    } else if (username.length < 5) {
        document.getElementById("usernameError").textContent = "اسم المستخدم يجب أن يكون 5 أحرف على الأقل.";
        isValid = false;
    } else if (!/^[a-zA-Z0-9_ء-ي]+$/.test(username)) {
        document.getElementById("usernameError").textContent = "اسم المستخدم يجب أن يحتوي فقط على أحرف وأرقام بدون رموز خاصة.";
        isValid = false;
    }

    // التحقق من كلمة المرور
    if (password === "") {
        document.getElementById("passwordError").textContent = "يرجى إدخال كلمة المرور.";
        isValid = false;
    } else if (password.length < 6) {
        document.getElementById("passwordError").textContent = "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
        isValid = false;
    } else if (!/[A-Z]/.test(password)) {
        document.getElementById("passwordError").textContent = "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل.";
        isValid = false;
    } else if (!/[0-9]/.test(password)) {
        document.getElementById("passwordError").textContent = "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل.";
        isValid = false;
    } else if (/\s/.test(password)) {
        document.getElementById("passwordError").textContent = "كلمة المرور لا يجب أن تحتوي على مسافات.";
        isValid = false;
    }

    if (isValid) {
        // تخزين حالة تسجيل الدخول
        localStorage.setItem("isLoggedIn", "true");
        // إعادة التوجيه إلى لوحة التحكم
        window.location.href = "dashboard.html";
    }
});