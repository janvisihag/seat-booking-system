-- Seat Booking System - Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  squad_id INT NOT NULL,
  batch INT NOT NULL CHECK (batch IN (1, 2)),
  is_designated BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create seats table
CREATE TABLE seats (
  id INT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('designated', 'floater')),
  squad_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seat_id INT NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'released')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(seat_id, date, status) WHERE status = 'booked'
);

-- Create holidays table
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_bookings_user_date ON bookings(user_id, date);
CREATE INDEX idx_bookings_seat_date ON bookings(seat_id, date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_holidays_date ON holidays(date);

-- Insert designated seats (40 total - 4 seats per squad × 10 squads)
-- Squad 1
INSERT INTO seats (id, type, squad_id) VALUES
(1, 'designated', 1), (2, 'designated', 1), (3, 'designated', 1), (4, 'designated', 1);

-- Squad 2
INSERT INTO seats (id, type, squad_id) VALUES
(5, 'designated', 2), (6, 'designated', 2), (7, 'designated', 2), (8, 'designated', 2);

-- Squad 3
INSERT INTO seats (id, type, squad_id) VALUES
(9, 'designated', 3), (10, 'designated', 3), (11, 'designated', 3), (12, 'designated', 3);

-- Squad 4
INSERT INTO seats (id, type, squad_id) VALUES
(13, 'designated', 4), (14, 'designated', 4), (15, 'designated', 4), (16, 'designated', 4);

-- Squad 5
INSERT INTO seats (id, type, squad_id) VALUES
(17, 'designated', 5), (18, 'designated', 5), (19, 'designated', 5), (20, 'designated', 5);

-- Squad 6
INSERT INTO seats (id, type, squad_id) VALUES
(21, 'designated', 6), (22, 'designated', 6), (23, 'designated', 6), (24, 'designated', 6);

-- Squad 7
INSERT INTO seats (id, type, squad_id) VALUES
(25, 'designated', 7), (26, 'designated', 7), (27, 'designated', 7), (28, 'designated', 7);

-- Squad 8
INSERT INTO seats (id, type, squad_id) VALUES
(29, 'designated', 8), (30, 'designated', 8), (31, 'designated', 8), (32, 'designated', 8);

-- Squad 9
INSERT INTO seats (id, type, squad_id) VALUES
(33, 'designated', 9), (34, 'designated', 9), (35, 'designated', 9), (36, 'designated', 9);

-- Squad 10
INSERT INTO seats (id, type, squad_id) VALUES
(37, 'designated', 10), (38, 'designated', 10), (39, 'designated', 10), (40, 'designated', 10);

-- Insert floater seats (10 total for flexibility)
INSERT INTO seats (id, type, squad_id) VALUES
(41, 'floater', NULL), (42, 'floater', NULL), (43, 'floater', NULL), (44, 'floater', NULL), (45, 'floater', NULL),
(46, 'floater', NULL), (47, 'floater', NULL), (48, 'floater', NULL), (49, 'floater', NULL), (50, 'floater', NULL);

-- Insert 80 sample users (10 squads × 8 members each)
-- Squad 1 - Batch 1 (4 members), Batch 2 (4 members)
INSERT INTO users (name, squad_id, batch) VALUES
('Alice Johnson', 1, 1),
('Bob Smith', 1, 1),
('Charlie Brown', 1, 1),
('Diana Prince', 1, 1),
('Edward Norton', 1, 2),
('Fiona Apple', 1, 2),
('George Martin', 1, 2),
('Hannah Montana', 1, 2);

-- Squad 2 - Batch 1 (4 members), Batch 2 (4 members)
INSERT INTO users (name, squad_id, batch) VALUES
('Ivy League', 2, 1),
('Jack Ryan', 2, 1),
('Karen White', 2, 1),
('Liam Neeson', 2, 1),
('Megan Fox', 2, 2),
('Nathan Drake', 2, 2),
('Olivia Newton', 2, 2),
('Paul Walker', 2, 2);

-- Squad 3 - Batch 1 (4 members), Batch 2 (4 members)
INSERT INTO users (name, squad_id, batch) VALUES
('Quinn Tarantino', 3, 1),
('Ryan Gosling', 3, 1),
('Scarlett Johnson', 3, 1),
('Tom Cruise', 3, 1),
('Uma Thurman', 3, 2),
('Vincent Price', 3, 2),
('Wendy Williams', 3, 2),
('Xavier Dolan', 3, 2);

-- Squad 4 - Batch 1 (4 members), Batch 2 (4 members)
INSERT INTO users (name, squad_id, batch) VALUES
('Yara Shahidi', 4, 1),
('Zoe Kravitz', 4, 1),
('Aaron Paul', 4, 1),
('Bella Hadid', 4, 1),
('Carlos Castaneda', 4, 2),
('Diana Spencer', 4, 2),
('Ethan Hunt', 4, 2),
('Freida Pinto', 4, 2);

-- Squad 5 - Batch 1 (4 members), Batch 2 (4 members)
INSERT INTO users (name, squad_id, batch) VALUES
('Gal Gadot', 5, 1),
('Henry Cavill', 5, 1),
('Iris West', 5, 1),
('Jason Momoa', 5, 1),
('Katniss Everdeen', 5, 2),
('Loki Laufeyson', 5, 2),
('Marilyn Monroe', 5, 2),
('Nicholas Cage', 5, 2);

-- Squad 6 - Batch 1 (4 members), Batch 2 (4 members)
INSERT INTO users (name, squad_id, batch) VALUES
('Oscar Isaac', 6, 1),
('Penelope Cruz', 6, 1),
('Quinn Latifah', 6, 1),
('Robert Pattinson', 6, 1),
('Sophia Loren', 6, 2),
('Tom Hiddleston', 6, 2),
('Ultimata Stone', 6, 2),
('Valerie Bertinelli', 6, 2);

-- Squad 7 - Batch 1 (4 members), Batch 2 (4 members)
INSERT INTO users (name, squad_id, batch) VALUES
('Woody Harrelson', 7, 1),
('Xenia Seeberg', 7, 1),
('Yasmin Mogahed', 7, 1),
('Zendaya Coleman', 7, 1),
('Adrian Grenier', 7, 2),
('Blake Lively', 7, 2),
('Chloe Moretz', 7, 2),
('Dane DeHaan', 7, 2);

-- Squad 8 - Batch 1 (4 members), Batch 2 (4 members)
INSERT INTO users (name, squad_id, batch) VALUES
('Evan Peters', 8, 1),
('Faye Dunaway', 8, 1),
('Gregory Peck', 8, 1),
('Helena Bonham', 8, 1),
('Ian McKellen', 8, 2),
('Jared Leto', 8, 2),
('Kristen Stewart', 8, 2),
('Leonardo DiCaprio', 8, 2);

-- Squad 9 - Batch 1 (4 members), Batch 2 (4 members)
INSERT INTO users (name, squad_id, batch) VALUES
('Matthew McConaughey', 9, 1),
('Nicole Kidman', 9, 1),
('Orlando Bloom', 9, 1),
('Priyanka Chopra', 9, 1),
('Quincy Jones', 9, 2),
('Rachel McAdams', 9, 2),
('Shawn Mendes', 9, 2),
('Taylor Swift', 9, 2);

-- Squad 10 - Batch 1 (4 members), Batch 2 (4 members)
INSERT INTO users (name, squad_id, batch) VALUES
('Timothée Chalamet', 10, 1),
('Uma Pompeo', 10, 1),
('Viggo Mortensen', 10, 1),
('Winona Ryder', 10, 1),
('Xavier Samuel', 10, 2),
('Yolanda Hadid', 10, 2),
('Zac Efron', 10, 2),
('Ava Gardner', 10, 2);

-- Insert sample holidays
INSERT INTO holidays (date) VALUES
('2026-04-20'),
('2026-05-15'),
('2026-06-01');