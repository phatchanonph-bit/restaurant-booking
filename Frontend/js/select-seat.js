const API_URL = getApiUrl();
const tables = [...document.querySelectorAll(".table-box")];
const confirmButton = document.getElementById("confirm-button");
const availabilityNote = document.getElementById("availability-note");
const bookingData = {
    name: localStorage.getItem("bookName"),
    phone: localStorage.getItem("bookPhone"),
    people: Number(localStorage.getItem("bookPax")),
    date: localStorage.getItem("bookDate"),
    time: localStorage.getItem("bookTime")
};

let reservedTables = new Set();

if (Object.values(bookingData).some(value => !value)) {
    alert("กรุณากรอกข้อมูลการจองก่อนเลือกโต๊ะ");
    window.location.href = "booking.html";
}

function getApiUrl() {
    if (!window.location.protocol.startsWith("http")) {
        return "http://localhost:3000";
    }

    if (window.location.port === "3000") {
        return window.location.origin;
    }

    return `${window.location.protocol}//${window.location.hostname || "localhost"}:3000`;
}

function addHours(time, hours) {
    const [h, m] = time.split(":").map(Number);
    const total = (((h * 60) + m + (hours * 60)) % 1440 + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function selectedTable() {
    return document.querySelector(".table-box.selected")?.dataset.table || null;
}

function setText(id, value) {
    document.getElementById(id).textContent = value;
}

function updateAvailabilityMessage() {
    availabilityNote.textContent = reservedTables.size
        ? `ตอนนี้มี ${reservedTables.size} โต๊ะที่ติดรอบจอง 3 ชั่วโมงนี้แล้ว ระบบอัปเดตให้อัตโนมัติเมื่อมีการเปลี่ยนแปลง`
        : "ขณะนี้โต๊ะทั้งหมดในรอบเวลา 3 ชั่วโมงนี้ยังว่าง คุณสามารถเลือกโต๊ะที่ต้องการได้ทันที";
}

function renderTableAvailability() {
    const currentSelection = selectedTable();

    tables.forEach(table => {
        const isReserved = reservedTables.has(table.dataset.table);
        table.classList.toggle("unavailable", isReserved);

        if (isReserved) {
            table.classList.remove("selected");
        }
    });

    if (currentSelection && reservedTables.has(currentSelection)) {
        alert("โต๊ะที่คุณเลือกถูกจองไปแล้วแบบเรียลไทม์ กรุณาเลือกโต๊ะอื่น");
    }

    updateAvailabilityMessage();
}

async function loadAvailability() {
    try {
        const params = new URLSearchParams({ date: bookingData.date, time: bookingData.time });
        const response = await fetch(`${API_URL}/tables/availability?${params}`);
        const data = await response.json();

        reservedTables = new Set(data.reservedTables || []);
        renderTableAvailability();
    } catch (error) {
        console.error("Availability Error:", error);
        availabilityNote.textContent = "โหลดสถานะโต๊ะไม่สำเร็จในขณะนี้ กรุณารอสักครู่แล้วระบบจะลองอัปเดตใหม่";
    }
}

async function confirmSeat() {
    const tableNumber = selectedTable();

    if (!tableNumber) {
        alert("กรุณาเลือกโต๊ะก่อนกดยืนยัน");
        return;
    }

    if (reservedTables.has(tableNumber)) {
        alert("โต๊ะนี้เพิ่งถูกจองไปแล้ว กรุณาเลือกใหม่");
        await loadAvailability();
        return;
    }

    confirmButton.disabled = true;
    confirmButton.textContent = "กำลังบันทึก...";

    try {
        const response = await fetch(`${API_URL}/book`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...bookingData, table_number: tableNumber })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "ไม่สามารถบันทึกการจองได้");
        }

        localStorage.setItem("bookTable", tableNumber);
        localStorage.setItem("bookPax", String(bookingData.people));
        window.location.href = "success.html";
    } catch (error) {
        console.error("Booking Error:", error);
        alert(error.message || "เกิดข้อผิดพลาดในการจอง");
        await loadAvailability();
    } finally {
        confirmButton.disabled = false;
        confirmButton.textContent = "ยืนยันที่นั่ง";
    }
}

const bookingEndTime = addHours(bookingData.time, 3);
setText("booking-slot", `รอบจองของคุณ: ${bookingData.date} เวลา ${bookingData.time} - ${bookingEndTime}`);
setText("summary-name", bookingData.name);
setText("summary-phone", bookingData.phone);
setText("summary-people", `${bookingData.people} ท่าน`);
setText("summary-slot", `${bookingData.date} ${bookingData.time} - ${bookingEndTime}`);

tables.forEach(table => table.addEventListener("click", () => {
    if (table.classList.contains("unavailable")) {
        alert("โต๊ะนี้ถูกจองแล้ว กรุณาเลือกโต๊ะอื่น");
        return;
    }

    const wasSelected = table.classList.contains("selected");
    tables.forEach(item => item.classList.remove("selected"));

    if (!wasSelected) {
        table.classList.add("selected");
    }
}));

confirmButton.addEventListener("click", confirmSeat);

const eventSource = new EventSource(`${API_URL}/events`);

eventSource.addEventListener("booking-change", async event => {
    const booking = JSON.parse(event.data).booking;

    if (booking?.date === bookingData.date) {
        await loadAvailability();
    }
});

eventSource.onerror = () => {
    availabilityNote.textContent = "การเชื่อมต่อ realtime หลุด ระบบจะพยายามเชื่อมต่อใหม่อัตโนมัติ";
};

loadAvailability();
