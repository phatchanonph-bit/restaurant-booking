const API_URL = getApiUrl();

const STORAGE_KEYS = {
    token: "restaurant_admin_token",
    user: "restaurant_admin_user"
};

const TEXT = {
    checking: "กำลังตรวจสอบ...",
    login: "เข้าสู่หน้าแอดมิน",
    loginFailed: "เข้าสู่ระบบไม่สำเร็จ",
    invalidResponse: "ไม่สามารถเข้าสู่ระบบได้"
};

const elements = {
    form: document.getElementById("login-form"),
    usernameInput: document.getElementById("admin-username"),
    passwordInput: document.getElementById("admin-password"),
    loginButton: document.getElementById("login-button"),
    errorMessage: document.getElementById("error-message")
};

function getApiUrl() {
    if (!window.location.protocol.startsWith("http")) {
        return "http://localhost:3000";
    }

    if (window.location.port === "3000") {
        return window.location.origin;
    }

    const host = window.location.hostname || "localhost";
    return `${window.location.protocol}//${host}:3000`;
}

function clearStoredLogin() {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
}

function goToAdminPage() {
    window.location.href = "admin.html";
}

function setError(message = "") {
    elements.errorMessage.textContent = message;
}

function setLoginButtonState(isLoading) {
    elements.loginButton.disabled = isLoading;
    elements.loginButton.textContent = isLoading ? TEXT.checking : TEXT.login;
}

async function verifyExistingLogin() {
    const token = localStorage.getItem(STORAGE_KEYS.token);

    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/verify`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) {
            goToAdminPage();
            return;
        }
    } catch (error) {
        console.error("Verify Login Error:", error);
    }

    clearStoredLogin();
}

async function submitLogin(event) {
    event.preventDefault();
    setError();
    setLoginButtonState(true);

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: elements.usernameInput.value.trim(),
                password: elements.passwordInput.value
            })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || TEXT.invalidResponse);
        }

        localStorage.setItem(STORAGE_KEYS.token, result.token);
        localStorage.setItem(STORAGE_KEYS.user, result.admin.username);
        goToAdminPage();
    } catch (error) {
        setError(error.message || TEXT.loginFailed);
        elements.passwordInput.focus();
        elements.passwordInput.select();
    } finally {
        setLoginButtonState(false);
    }
}

elements.form.addEventListener("submit", submitLogin);
verifyExistingLogin();
