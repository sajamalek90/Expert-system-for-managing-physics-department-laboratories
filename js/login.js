document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();
    const remember = document.getElementById("remember").checked;

    let isValid = true;

    // إعادة تعيين رسائل الخطأ
    document.getElementById("usernameError").textContent = "";
    document.getElementById("passwordError").textContent = "";

    // التحقق من اسم المستخدم (البريد الإلكتروني)
    if (username === "") {
        document.getElementById("usernameError").textContent = "يرجى إدخال اسم المستخدم.";
        isValid = false;
    } else if (username.length < 7) {
        document.getElementById("usernameError").textContent = "اسم المستخدم يجب أن يكون 7 أحرف على الأقل.";
        isValid = false;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(username)) {
        document.getElementById("usernameError").textContent = "يرجى إدخال بريد إلكتروني صالح (حروف إنجليزية، أرقام، ورموز مثل @، .، _، -).";
        isValid = false;
    }

    // التحقق من كلمة المرور
    if (password === "") {
        document.getElementById("passwordError").textContent = "يرجى إدخال كلمة المرور.";
        isValid = false;
    } else if (password.length < 6) {
        document.getElementById("passwordError").textContent = "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
        isValid = false;
    } else if (!/^[a-zA-Z0-9]+$/.test(password)) {
        document.getElementById("passwordError").textContent = "كلمة المرور يجب أن تحتوي على أحرف وأرقام فقط.";
        isValid = false;
    }

    if (isValid) {
        try {
            // إرسال طلب تسجيل الدخول إلى API
            const response = await fetch("http://labmangmentsystemapi.runasp.net/api/Auth/Login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: username,
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // التأكد من وجود token في الاستجابة
                if (!data.token) {
                    throw new Error("No token received from server");
                }

                // تخزين بيانات المستخدم والتوكن في localStorage
                localStorage.setItem("token", data.token);
                // إذا كان هناك بيانات مستخدم، قم بتخزينها، وإلا تجاهل
                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                }
                localStorage.setItem("isLoggedIn", "true");

                if (remember) {
                    localStorage.setItem("remember", "true");
                }

                window.location.href = "dashboard.html";
            } else {
                // عرض رسالة الخطأ من الـ API
                document.getElementById("usernameError").textContent =
                    data.message || "بيانات تسجيل الدخول غير صحيحة.";
            }
        } catch (error) {
            console.error("Error during login:", error);
            document.getElementById("usernameError").textContent =
                "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة لاحقًا.";
        }
    }
});