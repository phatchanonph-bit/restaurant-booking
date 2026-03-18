// route สำหรับหน้าแอดมิน เช่น ล็อกอิน ดู booking และจัดการสถานะ
const express = require("express");
const { getBookings } = require("../controllers/bookingController");
const { deleteBooking, login, logout, updateStatus, verify } = require("../controllers/adminController");
const { requireAdminAuth } = require("../middleware/adminAuth");

const router = express.Router();

// ล็อกอินแอดมิน
router.post("/login", login);
// ตรวจว่า token ของแอดมินยังใช้งานได้อยู่หรือไม่
router.get("/verify", requireAdminAuth, verify);
// ออกจากระบบและล้าง session ฝั่ง backend
router.post("/logout", requireAdminAuth, logout);
// ดึงรายการจองทั้งหมดสำหรับหน้าแอดมิน
router.get("/bookings", requireAdminAuth, getBookings);
// อัปเดตสถานะการจอง เช่น ยืนยันหรือปฏิเสธ
router.post("/update-status", requireAdminAuth, updateStatus);
// ลบรายการจองออกจากระบบ
router.delete("/delete/:id", requireAdminAuth, deleteBooking);

module.exports = router;
