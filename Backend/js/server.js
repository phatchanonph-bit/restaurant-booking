// ไฟล์นี้มีหน้าที่สร้าง HTTP server และสั่งให้เริ่มฟัง request
const http = require("http");
const app = require("./app");
const db = require("./config/db");

const PORT = Number(process.env.PORT || 3000);
// ใช้ app เป็นตัวจัดการ request ทุกครั้งที่มีคนเรียกเข้ามา
const server = http.createServer(app);

// ลองเชื่อมต่อฐานข้อมูลตอนเปิดระบบ เพื่อเช็กว่าพร้อมใช้งานหรือไม่
db.connect(err => {
    if (err) {
        console.log("DB Connection Error:", err.message);
        return;
    }

    console.log(`MySQL Connected (${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3307})`);
});

// เปิดพอร์ตให้ระบบพร้อมรับ request จาก frontend
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
