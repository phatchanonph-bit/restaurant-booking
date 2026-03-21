const path = require("path");
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { handleEvents } = require("./services/realtime");
const {
    addCorsHeaders,
    addResponseHelpers,
    getRequestInfo,
    getSafeFilePath,
    matchRoute,
    parseJsonBody
} = require("./http");

const frontendDir = process.env.FRONTEND_DIR || path.resolve(__dirname, "../../Frontend");
const allRoutes = [...publicRoutes, ...adminRoutes];

// ฟังก์ชันนี้เป็นจุดรับทุก request ของ backend
async function app(req, res) {
    addResponseHelpers(res);
    addCorsHeaders(res);

    if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
    }

    const { pathname, query } = getRequestInfo(req);
    req.query = query;
    req.params = {};

    // ช่องทาง realtime ใช้ Server-Sent Events จึงแยกมาจัดการโดยตรง
    if (req.method === "GET" && pathname === "/events") {
        handleEvents(req, res);
        return;
    }

    const route = matchRoute(allRoutes, req.method, pathname);

    if (route) {
        try {
            req.params = route.params;
            req.body = await parseJsonBody(req);
            route.handler(req, res);
        } catch (error) {
            if (error.message === "INVALID_JSON") {
                res.status(400).json({ error: "รูปแบบ JSON ไม่ถูกต้อง" });
                return;
            }

            console.error("Request Error:", error);
            res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
        }

        return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
        const filePath = getSafeFilePath(frontendDir, pathname);

        if (filePath) {
            res.sendFile(filePath);
            return;
        }
    }

    res.status(404).json({ error: "ไม่พบเส้นทางที่ร้องขอ" });
}

module.exports = app;
