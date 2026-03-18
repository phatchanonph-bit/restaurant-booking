// รวมการตั้งค่า Express และประกอบ route หลักของระบบไว้ที่ไฟล์นี้
const express = require("express");
const cors = require("cors");
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { handleEvents } = require("./services/realtime");

const app = express();

// อนุญาตให้ frontend จากอีก port เรียก API ได้
app.use(cors());
// แปลง request body แบบ JSON ให้ใช้งานผ่าน req.body ได้ทันที
app.use(express.json());

// ช่อง realtime สำหรับส่ง event ไปหน้า admin/client แบบ Server-Sent Events
app.get("/events", handleEvents);
// route ฝั่งผู้ใช้งานทั่วไป
app.use(publicRoutes);
// route ฝั่งแอดมินทั้งหมดจะขึ้นต้นด้วย /admin
app.use("/admin", adminRoutes);

module.exports = app;
