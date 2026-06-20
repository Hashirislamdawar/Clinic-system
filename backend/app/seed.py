"""Populate the database with realistic sample data.

Run from the backend folder:  python -m app.seed
Safe to re-run: it clears existing rows first.
"""
from datetime import date, time

from .core.security import hash_password
from .database import Base, SessionLocal, engine
from . import models


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Clear in dependency order (children first).
        for model in (
            models.PrescriptionItem,
            models.Prescription,
            models.Appointment,
            models.Doctor,
            models.Patient,
            models.Medication,
            models.Specialization,
            models.AuditLog,
            models.User,
        ):
            db.query(model).delete()
        db.commit()

        # --- Users (login accounts, one per role) --------------------------- #
        users = [
            models.User(
                full_name="Admin User",
                email="admin@cityclinic.com",
                password_hash=hash_password("admin123"),
                role="Admin",
            ),
            models.User(
                full_name="Dr. Ayesha Khan",
                email="doctor@cityclinic.com",
                password_hash=hash_password("doctor123"),
                role="Doctor",
            ),
            models.User(
                full_name="Front Desk",
                email="reception@cityclinic.com",
                password_hash=hash_password("reception123"),
                role="Receptionist",
            ),
        ]
        db.add_all(users)
        db.flush()

        # --- Specializations ------------------------------------------------ #
        spec_names = [
            "General Physician",
            "Cardiology",
            "Dermatology",
            "Pediatrics",
            "Orthopedics",
        ]
        specs = [models.Specialization(name=n) for n in spec_names]
        db.add_all(specs)
        db.flush()
        spec = {s.name: s for s in specs}

        # --- Doctors -------------------------------------------------------- #
        doctors = [
            models.Doctor(
                full_name="Dr. Ayesha Khan",
                email="ayesha.khan@cityclinic.com",
                phone="03001234567",
                specialization_id=spec["Cardiology"].id,
                consultation_fee=2500,
            ),
            models.Doctor(
                full_name="Dr. Bilal Ahmed",
                email="bilal.ahmed@cityclinic.com",
                phone="03007654321",
                specialization_id=spec["General Physician"].id,
                consultation_fee=1200,
            ),
            models.Doctor(
                full_name="Dr. Sara Malik",
                email="sara.malik@cityclinic.com",
                phone="03219988776",
                specialization_id=spec["Dermatology"].id,
                consultation_fee=2000,
            ),
            models.Doctor(
                full_name="Dr. Imran Yousaf",
                email="imran.yousaf@cityclinic.com",
                phone="03331122334",
                specialization_id=spec["Pediatrics"].id,
                consultation_fee=1500,
            ),
        ]
        db.add_all(doctors)
        db.flush()

        # --- Patients ------------------------------------------------------- #
        patients = [
            models.Patient(
                full_name="Hassan Raza",
                email="hassan.raza@example.com",
                phone="03451239876",
                gender="Male",
                date_of_birth=date(1995, 4, 12),
                address="House 12, Street 5, Lahore",
            ),
            models.Patient(
                full_name="Fatima Noor",
                email="fatima.noor@example.com",
                phone="03098765432",
                gender="Female",
                date_of_birth=date(2001, 9, 30),
                address="Flat 4B, Gulberg, Lahore",
            ),
            models.Patient(
                full_name="Usman Tariq",
                phone="03126549870",
                gender="Male",
                date_of_birth=date(1988, 1, 5),
                address="DHA Phase 6, Karachi",
            ),
            models.Patient(
                full_name="Maryam Javed",
                email="maryam.javed@example.com",
                phone="03311239988",
                gender="Female",
                date_of_birth=date(2015, 7, 22),
                address="F-8, Islamabad",
            ),
        ]
        db.add_all(patients)
        db.flush()

        # --- Medications ---------------------------------------------------- #
        meds = [
            models.Medication(name="Paracetamol", form="Tablet"),
            models.Medication(name="Amoxicillin", form="Capsule"),
            models.Medication(name="Cetirizine", form="Tablet"),
            models.Medication(name="Atorvastatin", form="Tablet"),
        ]
        db.add_all(meds)
        db.flush()

        # --- Appointments --------------------------------------------------- #
        appts = [
            models.Appointment(
                patient_id=patients[0].id,
                doctor_id=doctors[0].id,
                appointment_date=date(2025, 5, 20),
                start_time=time(9, 30),
                status="Completed",
                reason="Chest pain and high blood pressure",
            ),
            models.Appointment(
                patient_id=patients[1].id,
                doctor_id=doctors[2].id,
                appointment_date=date(2025, 5, 21),
                start_time=time(11, 0),
                status="Scheduled",
                reason="Skin allergy",
            ),
            models.Appointment(
                patient_id=patients[3].id,
                doctor_id=doctors[3].id,
                appointment_date=date(2025, 5, 22),
                start_time=time(10, 15),
                status="Scheduled",
                reason="Routine child check-up",
            ),
        ]
        db.add_all(appts)
        db.flush()

        # --- A prescription for the completed appointment ------------------- #
        rx = models.Prescription(
            appointment_id=appts[0].id,
            diagnosis="Hypertension",
            notes="Reduce salt intake, follow up in 2 weeks.",
        )
        db.add(rx)
        db.flush()
        db.add_all(
            [
                models.PrescriptionItem(
                    prescription_id=rx.id,
                    medication_id=meds[3].id,
                    dosage="10 mg",
                    frequency="Once daily",
                    duration_days=30,
                ),
                models.PrescriptionItem(
                    prescription_id=rx.id,
                    medication_id=meds[0].id,
                    dosage="500 mg",
                    frequency="As needed",
                    duration_days=7,
                ),
            ]
        )

        db.commit()
        print(
            f"Seeded: {len(users)} users, {len(specs)} specializations, {len(doctors)} doctors, "
            f"{len(patients)} patients, {len(meds)} medications, "
            f"{len(appts)} appointments, 1 prescription."
        )
        print("Login: admin@cityclinic.com / admin123  (Admin)")
    finally:
        db.close()


if __name__ == "__main__":
    run()
