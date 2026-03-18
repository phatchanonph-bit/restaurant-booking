document.getElementById('res-name').innerText = localStorage.getItem('bookName') || '-';
document.getElementById('res-phone').innerText = localStorage.getItem('bookPhone') || '-';

const pax = localStorage.getItem('bookPax');
document.getElementById('res-pax').innerText = pax ? `${pax} ท่าน` : '-';
document.getElementById('res-date').innerText = localStorage.getItem('bookDate') || '-';
document.getElementById('res-time').innerText = localStorage.getItem('bookTime') || '-';
document.getElementById('res-table').innerText = localStorage.getItem('bookTable') || '-';
