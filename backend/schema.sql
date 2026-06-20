-- =====================================================================
-- Clinic Appointment System — PostgreSQL schema  (DBMS CQI, v2)
-- Normalised to 3NF, hardened with audit columns, soft delete, version
-- tracking and an audit-log table.
--   psql -U clinic_user -d clinic_db -f schema.sql
-- (The app can also build/manage this schema via Alembic — see alembic/.)
-- =====================================================================

DROP TABLE IF EXISTS users              CASCADE;
DROP TABLE IF EXISTS audit_logs         CASCADE;
DROP TABLE IF EXISTS prescription_items CASCADE;
DROP TABLE IF EXISTS prescriptions      CASCADE;
DROP TABLE IF EXISTS appointments       CASCADE;
DROP TABLE IF EXISTS doctors            CASCADE;
DROP TABLE IF EXISTS patients           CASCADE;
DROP TABLE IF EXISTS medications        CASCADE;
DROP TABLE IF EXISTS specializations    CASCADE;

-- ---------------------------------------------------------------------
-- Auto-update trigger for updated_at
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- Lookup tables
-- ---------------------------------------------------------------------
CREATE TABLE specializations (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medications (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(120) NOT NULL UNIQUE,
    form       VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Users / authentication  (passwords are bcrypt-hashed by the app;
-- the Python seeder creates the demo accounts)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'Receptionist'
                  CHECK (role IN ('Admin','Doctor','Receptionist')),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Core entities (soft-deletable + version-tracked)
-- ---------------------------------------------------------------------
CREATE TABLE doctors (
    id                SERIAL PRIMARY KEY,
    full_name         VARCHAR(120) NOT NULL,
    email             VARCHAR(120) NOT NULL UNIQUE,
    phone             VARCHAR(20),
    specialization_id INTEGER NOT NULL REFERENCES specializations(id) ON DELETE RESTRICT,
    consultation_fee  NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (consultation_fee >= 0),
    version           INTEGER NOT NULL DEFAULT 1,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at        TIMESTAMP
);

CREATE TABLE patients (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(120) UNIQUE,
    phone         VARCHAR(20) NOT NULL,
    gender        VARCHAR(10) NOT NULL CHECK (gender IN ('Male','Female','Other')),
    date_of_birth DATE NOT NULL CHECK (date_of_birth <= CURRENT_DATE),
    address       TEXT,
    version       INTEGER NOT NULL DEFAULT 1,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at    TIMESTAMP
);

CREATE TABLE appointments (
    id               SERIAL PRIMARY KEY,
    patient_id       INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id        INTEGER NOT NULL REFERENCES doctors(id)  ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time       TIME NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'Scheduled'
                     CHECK (status IN ('Scheduled','Completed','Cancelled','No-Show')),
    reason           TEXT,
    version          INTEGER NOT NULL DEFAULT 1,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMP,
    CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appointment_date, start_time)
);

-- ---------------------------------------------------------------------
-- Prescriptions (1:1 appointment) and items (M:N to medications)
-- ---------------------------------------------------------------------
CREATE TABLE prescriptions (
    id             SERIAL PRIMARY KEY,
    appointment_id INTEGER NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    diagnosis      TEXT,
    notes          TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescription_items (
    id              SERIAL PRIMARY KEY,
    prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_id   INTEGER NOT NULL REFERENCES medications(id)   ON DELETE RESTRICT,
    dosage          VARCHAR(60) NOT NULL,
    frequency       VARCHAR(60) NOT NULL,
    duration_days   INTEGER NOT NULL CHECK (duration_days > 0),
    CONSTRAINT uq_prescription_medication UNIQUE (prescription_id, medication_id)
);

-- ---------------------------------------------------------------------
-- Audit log (immutable record of every mutation)
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
    id         SERIAL PRIMARY KEY,
    action     VARCHAR(20) NOT NULL,
    entity     VARCHAR(40) NOT NULL,
    entity_id  INTEGER,
    actor      VARCHAR(60) NOT NULL DEFAULT 'system',
    details    TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
CREATE INDEX idx_doctors_specialization ON doctors(specialization_id);
CREATE INDEX idx_doctors_deleted        ON doctors(deleted_at);
CREATE INDEX idx_patients_deleted       ON patients(deleted_at);
CREATE INDEX idx_appointments_patient   ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor    ON appointments(doctor_id);
CREATE INDEX idx_appointments_date      ON appointments(appointment_date);
CREATE INDEX idx_appointments_status    ON appointments(status);
CREATE INDEX idx_appointments_deleted   ON appointments(deleted_at);
CREATE INDEX idx_audit_entity           ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created          ON audit_logs(created_at);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_specializations_updated BEFORE UPDATE ON specializations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_medications_updated BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_doctors_updated BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_prescriptions_updated BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Minimal sample data (the Python seeder inserts a fuller set)
-- ---------------------------------------------------------------------
INSERT INTO specializations (name) VALUES
    ('General Physician'), ('Cardiology'), ('Dermatology'),
    ('Pediatrics'), ('Orthopedics');

INSERT INTO medications (name, form) VALUES
    ('Paracetamol','Tablet'), ('Amoxicillin','Capsule'),
    ('Cetirizine','Tablet'),  ('Atorvastatin','Tablet');

INSERT INTO doctors (full_name, email, phone, specialization_id, consultation_fee) VALUES
    ('Dr. Ayesha Khan', 'ayesha.khan@cityclinic.com', '03001234567', 2, 2500),
    ('Dr. Bilal Ahmed', 'bilal.ahmed@cityclinic.com', '03007654321', 1, 1200),
    ('Dr. Sara Malik',  'sara.malik@cityclinic.com',  '03219988776', 3, 2000);

INSERT INTO patients (full_name, email, phone, gender, date_of_birth, address) VALUES
    ('Hassan Raza', 'hassan.raza@example.com', '03451239876', 'Male',   '1995-04-12', 'Lahore'),
    ('Fatima Noor', 'fatima.noor@example.com', '03098765432', 'Female', '2001-09-30', 'Lahore');

INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, status, reason) VALUES
    (1, 1, '2025-05-20', '09:30', 'Completed', 'Chest pain and high blood pressure'),
    (2, 3, '2025-05-21', '11:00', 'Scheduled', 'Skin allergy');
