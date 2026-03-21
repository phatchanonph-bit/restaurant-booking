const API_URL = getApiUrl();
const STORAGE_KEYS = ["restaurant_admin_token", "restaurant_admin_user"];
const TEXT = {
    checking: "กำลังตรวจสอบ...",
    login: "เข้าสู่หน้าแอดมิน",
    loginFailed: "เข้าสู่ระบบไม่สำเร็จ",
    invalidResponse: "ไม่สามารถเข้าสู่ระบบได้"
};
const elements = {
    form: document.getElementById("login-form"),
    username: document.getElementById("admin-username"),
    password: document.getElementById("admin-password"),
    button: document.getElementById("login-button"),
    error: document.getElementById("error-message")
};

function getApiUrl() {
    if (!window.location.protocol.startsWith("http")) {
        return "http://localhost:3000";
    }

    if (window.location.port === "3000") {
        return window.location.origin;
    }

    return `${window.location.protocol}//${window.location.hostname || "localhost"}:3000`;
}

function setLoading(isLoading) {
    elements.button.disabled = isLoading;
    elements.button.textContent = isLoading ? TEXT.checking : TEXT.login;
}

function clearStoredLogin() {
    STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
}

async function verifyExistingLogin() {
    const token = localStorage.getItem(STORAGE_KEYS[0]);

    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/verify`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            window.location.href = "admin.html";
            return;
        }
    } catch (error) {
        console.error("Verify Login Error:", error);
    }

    clearStoredLogin();
}

elements.form.addEventListener("submit", async event => {
    event.preventDefault();
    elements.error.textContent = "";
    setLoading(true);

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: elements.username.value.trim(),
                password: elements.password.value
            })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || TEXT.invalidResponse);
        }

        localStorage.setItem(STORAGE_KEYS[0], result.token);
        localStorage.setItem(STORAGE_KEYS[1], result.admin.username);
        window.location.href = "admin.html";
    } catch (error) {
        elements.error.textContent = error.message || TEXT.loginFailed;
        elements.password.focus();
        elements.password.select();
    } finally {
        setLoading(false);
    }
});

verifyExistingLogin();
