CREATE DATABASE IF NOT EXISTS restaurant
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE restaurant;

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

INSERT INTO admins (username, password)
SELECT 'admin', '123456'
WHERE NOT EXISTS (
    SELECT 1 FROM admins WHERE username = 'admin'
);
