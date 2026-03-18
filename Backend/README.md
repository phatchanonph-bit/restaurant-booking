# Backend Structure

- `js/server.js`: จุดเริ่มต้นของเซิร์ฟเวอร์
- `js/app.js`: ประกอบ Express app และ routes
- `js/config/db.js`: การเชื่อมต่อฐานข้อมูล MySQL
- `js/routes/`: รวม route ของระบบ
- `js/controllers/`: รวม logic ของแต่ละกลุ่ม endpoint
- `js/middleware/`: middleware เช่น auth
- `js/services/`: logic กลางที่ใช้ร่วมกัน เช่น session และ realtime

เส้นทางหลัก:
- `publicRoutes.js`: endpoint สำหรับลูกค้า เช่น จองโต๊ะและดูสถานะโต๊ะ
- `adminRoutes.js`: endpoint สำหรับแอดมิน เช่น login, verify, bookings, update, delete
