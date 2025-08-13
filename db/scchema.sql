-- Enable FK enforcement (SQLite requires this per-connection)
PRAGMA foreign_keys = ON;

-- ======================
-- Core tables
-- ======================

CREATE TABLE student (
  id           INTEGER PRIMARY KEY,
  name         TEXT    NOT NULL,
  phone_number TEXT    NOT NULL UNIQUE, -- store as TEXT to preserve leading zeros/formatting
  id_number    TEXT    NOT NULL UNIQUE  -- national ID safer as TEXT
);

CREATE TABLE center (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
  -- , UNIQUE(name)            -- uncomment if center names must be distinct
);

CREATE TABLE college (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL
  -- , UNIQUE(name)            -- uncomment if college names must be distinct
);

CREATE TABLE reservation (
  id         INTEGER PRIMARY KEY,
  center_id  INTEGER NOT NULL REFERENCES center(id)  ON UPDATE CASCADE ON DELETE RESTRICT,
  college_id INTEGER NOT NULL REFERENCES college(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  date       TEXT    NOT NULL,       -- YYYY-MM-DD (date only)
  capacity   INTEGER NOT NULL,
  reserved   INTEGER NOT NULL,

  -- Uniqueness: exactly one session per (center, college, date)
  UNIQUE(center_id, college_id, date),

  -- Validations
  CHECK (capacity >= 0),
  CHECK (reserved >= 0),
  CHECK (reserved <= capacity),
  CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]') -- rough YYYY-MM-DD check
);

CREATE TABLE student_reservation (
  id             INTEGER PRIMARY KEY,
  student_id     INTEGER NOT NULL REFERENCES student(id)     ON UPDATE CASCADE ON DELETE CASCADE,
  reservation_id INTEGER NOT NULL REFERENCES reservation(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE(student_id, reservation_id)
);

-- ======================
-- Indexes (recommendations)
-- ======================

-- Already enforced by UNIQUE constraint above, but explicit index name can help clarity:
-- CREATE UNIQUE INDEX reservation_unique_trio ON reservation(center_id, college_id, date);

CREATE INDEX idx_student_reservation_student     ON student_reservation(student_id);
CREATE INDEX idx_student_reservation_reservation ON student_reservation(reservation_id);

-- ======================
-- Triggers: extra validations + capacity management
-- ======================

-- Validate reservation fields before INSERT
CREATE TRIGGER reservation_validate_before_insert
BEFORE INSERT ON reservation
BEGIN
  SELECT CASE
    WHEN NEW.date IS NULL
         OR NEW.date NOT GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'
      THEN RAISE(ABORT, 'reservation.date must be YYYY-MM-DD')
    WHEN NEW.capacity IS NULL OR NEW.capacity < 0
      THEN RAISE(ABORT, 'reservation.capacity must be >= 0')
    WHEN NEW.reserved IS NULL OR NEW.reserved < 0
      THEN RAISE(ABORT, 'reservation.reserved must be >= 0')
    WHEN NEW.reserved > NEW.capacity
      THEN RAISE(ABORT, 'reservation.reserved cannot exceed reservation.capacity')
  END;
END;

-- Validate reservation fields before UPDATE
CREATE TRIGGER reservation_validate_before_update
BEFORE UPDATE ON reservation
BEGIN
  SELECT CASE
    WHEN NEW.date IS NULL
         OR NEW.date NOT GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'
      THEN RAISE(ABORT, 'reservation.date must be YYYY-MM-DD')
    WHEN NEW.capacity < 0
      THEN RAISE(ABORT, 'reservation.capacity must be >= 0')
    WHEN NEW.reserved < 0
      THEN RAISE(ABORT, 'reservation.reserved must be >= 0')
    WHEN NEW.reserved > NEW.capacity
      THEN RAISE(ABORT, 'reservation.reserved cannot exceed reservation.capacity')
  END;
END;

-- Prevent adding a student_reservation if the target reservation is already full
CREATE TRIGGER student_reservation_prevent_overbook
BEFORE INSERT ON student_reservation
BEGIN
  SELECT CASE
    WHEN (SELECT reserved  FROM reservation WHERE id = NEW.reservation_id)
       >= (SELECT capacity FROM reservation WHERE id = NEW.reservation_id)
      THEN RAISE(ABORT, 'Reservation is at capacity')
  END;
END;

-- Keep reservation.reserved in sync on INSERT
CREATE TRIGGER student_reservation_after_insert
AFTER INSERT ON student_reservation
BEGIN
  UPDATE reservation
     SET reserved = reserved + 1
   WHERE id = NEW.reservation_id;
END;

-- Keep reservation.reserved in sync on DELETE
CREATE TRIGGER student_reservation_after_delete
AFTER DELETE ON student_reservation
BEGIN
  UPDATE reservation
     SET reserved = reserved - 1
   WHERE id = OLD.reservation_id;
END;

-- Moving a student_reservation to a different reservation:
-- 1) forbid move if the new reservation is full
CREATE TRIGGER student_reservation_prevent_overbook_on_update
BEFORE UPDATE OF reservation_id ON student_reservation
BEGIN
  SELECT CASE
    WHEN NEW.reservation_id <> OLD.reservation_id AND
         (SELECT reserved  FROM reservation WHERE id = NEW.reservation_id)
       >= (SELECT capacity FROM reservation WHERE id = NEW.reservation_id)
      THEN RAISE(ABORT, 'Reservation is at capacity')
  END;
END;

-- 2) adjust both counters if the reservation_id changes
CREATE TRIGGER student_reservation_after_update
AFTER UPDATE OF reservation_id ON student_reservation
BEGIN
  UPDATE reservation SET reserved = reserved - 1 WHERE id = OLD.reservation_id;
  UPDATE reservation SET reserved = reserved + 1 WHERE id = NEW.reservation_id;
END;
