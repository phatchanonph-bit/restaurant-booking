// route สำหรับหน้าแอดมิน เช่น ล็อกอิน ดู booking และจัดการสถานะ
const express = require("express");
const { getBookings } = require("../controllers/bookingController");
const { deleteBooking, login, logout, updateStatus, verify } = require("../controllers/adminController");

const router = express.Router();

// ล็อกอินแอดมิน
router.post("/login", login);
// ตรวจสถานะการล็อกอิน
router.get("/verify", verify);
// ออกจากระบบ
router.post("/logout", logout);
// ดึงรายการจองทั้งหมด
router.get("/bookings", getBookings);
// อัปเดตสถานะการจอง
router.post("/update-status", updateStatus);
// ลบรายการจอง
router.delete("/delete/:id", deleteBooking);

module.exports = router;
