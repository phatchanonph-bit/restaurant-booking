# Backend

ถ้าต้องการเริ่มโปรเจกต์ทั้งชุดแบบง่ายที่สุด ให้รันจากโฟลเดอร์หลักของโปรเจกต์:

```powershell
docker compose up --build
```

ถ้าจะใช้งานเฉพาะ backend folder นี้:

```powershell
docker compose up --build
```

จากนั้นเข้าใช้งานได้ที่:

- App: `http://localhost:3000`
- phpMyAdmin: `http://localhost:8080`

สำหรับการรัน backend บนเครื่องโดยตรง:

```powershell
npm install
npm run dev
```

หมายเหตุ:

- การใช้งานปกติผ่าน Docker ไม่ต้องเปิดพอร์ต MySQL ออกมาข้างนอกแล้ว
- ถ้าจะให้ backend local ต่อ DB จาก host โดยตรง ค่อยเพิ่ม `3307:3306` ใต้ service `db` ชั่วคราว
