// middleware สำหรับป้องกัน route แอดมินไม่ให้เข้าถึงโดยไม่มี token
const { getAdminSession } = require("../services/adminSessionService");

// ดึง Bearer token ออกจาก header Authorization
function extractAdminToken(req) {
    const authorizationHeader = req.headers.authorization || "";

    if (!authorizationHeader.startsWith("Bearer ")) {
        return null;
    }

    return authorizationHeader.slice(7).trim();
}

// ถ้า token ไม่ถูกต้องหรือหมดอายุ จะไม่ให้เข้าถึง route แอดมิน
function requireAdminAuth(req, res, next) {
    const token = extractAdminToken(req);
    const adminSession = token ? getAdminSession(token) : null;

    if (!adminSession) {
        return res.status(401).json({ error: "กรุณาเข้าสู่ระบบแอดมินก่อน" });
    }

    req.admin = adminSession;
    req.adminToken = token;
    next();
}

module.exports = {
    extractAdminToken,
    requireAdminAuth
};
