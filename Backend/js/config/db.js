// เก็บค่าการเชื่อมต่อ MySQL ไว้รวมกัน เพื่อให้ไฟล์อื่น import ไปใช้ซ้ำได้
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "1234",
    database: process.env.DB_NAME || "restaurant",
    port: Number(process.env.DB_PORT || 3307),
    dateStrings: true
});

module.exports = db;
