const { getAdminSession } = require("../services/adminSessionService");

function extractAdminToken(req) {
    const authorizationHeader = req.headers.authorization || "";

    if (!authorizationHeader.startsWith("Bearer ")) {
        return null;
    }

    return authorizationHeader.slice(7).trim();
}

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
