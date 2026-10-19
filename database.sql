
CREATE DATABASE IF NOT EXISTS lab_booking;
USE lab_booking;

CREATE TABLE IF NOT EXISTS slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_name VARCHAR(100) NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('Available', 'Booked') NOT NULL DEFAULT 'Available',
    student_name VARCHAR(100) DEFAULT NULL,
    roll_no VARCHAR(30) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_slot (
        lab_name, slot_date, start_time, end_time
    )
);

INSERT IGNORE INTO slots
    (lab_name, slot_date, start_time, end_time)
VALUES
    ('Computer Lab 1', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '10:00:00'),
    ('Computer Lab 1', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '11:00:00'),
    ('Computer Lab 1', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', '12:00:00'),
    ('Computer Lab 2', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '10:00:00'),
    ('Computer Lab 2', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', '11:00:00'),
    ('Electronics Lab', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '14:00:00', '15:00:00');
