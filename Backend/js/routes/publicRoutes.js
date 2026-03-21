const { createBooking, getAvailability } = require("../controllers/bookingController");

module.exports = [
    {
        method: "GET",
        path: "/tables/availability",
        handler: getAvailability
    },
    {
        method: "POST",
        path: "/book",
        handler: createBooking
    }
];
