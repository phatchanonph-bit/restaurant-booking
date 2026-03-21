const { getBookings } = require("../controllers/bookingController");
const { deleteBooking, login, logout, updateStatus, verify } = require("../controllers/adminController");

module.exports = [
    {
        method: "POST",
        path: "/admin/login",
        handler: login
    },
    {
        method: "GET",
        path: "/admin/verify",
        handler: verify
    },
    {
        method: "POST",
        path: "/admin/logout",
        handler: logout
    },
    {
        method: "GET",
        path: "/admin/bookings",
        handler: getBookings
    },
    {
        method: "POST",
        path: "/admin/update-status",
        handler: updateStatus
    },
    {
        method: "DELETE",
        path: "/admin/delete/:id",
        handler: deleteBooking
    }
];
