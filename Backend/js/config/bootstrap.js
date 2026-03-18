// Prepare the minimum schema the app needs when the backend starts.
function ensureTables(db, callback) {
    const createAdminsTableSql = `
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createBookingsTableSql = `
        CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            people INT NOT NULL,
            date DATE NOT NULL,
            time TIME NOT NULL,
            table_number VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'รอยืนยัน',
            handled_by_admin_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_bookings_admin
                FOREIGN KEY (handled_by_admin_id) REFERENCES admins(id)
                ON DELETE SET NULL
                ON UPDATE CASCADE
        )
    `;

    const seedAdminSql = `
        INSERT INTO admins (username, password)
        SELECT 'admin', '123456'
        WHERE NOT EXISTS (
            SELECT 1 FROM admins WHERE username = 'admin'
        )
    `;

    db.query(createAdminsTableSql, adminsErr => {
        if (adminsErr) {
            callback(adminsErr);
            return;
        }

        db.query(createBookingsTableSql, bookingsErr => {
            if (bookingsErr) {
                callback(bookingsErr);
                return;
            }

            db.query(seedAdminSql, seedErr => {
                callback(seedErr);
            });
        });
    });
}

// Optional: clear booking rows on each start while keeping admins untouched.
function resetBookingsIfNeeded(db, callback) {
    if (process.env.RESET_BOOKINGS_ON_START !== "true") {
        callback(null, false);
        return;
    }

    db.query("DELETE FROM bookings", err => {
        if (err) {
            callback(err);
            return;
        }

        callback(null, true);
    });
}

module.exports = {
    ensureTables,
    resetBookingsIfNeeded
};
