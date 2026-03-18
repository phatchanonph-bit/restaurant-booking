// จัดการ session ของแอดมินแบบง่าย ๆ เก็บไว้ใน memory ของ server
const crypto = require("crypto");

const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const adminSessions = new Map();

// สร้าง token ใหม่หลังล็อกอินสำเร็จ
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

// ลบ session ที่หมดอายุออก เพื่อไม่ให้เก็บค้างใน memory
function pruneExpiredAdminSessions() {
    const now = Date.now();

    for (const [token, session] of adminSessions.entries()) {
        if ((session.expiresAt || 0) <= now) {
            adminSessions.delete(token);
        }
    }
}

// ดึงข้อมูล session จาก token ที่แนบมากับ request
function getAdminSession(token) {
    pruneExpiredAdminSessions();
    return adminSessions.get(token) || null;
}

// ใช้ตอน logout เพื่อลบ token นั้นออกจากระบบ
function deleteAdminSession(token) {
    adminSessions.delete(token);
}

module.exports = {
    createAdminSession,
    deleteAdminSession,
    getAdminSession
};
