// controller ฝั่ง booking: ดูโต๊ะว่าง, สร้าง booking, และดึงรายการจองให้แอดมิน
const db = require("../config/db");
const { broadcastBookingChange } = require("../services/realtime");

// หนึ่งรอบจองใช้เวลา 3 ชั่วโมง
const BOOKING_DURATION = "03:00:00";

// ลบรายการที่หมดเวลาแล้วออกจากระบบ ก่อนส่งข้อมูลใหม่ให้หน้า admin
function cleanupExpiredBookings(callback = () => {}) {
    const findExpiredSql = `
        SELECT *
        FROM bookings
        WHERE TIMESTAMP(date, time) <= DATE_SUB(NOW(), INTERVAL 3 HOUR)
    `;

    db.query(findExpiredSql, (findErr, expiredBookings) => {
        if (findErr) {
            return callback(findErr);
        }

        if (!expiredBookings.length) {
            return callback(null, []);
        }

        const deleteSql = `
            DELETE FROM bookings
            WHERE TIMESTAMP(date, time) <= DATE_SUB(NOW(), INTERVAL 3 HOUR)
        `;

        db.query(deleteSql, deleteErr => {
            if (deleteErr) {
                return callback(deleteErr);
            }

            expiredBookings.forEach(booking => {
                broadcastBookingChange("expired", { booking });
            });

            callback(null, expiredBookings);
        });
    });
}

// ส่งรายการจองทั้งหมดให้หน้าแอดมิน โดยเคลียร์รายการหมดเวลาก่อน
function getBookings(_, res) {
    cleanupExpiredBookings(cleanupErr => {
        if (cleanupErr) {
            console.error("Cleanup Error:", cleanupErr);
            return res.status(500).json({ error: "ไม่สามารถล้างรายการที่หมดเวลาได้" });
        }

        const sql = "SELECT * FROM bookings ORDER BY id DESC";
        db.query(sql, (err, results) => {
            if (err) {
                return res.status(500).json({ error: "ไม่สามารถดึงข้อมูลการจองได้" });
            }

            res.json(results);
        });
    });
}

// เช็กว่าในวันและเวลาที่เลือก มีโต๊ะไหนติดจองช่วงเวลาเดียวกันอยู่แล้วบ้าง
function getAvailability(req, res) {
    const { date, time } = req.query;

    if (!date || !time) {
        return res.status(400).json({ error: "กรุณาระบุวันและเวลา" });
    }

    const sql = `
        SELECT table_number
        FROM bookings
        WHERE date = ?
          AND table_number IS NOT NULL
          AND status <> 'ปฏิเสธแล้ว'
          AND time < ADDTIME(?, ?)
          AND ADDTIME(time, ?) > ?
    `;

    db.query(sql, [date, time, BOOKING_DURATION, BOOKING_DURATION, time], (err, results) => {
        if (err) {
            console.error("Availability Error:", err);
            return res.status(500).json({ error: "ไม่สามารถตรวจสอบสถานะโต๊ะได้" });
        }

        const reservedTables = results
            .map(row => row.table_number)
            .filter(Boolean);

        res.json({ reservedTables });
    });
}

// สร้างรายการจองใหม่หลังจากตรวจข้อมูลและตรวจเวลาซ้ำของโต๊ะแล้ว
function createBooking(req, res) {
    const { name, phone, people, date, time, table_number } = req.body;

    if (!name || !phone || !people || !date || !time || !table_number) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลและเลือกโต๊ะให้ครบ" });
    }

    const checkSql = `
        SELECT id
        FROM bookings
        WHERE date = ?
          AND table_number = ?
          AND status <> 'ปฏิเสธแล้ว'
          AND time < ADDTIME(?, ?)
          AND ADDTIME(time, ?) > ?
        LIMIT 1
    `;

    db.query(
        checkSql,
        [date, table_number, time, BOOKING_DURATION, BOOKING_DURATION, time],
        (checkErr, existingRows) => {
            if (checkErr) {
                console.error("Check Booking Error:", checkErr);
                return res.status(500).json({ error: "ไม่สามารถตรวจสอบข้อมูลการจองได้" });
            }

            if (existingRows.length > 0) {
                return res.status(409).json({ error: "โต๊ะนี้ถูกจองในช่วงเวลา 3 ชั่วโมงนี้แล้ว กรุณาเลือกโต๊ะหรือเวลาอื่น" });
            }

            const insertSql = `
                INSERT INTO bookings
                (name, phone, people, date, time, table_number, status)
                VALUES (?, ?, ?, ?, ?, ?, 'รอยืนยัน')
            `;

            db.query(insertSql, [name, phone, people, date, time, table_number], (insertErr, result) => {
                if (insertErr) {
                    console.error("Insert Error:", insertErr);
                    return res.status(500).json({ error: "ไม่สามารถบันทึกข้อมูลได้" });
                }

                const booking = {
                    id: result.insertId,
                    name,
                    phone,
                    people,
                    date,
                    time,
                    table_number,
                    status: "รอยืนยัน"
                };

                broadcastBookingChange("created", { booking });
                res.json({ message: "Booking successful!", id: result.insertId, booking });
            });
        }
    );
}

module.exports = {
    createBooking,
    getAvailability,
    getBookings
};
