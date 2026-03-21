const API_URL = getApiUrl();

const STORAGE_KEYS = {
    token: "restaurant_admin_token",
    user: "restaurant_admin_user"
};

const BOOKING_STATUS = {
    approved: "ยืนยันแล้ว",
    rejected: "ปฏิเสธแล้ว",
    pending: "รอยืนยัน"
};

const MESSAGES = {
    noPending: "ไม่มีรายการจองที่ต้องจัดการในตอนนี้",
    noApproved: "ยังไม่มีรายการที่ยืนยันแล้ว",
    realtimeConnected: "Realtime: เชื่อมต่อแล้ว",
    realtimeError: "Realtime: โหลดข้อมูลไม่สำเร็จ",
    realtimeReconnecting: "Realtime: หลุดการเชื่อมต่อ กำลังเชื่อมต่อใหม่...",
    sessionExpired: "เซสชันหมดอายุ",
    updateFailed: "ไม่สามารถอัปเดตสถานะได้",
    deleteFailed: "ไม่สามารถลบข้อมูลได้"
};

const elements = {
    pendingTableBody: document.getElementById("booking-list"),
    approvedTableBody: document.getElementById("approved-booking-list"),
    noPendingMessage: document.getElementById("no-data"),
    noApprovedMessage: document.getElementById("no-approved-data"),
    liveStatus: document.getElementById("live-status"),
    lastUpdate: document.getElementById("last-update"),
    logoutButton: document.getElementById("logout-button")
};

const adminToken = localStorage.getItem(STORAGE_KEYS.token);

if (!adminToken) {
    redirectToLogin();
}

function getApiUrl() {
    if (!window.location.protocol.startsWith("http")) {
        return "http://localhost:3000";
    }

    if (window.location.port === "3000") {
        return window.location.origin;
    }

    const host = window.location.hostname || "localhost";
    return `${window.location.protocol}//${host}:3000`;
}

function redirectToLogin() {
    window.location.href = "admin-login.html";
}

function clearAdminSession() {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
}

function logoutAndRedirect() {
    clearAdminSession();
    redirectToLogin();
}

function getAuthHeaders(extraHeaders = {}) {
    return {
        ...extraHeaders,
        Authorization: `Bearer ${adminToken}`
    };
}

function updateLastRefreshTime() {
    elements.lastUpdate.textContent = `อัปเดตล่าสุด: ${new Date().toLocaleString("th-TH")}`;
}

function getStatusClass(status) {
    if (status === BOOKING_STATUS.approved) {
        return "approved";
    }

    if (status === BOOKING_STATUS.rejected) {
        return "rejected";
    }

    return "pending";
}

function formatBookingDate(dateValue) {
    if (!dateValue) {
        return "-";
    }

    if (typeof dateValue === "string" && dateValue.includes("T")) {
        return dateValue.slice(0, 10);
    }

    return dateValue;
}

function addHours(timeValue, hoursToAdd) {
    if (!timeValue) {
        return "-";
    }

    const [hours, minutes] = timeValue.split(":").map(Number);
    const currentMinutes = (hours * 60) + minutes;
    const nextMinutes = currentMinutes + (hoursToAdd * 60);
    const safeMinutes = ((nextMinutes % 1440) + 1440) % 1440;
    const nextHours = String(Math.floor(safeMinutes / 60)).padStart(2, "0");
    const nextMinuteText = String(safeMinutes % 60).padStart(2, "0");

    return `${nextHours}:${nextMinuteText}:00`;
}

function getBookingTimeRange(booking) {
    const startTime = booking.time || "-";
    const endTime = addHours(booking.time, 3);
    return `${startTime} - ${endTime}`;
}

function createActionButtons(booking) {
    const approveButton = booking.status === BOOKING_STATUS.approved
        ? ""
        : `<button class="btn btn-approve" onclick="updateStatus(${booking.id}, '${BOOKING_STATUS.approved}')">ยืนยัน</button>`;

    return `
        ${approveButton}
        <button class="btn btn-reject" onclick="rejectBooking(${booking.id})">ปฏิเสธ</button>
        <button class="btn btn-delete" onclick="deleteBooking(${booking.id})">ลบ</button>
    `;
}

function createTableSummary(booking) {
    if (!booking.table_number) {
        return '<span class="table-pending">ยังไม่ได้เลือกโต๊ะ</span>';
    }

    const bookingDate = formatBookingDate(booking.date);
    const bookingTimeRange = getBookingTimeRange(booking);

    return `
        <div class="table-summary">
            <span class="table-chip">${booking.table_number}</span>
            <span class="slot-hint">${bookingDate} ${bookingTimeRange}</span>
        </div>
    `;
}

function createBookingRow(booking) {
    const bookingDate = formatBookingDate(booking.date);
    const bookingTimeRange = getBookingTimeRange(booking);
    const statusClass = getStatusClass(booking.status);
    const statusText = booking.status || BOOKING_STATUS.pending;

    return `
        <tr>
            <td>${booking.id}</td>
            <td>${booking.name}</td>
            <td>${booking.phone}</td>
            <td>${booking.people} ท่าน</td>
            <td class="slot-cell">
                <span class="slot-date">${bookingDate}</span>
                <span class="slot-time">${bookingTimeRange}</span>
            </td>
            <td>${createTableSummary(booking)}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>${createActionButtons(booking)}</td>
        </tr>
    `;
}

function renderBookings(list, tableBody, emptyMessageElement, emptyText) {
    if (!list.length) {
        tableBody.innerHTML = "";
        emptyMessageElement.textContent = emptyText;
        emptyMessageElement.style.display = "block";
        return;
    }

    emptyMessageElement.style.display = "none";
    tableBody.innerHTML = list.map(createBookingRow).join("");
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status === 401) {
        throw new Error(MESSAGES.sessionExpired);
    }

    return response;
}

function handleSessionError(error) {
    if (error.message === MESSAGES.sessionExpired) {
        logoutAndRedirect();
        return true;
    }

    return false;
}

async function verifyAdminSession() {
    try {
        await fetchJson(`${API_URL}/admin/verify`, {
            headers: getAuthHeaders()
        });
    } catch (error) {
        logoutAndRedirect();
    }
}

async function loadBookings() {
    try {
        const response = await fetchJson(`${API_URL}/admin/bookings`, {
            headers: getAuthHeaders()
        });
        const bookings = await response.json();

        if (!Array.isArray(bookings)) {
            throw new Error("รูปแบบข้อมูลไม่ถูกต้อง");
        }

        const approvedBookings = bookings.filter(booking => booking.status === BOOKING_STATUS.approved);
        const pendingBookings = bookings.filter(booking => booking.status !== BOOKING_STATUS.approved);

        renderBookings(
            pendingBookings,
            elements.pendingTableBody,
            elements.noPendingMessage,
            MESSAGES.noPending
        );
        renderBookings(
            approvedBookings,
            elements.approvedTableBody,
            elements.noApprovedMessage,
            MESSAGES.noApproved
        );
        updateLastRefreshTime();
    } catch (error) {
        console.error("Load Bookings Error:", error);

        if (handleSessionError(error)) {
            return;
        }

        elements.liveStatus.textContent = MESSAGES.realtimeError;
    }
}

async function updateStatus(id, newStatus) {
    try {
        const response = await fetchJson(`${API_URL}/admin/update-status`, {
            method: "POST",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ id, status: newStatus })
        });

        if (!response.ok) {
            throw new Error(MESSAGES.updateFailed);
        }

        await loadBookings();
    } catch (error) {
        if (handleSessionError(error)) {
            return;
        }

        alert(MESSAGES.updateFailed);
    }
}

async function rejectBooking(id) {
    const confirmed = confirm(`ต้องการปฏิเสธและลบรายการจอง ID: ${id} หรือไม่?`);

    if (!confirmed) {
        return;
    }

    await deleteBooking(id, true);
}

async function deleteBooking(id, skipConfirm = false) {
    const confirmed = skipConfirm || confirm(`ต้องการลบรายการจอง ID: ${id} หรือไม่?`);

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetchJson(`${API_URL}/admin/delete/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(MESSAGES.deleteFailed);
        }

        await loadBookings();
    } catch (error) {
        if (handleSessionError(error)) {
            return;
        }

        alert(MESSAGES.deleteFailed);
    }
}

async function logout() {
    try {
        await fetch(`${API_URL}/admin/logout`, {
            method: "POST",
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error("Logout Error:", error);
    }

    logoutAndRedirect();
}

function setupRealtimeUpdates() {
    const eventSource = new EventSource(`${API_URL}/events`);

    eventSource.addEventListener("connected", () => {
        elements.liveStatus.textContent = MESSAGES.realtimeConnected;
    });

    eventSource.addEventListener("booking-change", () => {
        elements.liveStatus.textContent = MESSAGES.realtimeConnected;
        loadBookings();
    });

    eventSource.onerror = () => {
        elements.liveStatus.textContent = MESSAGES.realtimeReconnecting;
    };

    return eventSource;
}

function startPage() {
    const eventSource = setupRealtimeUpdates();
    const autoRefreshInterval = setInterval(loadBookings, 30000);

    elements.logoutButton.addEventListener("click", logout);

    window.addEventListener("beforeunload", () => {
        clearInterval(autoRefreshInterval);
        eventSource.close();
    });

    verifyAdminSession().then(loadBookings);
}

window.updateStatus = updateStatus;
window.rejectBooking = rejectBooking;
window.deleteBooking = deleteBooking;
window.addEventListener("load", startPage);
