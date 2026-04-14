-- ============================================
-- Seat Booking System - FINAL CLEAN VERSION
-- Fully Idempotent + Interview Ready
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- RESET (OPTIONAL)
-- ========================
DROP TABLE IF EXISTS auth_users CASCADE;
DROP TABLE IF EXISTS auto_locks CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS user_leaves CASCADE;
DROP TABLE IF EXISTS floater_bookings CASCADE;
DROP TABLE IF EXISTS seat_blocking CASCADE;
DROP TABLE IF EXISTS seat_allocations CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS squads CASCADE;

-- ========================
-- TABLES
-- ========================

CREATE TABLE IF NOT EXISTS squads (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  batch INT NOT NULL CHECK (batch IN (1,2)),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  squad_id INT NOT NULL REFERENCES squads(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','admin')),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seats (
  id INT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('designated','floater')),
  squad_id INT REFERENCES squads(id),
  seat_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seat_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  seat_id INT NOT NULL REFERENCES seats(id),
  user_id UUID NOT NULL REFERENCES users(id),
  squad_id INT NOT NULL REFERENCES squads(id),
  status TEXT DEFAULT 'allocated' CHECK (status IN ('allocated','released','blocked')),
  release_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, seat_id)
);

CREATE TABLE IF NOT EXISTS seat_blocking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  seat_id INT NOT NULL REFERENCES seats(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, seat_id)
);

CREATE TABLE IF NOT EXISTS floater_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  seat_id INT NOT NULL REFERENCES seats(id),
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked','cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, seat_id)
);

CREATE TABLE IF NOT EXISTS user_leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auto_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lock_date DATE UNIQUE NOT NULL,
  locked_day DATE NOT NULL,
  locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- INDEXES
-- ========================
CREATE INDEX IF NOT EXISTS idx_alloc_date ON seat_allocations(date);
CREATE INDEX IF NOT EXISTS idx_alloc_user_date ON seat_allocations(user_id, date);
CREATE INDEX IF NOT EXISTS idx_block_date ON seat_blocking(date);
CREATE INDEX IF NOT EXISTS idx_float_date ON floater_bookings(date);
CREATE INDEX IF NOT EXISTS idx_leave_date ON user_leaves(date);

-- ========================
-- SEED DATA
-- ========================

-- Squads (only 5 squads needed - 5 squads per day)
INSERT INTO squads (id, name, batch)
SELECT i, 'Squad ' || i, CASE WHEN i <= 5 THEN 1 ELSE 2 END
FROM generate_series(1,10) i
ON CONFLICT (id) DO NOTHING;

-- Users (user1 → user80, but only first 40 are in active squads 1-5)
INSERT INTO users (name, squad_id)
SELECT 
  'user' || i,
  ((i - 1)/8) + 1
FROM generate_series(1,80) i
ON CONFLICT (name) DO NOTHING;

-- Auth users (mapped)
INSERT INTO auth_users (username, password, role, user_id)
SELECT 
  u.name,
  u.name,
  'user',
  u.id
FROM users u
ON CONFLICT (username) DO NOTHING;

-- Admin
INSERT INTO auth_users (username, password, role)
VALUES ('admin','Admin@2026!','admin')
ON CONFLICT (username) DO NOTHING;

-- Designated seats (40 seats for 5 squads, 8 seats each)
INSERT INTO seats (id, type, squad_id, seat_number)
SELECT 
  i,
  'designated',
  ((i - 1)/8) + 1,
  i
FROM generate_series(1,40) i
ON CONFLICT (id) DO NOTHING;

-- Floater seats (10)
INSERT INTO seats (id, type, squad_id, seat_number)
SELECT 
  i,
  'floater',
  NULL,
  i
FROM generate_series(41,50) i
ON CONFLICT (id) DO NOTHING;

-- Holidays
INSERT INTO holidays (date, reason) VALUES
('2026-04-20','Holiday'),
('2026-05-15','Holiday'),
('2026-06-01','Holiday')
ON CONFLICT (date) DO NOTHING;

-- ========================
-- VERIFICATION
-- ========================
DO $$
BEGIN
  RAISE NOTICE 'Setup Complete!';
  RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users);
  RAISE NOTICE 'Seats: %', (SELECT COUNT(*) FROM seats);
  RAISE NOTICE 'Auth Users: %', (SELECT COUNT(*) FROM auth_users);
END $$;