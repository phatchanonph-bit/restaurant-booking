const API_URL = location.protocol.startsWith("http")
    ? location.port === "3000" ? location.origin : `${location.protocol}//${location.hostname || "localhost"}:3000`
    : "http://localhost:3000";
const TOKEN = localStorage.getItem("restaurant_admin_token");
const STATUS = { approved: "ยืนยันแล้ว", rejected: "ปฏิเสธแล้ว", pending: "รอยืนยัน" };
const TEXT = {
    noPending: "ไม่มีรายการจองที่ต้องจัดการในตอนนี้",
    noApproved: "ยังไม่มีรายการที่ยืนยันแล้ว",
    connected: "Realtime: เชื่อมต่อแล้ว",
    reconnecting: "Realtime: หลุดการเชื่อมต่อ กำลังเชื่อมต่อใหม่...",
    loadFailed: "Realtime: โหลดข้อมูลไม่สำเร็จ",
    updateFailed: "ไม่สามารถอัปเดตสถานะได้",
    deleteFailed: "ไม่สามารถลบข้อมูลได้"
};
const [$pending, $approved, $emptyPending, $emptyApproved, $live, $updatedAt, $logout] =
    ["booking-list", "approved-booking-list", "no-data", "no-approved-data", "live-status", "last-update", "logout-button"]
        .map(id => document.getElementById(id));
const auth = extra => ({ ...extra, Authorization: `Bearer ${TOKEN}` });
const goLogin = () => {
    localStorage.removeItem("restaurant_admin_token");
    localStorage.removeItem("restaurant_admin_user");
    location.href = "admin-login.html";
};
const formatDate = v => !v ? "-" : typeof v === "string" && v.includes("T") ? v.slice(0, 10) : v;
const addHours = t => {
    if (!t) {
        return "-";
    }

    const [h, m] = t.split(":").map(Number);
    const x = (((h * 60) + m + 180) % 1440 + 1440) % 1440;
    return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}:00`;
};
const row = b => `
    <tr>
        <td>${b.id}</td>
        <td>${b.name}</td>
        <td>${b.phone}</td>
        <td>${b.people} ท่าน</td>
        <td class="slot-cell"><span class="slot-date">${formatDate(b.date)}</span><span class="slot-time">${b.time || "-"} - ${addHours(b.time)}</span></td>
        <td>${b.table_number ? `<div class="table-summary"><span class="table-chip">${b.table_number}</span><span class="slot-hint">${formatDate(b.date)} ${b.time || "-"} - ${addHours(b.time)}</span></div>` : '<span class="table-pending">ยังไม่ได้เลือกโต๊ะ</span>'}</td>
        <td><span class="status ${b.status === STATUS.approved ? "approved" : b.status === STATUS.rejected ? "rejected" : "pending"}">${b.status || STATUS.pending}</span></td>
        <td>
            ${b.status === STATUS.approved ? "" : `<button class="btn btn-approve" onclick="updateStatus(${b.id}, '${STATUS.approved}')">ยืนยัน</button>`}
            <button class="btn btn-reject" onclick="rejectBooking(${b.id})">ปฏิเสธ</button>
            <button class="btn btn-delete" onclick="deleteBooking(${b.id})">ลบ</button>
        </td>
    </tr>
`;

if (!TOKEN) {
    goLogin();
}

async function request(url, options) {
    const r = await fetch(url, options);

    if (r.status === 401) {
        goLogin();
        throw new Error("login");
    }

    return r;
}

async function loadBookings() {
    try {
        const list = await (await request(`${API_URL}/admin/bookings`, { headers: auth() })).json();
        const groups = [
            [list.filter(b => b.status !== STATUS.approved), $pending, $emptyPending, TEXT.noPending],
            [list.filter(b => b.status === STATUS.approved), $approved, $emptyApproved, TEXT.noApproved]
        ];

        groups.forEach(([items, table, empty, text]) => {
            table.innerHTML = items.map(row).join("");
            empty.style.display = items.length ? "none" : "block";
            empty.textContent = text;
        });

        $updatedAt.textContent = `อัปเดตล่าสุด: ${new Date().toLocaleString("th-TH")}`;
    } catch (e) {
        if (e.message !== "login") {
            console.error("Load Bookings Error:", e);
            $live.textContent = TEXT.loadFailed;
        }
    }
}

async function updateStatus(id, status) {
    try {
        const r = await request(`${API_URL}/admin/update-status`, {
            method: "POST",
            headers: auth({ "Content-Type": "application/json" }),
            body: JSON.stringify({ id, status })
        });

        if (!r.ok) {
            throw new Error();
        }

        loadBookings();
    } catch (e) {
        if (e.message !== "login") {
            alert(TEXT.updateFailed);
        }
    }
}

async function deleteBooking(id, skip = false) {
    if (!skip && !confirm(`ต้องการลบรายการจอง ID: ${id} หรือไม่?`)) {
        return;
    }

    try {
        const r = await request(`${API_URL}/admin/delete/${id}`, { method: "DELETE", headers: auth() });

        if (!r.ok) {
            throw new Error();
        }

        loadBookings();
    } catch (e) {
        if (e.message !== "login") {
            alert(TEXT.deleteFailed);
        }
    }
}

async function rejectBooking(id) {
    if (confirm(`ต้องการปฏิเสธและลบรายการจอง ID: ${id} หรือไม่?`)) {
        deleteBooking(id, true);
    }
}

window.updateStatus = updateStatus;
window.deleteBooking = deleteBooking;
window.rejectBooking = rejectBooking;
window.addEventListener("load", async () => {
    try {
        await request(`${API_URL}/admin/verify`, { headers: auth() });
    } catch {
        return;
    }

    const s = new EventSource(`${API_URL}/events`);
    const i = setInterval(loadBookings, 30000);

    s.addEventListener("connected", () => $live.textContent = TEXT.connected);
    s.addEventListener("booking-change", () => {
        $live.textContent = TEXT.connected;
        loadBookings();
    });
    s.onerror = () => $live.textContent = TEXT.reconnecting;

    $logout.addEventListener("click", async () => {
        try {
            await fetch(`${API_URL}/admin/logout`, { method: "POST", headers: auth() });
        } catch (e) {
            console.error("Logout Error:", e);
        }

        goLogin();
    });

    addEventListener("beforeunload", () => {
        clearInterval(i);
        s.close();
    });

    loadBookings();
});
