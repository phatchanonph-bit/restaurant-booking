const bookingFields = {
    "res-name": "bookName",
    "res-phone": "bookPhone",
    "res-date": "bookDate",
    "res-time": "bookTime",
    "res-table": "bookTable"
};

Object.entries(bookingFields).forEach(([elementId, storageKey]) => {
    document.getElementById(elementId).innerText = localStorage.getItem(storageKey) || "-";
});

const pax = localStorage.getItem("bookPax");
document.getElementById("res-pax").innerText = pax ? `${pax} ท่าน` : "-";
