const db = require("../config/db");
const { broadcastBookingChange } = require("../services/realtime");
const {
    createAdminSession,
    deleteAdminSession
} = require("../services/adminSessionService");

function login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
    }

    const sql = "SELECT id, username, password FROM admins WHERE username = ? LIMIT 1";

    db.query(sql, [username], (err, rows) => {
        if (err) {
            console.error("Admin Login Error:", err);
            return res.status(500).json({ error: "ไม่สามารถตรวจสอบข้อมูลแอดมินได้" });
        }

        if (rows.length === 0) {
            return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
        }

        const admin = rows[0];

        if (admin.password !== password) {
            return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
        }

        const session = createAdminSession(admin);

        res.json({
            message: "เข้าสู่ระบบสำเร็จ",
            token: session.token,
            expiresAt: session.expiresAt,
            admin: {
                id: admin.id,
                username: admin.username
            }
        });
    });
}

function verify(req, res) {
    res.json({
        ok: true,
        admin: req.admin
    });
}

function logout(req, res) {
    deleteAdminSession(req.adminToken);
    res.json({ message: "ออกจากระบบสำเร็จ" });
}

function updateStatus(req, res) {
    const { id, status, table_number } = req.body;

    if (!id || !status) {
        return res.status(400).json({ error: "กรุณาระบุ id และ status" });
    }

    const getCurrentSql = "SELECT * FROM bookings WHERE id = ? LIMIT 1";

    db.query(getCurrentSql, [id], (fetchErr, rows) => {
        if (fetchErr) {
            console.error("Fetch Before Update Error:", fetchErr);
            return res.status(500).json({ error: "ไม่สามารถอ่านข้อมูลเดิมได้" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: "ไม่พบรายการจองนี้" });
        }

        const currentBooking = rows[0];
        const nextTableNumber = table_number ?? currentBooking.table_number;
        const updateSql = "UPDATE bookings SET status = ?, table_number = ? WHERE id = ?";

        db.query(updateSql, [status, nextTableNumber, id], updateErr => {
            if (updateErr) {
                console.error("Update Error:", updateErr);
                return res.status(500).json({ error: "ไม่สามารถอัปเดตข้อมูลได้" });
            }

            broadcastBookingChange("updated", {
                booking: {
                    ...currentBooking,
                    status,
                    table_number: nextTableNumber
                }
            });

            res.json({ message: "อัปเดตข้อมูลสำเร็จ" });
        });
    });
}

function deleteBooking(req, res) {
    const bookingId = req.params.id;
    const getCurrentSql = "SELECT * FROM bookings WHERE id = ? LIMIT 1";

    db.query(getCurrentSql, [bookingId], (fetchErr, rows) => {
        if (fetchErr) {
            console.error("Fetch Before Delete Error:", fetchErr);
            return res.status(500).json({ error: "ไม่สามารถอ่านข้อมูลเดิมได้" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: "ไม่พบรายการจองนี้" });
        }

        const booking = rows[0];
        const deleteSql = "DELETE FROM bookings WHERE id = ?";

        db.query(deleteSql, [bookingId], deleteErr => {
            if (deleteErr) {
                console.error("Delete Error:", deleteErr);
                return res.status(500).json({ error: "ไม่สามารถลบข้อมูลได้" });
            }

            broadcastBookingChange("deleted", { booking });
            res.json({ message: "ลบข้อมูลเรียบร้อยแล้ว" });
        });
    });
}

module.exports = {
    deleteBooking,
    login,
    logout,
    updateStatus,
    verify
};
