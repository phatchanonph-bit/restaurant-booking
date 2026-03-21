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
    // เพิ่ม helper ให้ response ใช้งานง่ายขึ้น เช่น res.status().json()
    addResponseHelpers(res);
    // ใส่ CORS header เพื่อให้ frontend เรียก API ได้
    addCorsHeaders(res);

    // browser บางครั้งจะส่ง OPTIONS มาก่อนเพื่อเช็กสิทธิ์การเรียก API
    if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
    }

    // แยก path และ query string จาก URL
    const { pathname, query } = getRequestInfo(req);
    req.query = query;
    req.params = {};

    // ช่องทาง realtime ใช้ Server-Sent Events จึงแยกมาจัดการโดยตรง
    if (req.method === "GET" && pathname === "/events") {
        handleEvents(req, res);
        return;
    }

    // หา route ที่ตรงกับ method และ path ปัจจุบัน
    const route = matchRoute(allRoutes, req.method, pathname);

    if (route) {
        try {
            // เก็บค่าพารามิเตอร์จาก path เช่น /admin/delete/5
            req.params = route.params;
            // ถ้ามี body แบบ JSON ก็แปลงเป็น object ก่อน
            req.body = await parseJsonBody(req);
            // ส่งต่อให้ controller ที่รับผิดชอบ route นี้
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

    // ถ้าไม่ใช่ API route ให้ลองมองเป็นไฟล์ static ของ frontend
    if (req.method === "GET" || req.method === "HEAD") {
        const filePath = getSafeFilePath(frontendDir, pathname);

        if (filePath) {
            res.sendFile(filePath);
            return;
        }
    }

    // ถ้าไม่เจออะไรเลย ค่อยตอบกลับว่าไม่พบเส้นทาง
    res.status(404).json({ error: "ไม่พบเส้นทางที่ร้องขอ" });
}

module.exports = app;
