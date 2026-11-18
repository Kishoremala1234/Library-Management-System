-- =============================================
-- Library Management System Database Schema
-- Database: PostgreSQL (libmodel)
-- =============================================

-- Enable UUID extension (if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Book Details Table
CREATE TABLE IF NOT EXISTS lib_details (
    book_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50),
    isdeleted BOOLEAN DEFAULT FALSE
);

-- Optional: Initial Seed Data for Testing
INSERT INTO lib_details (name, author, isbn, isdeleted)
VALUES 
    ('Clean Code', 'Robert C. Martin', '9780132350884', FALSE),
    ('The Pragmatic Programmer', 'Andrew Hunt, David Thomas', '9780201616224', FALSE),
    ('Design Patterns', 'Erich Gamma et al.', '9780201633610', FALSE)
ON CONFLICT DO NOTHING;
