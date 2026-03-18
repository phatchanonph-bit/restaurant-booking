const crypto = require("crypto");

const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const adminSessions = new Map();

function createAdminSession(admin) {
    pruneExpiredAdminSessions();

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;

    adminSessions.set(token, {
        id: admin.id,
        username: admin.username,
        loginAt: Date.now(),
        expiresAt
    });

    return {
        token,
        expiresAt
    };
}

function pruneExpiredAdminSessions() {
    const now = Date.now();

    for (const [token, session] of adminSessions.entries()) {
        if ((session.expiresAt || 0) <= now) {
            adminSessions.delete(token);
        }
    }
}

function getAdminSession(token) {
    pruneExpiredAdminSessions();
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
