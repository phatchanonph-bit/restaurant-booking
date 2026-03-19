// สร้าง HTTP server และเชื่อมต่อฐานข้อมูลก่อนเริ่มรับ request
const http = require("http");
const app = require("./app");
const db = require("./config/db");

const PORT = Number(process.env.PORT || 3000);
const server = http.createServer(app);

// เช็กการเชื่อมต่อ MySQL ตอนเปิดระบบ
db.connect(err => {
    if (err) {
        console.log("DB Connection Error:", err.message);
        return;
    }

    console.log(`MySQL Connected (${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3307})`);
});

// เปิด server เพื่อให้ frontend เรียกใช้งาน API ได้
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
