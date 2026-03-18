const express = require("express");
const { createBooking, getAvailability } = require("../controllers/bookingController");

const router = express.Router();

router.get("/tables/availability", getAvailability);
router.post("/book", createBooking);

module.exports = router;
