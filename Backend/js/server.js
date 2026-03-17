const express = require("express")
const cors = require("cors")
const mysql = require("mysql2")

const app = express()

app.use(cors())
app.use(express.json())

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "restaurant",
    port: 3307  // <--- เพิ่มบรรทัดนี้ เพื่อให้ชี้ไปที่ Port ใหม่ของ Docker
});

db.connect(err => {
  if (err) {
    console.log("DB Error", err)
  } else {
    console.log("MySQL Connected")
  }
})

app.post("/book", (req, res) => {
    // 1. รับค่า table_number เพิ่มมาจากหน้าเว็บ
    const { name, phone, people, date, time, table_number } = req.body;

    // 2. เพิ่มคอลัมน์ table_number และเพิ่ม ? ตัวที่ 6
    const sql = `
        INSERT INTO bookings 
        (name, phone, people, date, time, table_number) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    // 3. ใส่ตัวแปร table_number ลงใน Array ให้ตรงกับตำแหน่ง ?
    db.query(sql, [name, phone, people, date, time, table_number], (err, result) => {
        if (err) {
            console.log("Database Error:", err);
            return res.status(500).json({ error: "Error saving data" });
        }
        res.json({ message: "Booking successful!", id: result.insertId });
    });
});

// API สำหรับดึงข้อมูลการจองทั้งหมด ไปแสดงที่หน้า Admin
app.get("/bookings", (req, res) => {
    const sql = "SELECT * FROM bookings";
    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results); // ส่งข้อมูลกลับไปให้หน้าเว็บเป็น JSON
    });
});

app.listen(3000, () => {
  console.log("Server running on port 3000")
})

// 1. ดึงข้อมูลการจองทั้งหมด (เรียงจากใหม่ไปเก่า)
app.get("/admin/bookings", (req, res) => {
    const sql = "SELECT * FROM bookings ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// อัปเดตสถานะและหมายเลขโต๊ะ
app.post("/admin/update-status", (req, res) => {
    const { id, status, table_number } = req.body;
    // อัปเดตทั้งสถานะและเลขโต๊ะในคำสั่งเดียว
    const sql = "UPDATE bookings SET status = ?, table_number = ? WHERE id = ?";
    
    db.query(sql, [status, table_number, id], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json(err);
        }
        res.json({ message: "อัปเดตข้อมูลสำเร็จ" });
    });
});

// 3. ลบข้อมูลการจอง
app.delete("/admin/delete/:id", (req, res) => {
    const sql = "DELETE FROM bookings WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Deleted!" });
    });
});
