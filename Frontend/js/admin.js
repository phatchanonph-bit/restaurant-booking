const ADMIN_TOKEN_KEY = 'restaurant_admin_token';
const ADMIN_USER_KEY = 'restaurant_admin_user';
const API_URL = (() => {
    if (!window.location.protocol.startsWith("http")) {
        return "http://localhost:3000";
    }

    if (window.location.port === "3000") {
        return window.location.origin;
    }

    const host = window.location.hostname || "localhost";
    return `${window.location.protocol}//${host}:3000`;
})();
const pendingTableBody = document.getElementById('booking-list');
const approvedTableBody = document.getElementById('approved-booking-list');
const noDataMsg = document.getElementById('no-data');
const noApprovedDataMsg = document.getElementById('no-approved-data');
const liveStatus = document.getElementById('live-status');
const lastUpdate = document.getElementById('last-update');
const logoutButton = document.getElementById('logout-button');
const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);

if (!adminToken) {
    window.location.href = 'admin-login.html';
}

function getAdminHeaders(extraHeaders = {}) {
    return {
        ...extraHeaders,
        Authorization: `Bearer ${adminToken}`
    };
}

async function verifyAdminSession() {
    try {
        const response = await fetch(`${API_URL}/admin/verify`, {
            headers: getAdminHeaders()
        });

        if (!response.ok) {
            throw new Error('เซสชันหมดอายุ');
        }
    } catch (error) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
        window.location.href = 'admin-login.html';
    }
}

function setLastUpdate() {
    lastUpdate.textContent = `อัปเดตล่าสุด: ${new Date().toLocaleString('th-TH')}`;
}

function getStatusClass(status) {
    if (status === 'ยืนยันแล้ว') return 'approved';
    if (status === 'ปฏิเสธแล้ว') return 'rejected';
    return 'pending';
}

function formatBookingDate(dateValue) {
    if (!dateValue) {
        return '-';
    }

    if (typeof dateValue === 'string' && dateValue.includes('T')) {
        return dateValue.slice(0, 10);
    }

    return dateValue;
}

function addHoursToTime(timeValue, hoursToAdd) {
    if (!timeValue) {
        return '-';
    }

    const [hours, minutes] = timeValue.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes + (hoursToAdd * 60);
    const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const nextHours = String(Math.floor(normalizedMinutes / 60)).padStart(2, '0');
    const nextMinutes = String(normalizedMinutes % 60).padStart(2, '0');
    return `${nextHours}:${nextMinutes}:00`;
}

function createActionButtons(book) {
    const approveButton = book.status === 'ยืนยันแล้ว'
        ? ''
        : `<button class="btn btn-approve" onclick="updateStatus(${book.id}, 'ยืนยันแล้ว')">ยืนยัน</button>`;

    return `
        ${approveButton}
        <button class="btn btn-reject" onclick="rejectBooking(${book.id})">ปฏิเสธ</button>
        <button class="btn btn-delete" onclick="deleteBooking(${book.id})">ลบ</button>
    `;
}

function createBookingRow(book) {
    const statusClass = getStatusClass(book.status);
    const bookingDate = formatBookingDate(book.date);
    const bookingEndTime = addHoursToTime(book.time, 3);
    const tableDisplay = book.table_number
        ? `
            <div class="table-summary">
                <span class="table-chip">${book.table_number}</span>
                <span class="slot-hint">${bookingDate} ${book.time} - ${bookingEndTime}</span>
            </div>
        `
        : '<span class="table-pending">ยังไม่ได้เลือกโต๊ะ</span>';

    return `
        <tr>
            <td>${book.id}</td>
            <td>${book.name}</td>
            <td>${book.phone}</td>
            <td>${book.people} ท่าน</td>
            <td class="slot-cell">
                <span class="slot-date">${bookingDate}</span>
                <span class="slot-time">${book.time} - ${bookingEndTime}</span>
            </td>
            <td>${tableDisplay}</td>
            <td><span class="status ${statusClass}">${book.status || 'รอยืนยัน'}</span></td>
            <td>${createActionButtons(book)}</td>
        </tr>
    `;
}

function renderBookings(list, targetElement, emptyElement, emptyText) {
    targetElement.innerHTML = '';

    if (!list.length) {
        emptyElement.textContent = emptyText;
        emptyElement.style.display = 'block';
        return;
    }

    emptyElement.style.display = 'none';
    targetElement.innerHTML = list.map(createBookingRow).join('');
}

async function loadBookings() {
    try {
        const res = await fetch(`${API_URL}/admin/bookings`, {
            headers: getAdminHeaders()
        });
        const data = await res.json();

        if (res.status === 401) {
            throw new Error('unauthorized');
        }

        if (!Array.isArray(data)) {
            throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
        }

        const approvedBookings = data.filter(book => book.status === 'ยืนยันแล้ว');
        const otherBookings = data.filter(book => book.status !== 'ยืนยันแล้ว');

        renderBookings(otherBookings, pendingTableBody, noDataMsg, 'ไม่มีรายการจองที่ต้องจัดการในตอนนี้');
        renderBookings(approvedBookings, approvedTableBody, noApprovedDataMsg, 'ยังไม่มีรายการที่ยืนยันแล้ว');
        setLastUpdate();
    } catch (err) {
        console.error("Fetch Error:", err);
        if (err.message === 'unauthorized') {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_USER_KEY);
            window.location.href = 'admin-login.html';
            return;
        }
        liveStatus.textContent = 'Realtime: โหลดข้อมูลไม่สำเร็จ';
    }
}

async function updateStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/admin/update-status`, {
            method: "POST",
            headers: getAdminHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ id, status: newStatus })
        });

        if (response.status === 401) {
            throw new Error('เซสชันหมดอายุ');
        }

        if (!response.ok) {
            throw new Error('อัปเดตสถานะไม่สำเร็จ');
        }
    } catch (err) {
        if (err.message === 'เซสชันหมดอายุ') {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_USER_KEY);
            window.location.href = 'admin-login.html';
            return;
        }
        alert("ไม่สามารถอัปเดตสถานะได้");
    }
}

async function rejectBooking(id) {
    if (!confirm(`ต้องการปฏิเสธและลบรายการจอง ID: ${id} หรือไม่?`)) {
        return;
    }

    await deleteBooking(id, true);
}

async function deleteBooking(id, skipConfirm = false) {
    if (!skipConfirm && !confirm(`ต้องการลบรายการจอง ID: ${id} หรือไม่?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/delete/${id}`, {
            method: "DELETE",
            headers: getAdminHeaders()
        });

        if (response.status === 401) {
            throw new Error('เซสชันหมดอายุ');
        }

        if (!response.ok) {
            throw new Error('ลบข้อมูลไม่สำเร็จ');
        }
    } catch (err) {
        if (err.message === 'เซสชันหมดอายุ') {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_USER_KEY);
            window.location.href = 'admin-login.html';
            return;
        }
        alert("ไม่สามารถลบข้อมูลได้");
    }
}

const eventSource = new EventSource(`${API_URL}/events`);

eventSource.addEventListener('connected', () => {
    liveStatus.textContent = 'Realtime: เชื่อมต่อแล้ว';
});

eventSource.addEventListener('booking-change', () => {
    liveStatus.textContent = 'Realtime: เชื่อมต่อแล้ว';
    loadBookings();
});

eventSource.onerror = () => {
    liveStatus.textContent = 'Realtime: หลุดการเชื่อมต่อ กำลังเชื่อมต่อใหม่...';
};

logoutButton.addEventListener('click', async () => {
    try {
        await fetch(`${API_URL}/admin/logout`, {
            method: 'POST',
            headers: getAdminHeaders()
        });
    } catch (error) {
        console.error('Logout Error:', error);
    }

    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    window.location.href = 'admin-login.html';
});

const autoRefreshInterval = setInterval(loadBookings, 30000);

window.addEventListener('beforeunload', () => {
    clearInterval(autoRefreshInterval);
    eventSource.close();
});

window.onload = async () => {
    await verifyAdminSession();
    await loadBookings();
};
