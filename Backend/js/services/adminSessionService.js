const crypto = require("crypto");

const adminSessions = new Map();

function createAdminSession(admin) {
    const token = crypto.randomBytes(24).toString("hex");

    adminSessions.set(token, {
        id: admin.id,
        username: admin.username,
        loginAt: Date.now()
    });

    return { token, expiresAt: null };
}

function getAdminSession(token) {
    return adminSessions.get(token) || null;
}

function deleteAdminSession(token) {
    adminSessions.delete(token);
}

module.exports = {
    createAdminSession,
    deleteAdminSession,
    getAdminSession
};
