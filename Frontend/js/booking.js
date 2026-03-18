function goToSelectSeat(event) {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const guests = document.getElementById('guests').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    localStorage.setItem('bookName', name);
    localStorage.setItem('bookPhone', phone);
    localStorage.setItem('bookPax', guests);
    localStorage.setItem('bookDate', date);
    localStorage.setItem('bookTime', time);

    window.location.href = 'select-seat.html';
}
