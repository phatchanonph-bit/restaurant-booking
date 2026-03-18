# Restaurant Booking

เปิดใช้งานโปรเจกต์แบบง่ายสุดจากโฟลเดอร์นี้ได้เลย

## Run With Docker

ใช้คำสั่งเดียว:

```powershell
docker compose up --build
```

หลังจากนั้นเข้าใช้งานได้ที่:

- Web app: `http://localhost:3000`
- phpMyAdmin: `http://localhost:8080`

ข้อมูลเริ่มต้น:

- phpMyAdmin / MySQL root: `root / 1234`
- Admin หน้าเว็บ: `admin / 123456`

ถ้าต้องการล้างฐานข้อมูลแล้วเริ่มใหม่:

```powershell
docker compose down -v
docker compose up --build
```

## Run Backend Locally

ถ้าต้องการรัน backend บนเครื่องโดยไม่ใช้ container:

1. เปิด MySQL ก่อน
   ใช้ `docker compose up -d db phpmyadmin`
2. ถ้าจะรัน backend บน host โดยตรง ให้เปิดพอร์ต DB ชั่วคราวใน [Backend/docker-compose.yml](c:/Users/User/restaurant-booking/Backend/docker-compose.yml)
   เพิ่ม `ports:` และ `- "3307:3306"` ใต้ service `db`
3. ติดตั้งแพ็กเกจและรัน backend

```powershell
cd Backend
npm install
npm run dev
```

ค่า default ของ backend local:

- DB host: `localhost`
- DB port: `3307`
- DB user: `root`
- DB password: `1234`
- DB name: `restaurant`

หมายเหตุ:

- `npm run dev` ใช้ `node js/server.js` เพื่อให้รันได้เสถียรบนหลายเครื่อง
- ถ้าต้องการโหมด watch ค่อยใช้ `npm run dev:watch` หรือ `npm run dev:nodemon`
- สำหรับการใช้งานปกติผ่าน Docker ตอนนี้ต้องจำแค่ `3000` กับ `8080`
