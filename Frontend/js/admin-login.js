const API_URL = (() => {
    if (!window.location.protocol.startsWith("http")) {
        return "http://localhost:3000";
    }

    if (window.location.port === "3000") {
        return window.location.origin;
    }

    const host = window.location.hostname || "localhost";
    return `${window.location.protocol}//${host}:3000`;
})();
const ADMIN_TOKEN_KEY = 'restaurant_admin_token';
const ADMIN_USER_KEY = 'restaurant_admin_user';
const adminForm = document.getElementById('login-form');
const usernameInput = document.getElementById('admin-username');
const passwordInput = document.getElementById('admin-password');
const loginButton = document.getElementById('login-button');
const errorMessage = document.getElementById('error-message');

async function verifyExistingLogin() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

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
            window.location.href = 'admin.html';
            return;
        }
    } catch (error) {
        console.error('Verify Login Error:', error);
    }

    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
}

adminForm.addEventListener('submit', async event => {
    event.preventDefault();
    errorMessage.textContent = '';
    loginButton.disabled = true;
    loginButton.textContent = 'กำลังตรวจสอบ...';

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value.trim(),
                password: passwordInput.value
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'ไม่สามารถเข้าสู่ระบบได้');
        }

        localStorage.setItem(ADMIN_TOKEN_KEY, result.token);
        localStorage.setItem(ADMIN_USER_KEY, result.admin.username);
        window.location.href = 'admin.html';
    } catch (error) {
        errorMessage.textContent = error.message || 'เข้าสู่ระบบไม่สำเร็จ';
        passwordInput.focus();
        passwordInput.select();
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'เข้าสู่หน้าแอดมิน';
    }
});

verifyExistingLogin();
