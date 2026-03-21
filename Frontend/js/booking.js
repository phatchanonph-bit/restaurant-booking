function goToSelectSeat(event) {
    event.preventDefault();

    const fields = {
        bookName: "name",
        bookPhone: "phone",
        bookPax: "guests",
        bookDate: "date",
        bookTime: "time"
    };

    Object.entries(fields).forEach(([storageKey, inputId]) => {
        localStorage.setItem(storageKey, document.getElementById(inputId).value.trim());
    });

    window.location.href = "select-seat.html";
}
