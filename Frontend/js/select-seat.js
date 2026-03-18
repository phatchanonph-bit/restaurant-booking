const API_URL = "http://localhost:3000";
const tables = document.querySelectorAll('.table-box');
const confirmButton = document.getElementById('confirm-button');
const slotLabel = document.getElementById('booking-slot');
const availabilityNote = document.getElementById('availability-note');
const summaryName = document.getElementById('summary-name');
const summaryPhone = document.getElementById('summary-phone');
const summaryPeople = document.getElementById('summary-people');
const summarySlot = document.getElementById('summary-slot');

const bookingData = {
    name: localStorage.getItem('bookName'),
    phone: localStorage.getItem('bookPhone'),
    people: Number(localStorage.getItem('bookPax')),
    date: localStorage.getItem('bookDate'),
    time: localStorage.getItem('bookTime')
};

let reservedTables = new Set();

if (!bookingData.name || !bookingData.phone || !bookingData.people || !bookingData.date || !bookingData.time) {
    alert('กรุณากรอกข้อมูลการจองก่อนเลือกโต๊ะ');
    window.location.href = 'booking.html';
}

function addHoursToTime(timeValue, hoursToAdd) {
    const [hours, minutes] = timeValue.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes + (hoursToAdd * 60);
    const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const nextHours = String(Math.floor(normalizedMinutes / 60)).padStart(2, '0');
    const nextMinutes = String(normalizedMinutes % 60).padStart(2, '0');
    return `${nextHours}:${nextMinutes}`;
}

const bookingEndTime = addHoursToTime(bookingData.time, 3);
slotLabel.textContent = `รอบจองของคุณ: ${bookingData.date} เวลา ${bookingData.time} - ${bookingEndTime}`;
summaryName.textContent = bookingData.name;
summaryPhone.textContent = bookingData.phone;
summaryPeople.textContent = `${bookingData.people} ท่าน`;
summarySlot.textContent = `${bookingData.date} ${bookingData.time} - ${bookingEndTime}`;

function getSelectedTableName() {
    return document.querySelector('.table-box.selected')?.dataset.table || null;
}

function updateAvailabilityMessage() {
    availabilityNote.textContent = reservedTables.size > 0
        ? `ตอนนี้มี ${reservedTables.size} โต๊ะที่ติดรอบจอง 3 ชั่วโมงนี้แล้ว ระบบอัปเดตให้อัตโนมัติเมื่อมีการเปลี่ยนแปลง`
        : 'ขณะนี้โต๊ะทั้งหมดในรอบเวลา 3 ชั่วโมงนี้ยังว่าง คุณสามารถเลือกโต๊ะที่ต้องการได้ทันที';
}

function renderTableAvailability() {
    const selectedTable = getSelectedTableName();

    tables.forEach(table => {
        const tableName = table.dataset.table;
        const isReserved = reservedTables.has(tableName);

        table.classList.toggle('unavailable', isReserved);

        if (isReserved && table.classList.contains('selected')) {
            table.classList.remove('selected');
        }
    });

    if (selectedTable && reservedTables.has(selectedTable)) {
        alert('โต๊ะที่คุณเลือกถูกจองไปแล้วแบบเรียลไทม์ กรุณาเลือกโต๊ะอื่น');
    }

    updateAvailabilityMessage();
}

async function loadAvailability() {
    try {
        const params = new URLSearchParams({
            date: bookingData.date,
            time: bookingData.time
        });
        const res = await fetch(`${API_URL}/tables/availability?${params.toString()}`);
        const data = await res.json();

        reservedTables = new Set(data.reservedTables || []);
        renderTableAvailability();
    } catch (error) {
        console.error('Availability Error:', error);
        availabilityNote.textContent = 'โหลดสถานะโต๊ะไม่สำเร็จในขณะนี้ กรุณารอสักครู่แล้วระบบจะลองอัปเดตใหม่';
    }
}

tables.forEach(table => {
    table.addEventListener('click', () => {
        if (table.classList.contains('unavailable')) {
            alert('โต๊ะนี้ถูกจองแล้ว กรุณาเลือกโต๊ะอื่น');
            return;
        }

        const isAlreadySelected = table.classList.contains('selected');
        tables.forEach(item => item.classList.remove('selected'));

        if (!isAlreadySelected) {
            table.classList.add('selected');
        }
    });
});

async function confirmSeat() {
    const selectedTable = getSelectedTableName();

    if (!selectedTable) {
        alert('กรุณาเลือกโต๊ะก่อนกดยืนยัน');
        return;
    }

    if (reservedTables.has(selectedTable)) {
        alert('โต๊ะนี้เพิ่งถูกจองไปแล้ว กรุณาเลือกใหม่');
        await loadAvailability();
        return;
    }

    confirmButton.disabled = true;
    confirmButton.textContent = 'กำลังบันทึก...';

    try {
        const response = await fetch(`${API_URL}/book`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...bookingData,
                table_number: selectedTable
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'ไม่สามารถบันทึกการจองได้');
        }

        localStorage.setItem('bookTable', selectedTable);
        localStorage.setItem('bookPax', `${bookingData.people}`);
        window.location.href = 'success.html';
    } catch (error) {
        console.error('Booking Error:', error);
        alert(error.message || 'เกิดข้อผิดพลาดในการจอง');
        await loadAvailability();
    } finally {
        confirmButton.disabled = false;
        confirmButton.textContent = 'ยืนยันที่นั่ง';
    }
}

const eventSource = new EventSource(`${API_URL}/events`);

eventSource.addEventListener('booking-change', async event => {
    const payload = JSON.parse(event.data);
    const booking = payload.booking;

    if (!booking) {
        return;
    }

    if (booking.date === bookingData.date) {
        await loadAvailability();
    }
});

eventSource.onerror = () => {
    availabilityNote.textContent = 'การเชื่อมต่อ realtime หลุด ระบบจะพยายามเชื่อมต่อใหม่อัตโนมัติ';
};

loadAvailability();
