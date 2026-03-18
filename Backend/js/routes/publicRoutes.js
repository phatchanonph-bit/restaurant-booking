// route สำหรับลูกค้าทั่วไป เช่น ดูโต๊ะว่างและสร้างรายการจอง
const express = require("express");
const { createBooking, getAvailability } = require("../controllers/bookingController");

const router = express.Router();

// เช็กว่าเวลาที่เลือกมีโต๊ะไหนถูกจองไปแล้วบ้าง
router.get("/tables/availability", getAvailability);
// บันทึกรายการจองใหม่จากฝั่งลูกค้า
router.post("/book", createBooking);

module.exports = router;
