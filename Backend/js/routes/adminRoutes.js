const express = require("express");
const { getBookings } = require("../controllers/bookingController");
const { deleteBooking, login, logout, updateStatus, verify } = require("../controllers/adminController");
const { requireAdminAuth } = require("../middleware/adminAuth");

const router = express.Router();

router.post("/login", login);
router.get("/verify", requireAdminAuth, verify);
router.post("/logout", requireAdminAuth, logout);
router.get("/bookings", requireAdminAuth, getBookings);
router.post("/update-status", requireAdminAuth, updateStatus);
router.delete("/delete/:id", requireAdminAuth, deleteBooking);

module.exports = router;
