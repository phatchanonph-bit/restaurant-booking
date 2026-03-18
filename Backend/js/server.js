const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const http = require("http");

const app = express();
const server = http.createServer(app);
const BOOKING_DURATION = "03:00:00";

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "restaurant",
    port: 3307,
    dateStrings: true
});

const clients = new Set();

function sendEvent(client, eventName, payload) {
    client.write(`event: ${eventName}\n`);
    client.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastBookingChange(action, payload = {}) {
    const eventPayload = {
        action,
        timestamp: new Date().toISOString(),
        ...payload
    };

    for (const client of clients) {
        sendEvent(client, "booking-change", eventPayload);
    }
}

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

db.connect(err => {
    if (err) {
        console.log("DB Connection Error:", err.message);
    } else {
        console.log("MySQL Connected (Port 3307)");
    }
});

app.get("/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders?.();
    res.write("retry: 3000\n\n");

    clients.add(res);
    sendEvent(res, "connected", { ok: true });

    req.on("close", () => {
        clients.delete(res);
    });
});

app.get("/tables/availability", (req, res) => {
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
});

app.post("/book", (req, res) => {
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

        db.query(
            insertSql,
            [name, phone, people, date, time, table_number],
            (insertErr, result) => {
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
            }
        );
    });
});

app.get("/admin/bookings", getBookings);

app.post("/admin/update-status", (req, res) => {
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
});

app.delete("/admin/delete/:id", (req, res) => {
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
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
