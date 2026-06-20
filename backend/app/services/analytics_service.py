"""Dashboard analytics. Results are cached briefly to avoid recomputation."""
from datetime import date, timedelta

from sqlalchemy import and_, func
from sqlalchemy.orm import joinedload

from ..core.cache import cache
from ..core.config import settings
from ..models import Appointment, Doctor, Patient

# Reusable "not soft-deleted" predicates.
ACTIVE_PATIENT = Patient.deleted_at.is_(None)
ACTIVE_DOCTOR = Doctor.deleted_at.is_(None)
ACTIVE_APPT = Appointment.deleted_at.is_(None)

CACHE_KEY = "analytics:overview"


def _appt_dict(a: Appointment) -> dict:
    return {
        "id": a.id,
        "appointment_date": a.appointment_date.isoformat(),
        "start_time": a.start_time.strftime("%H:%M"),
        "status": a.status,
        "reason": a.reason,
        "patient_name": a.patient.full_name if a.patient else None,
        "doctor_name": a.doctor.full_name if a.doctor else None,
    }


class AnalyticsService:
    def __init__(self, db):
        self.db = db

    def overview(self) -> dict:
        cached = cache.get(CACHE_KEY)
        if cached is not None:
            return cached
        result = self._compute()
        cache.set(CACHE_KEY, result, settings.analytics_cache_ttl)
        return result

    def _compute(self) -> dict:
        db = self.db
        today = date.today()
        month_ago = today - timedelta(days=30)
        prev_month = today - timedelta(days=60)

        total_patients = db.query(Patient).filter(ACTIVE_PATIENT).count()
        total_doctors = db.query(Doctor).filter(ACTIVE_DOCTOR).count()
        total_appointments = db.query(Appointment).filter(ACTIVE_APPT).count()

        revenue = (
            db.query(func.coalesce(func.sum(Doctor.consultation_fee), 0))
            .select_from(Appointment)
            .join(Doctor, Appointment.doctor_id == Doctor.id)
            .filter(Appointment.status == "Completed", ACTIVE_APPT)
            .scalar()
        )

        new_recent = (
            db.query(Patient).filter(ACTIVE_PATIENT, Patient.created_at >= month_ago).count()
        )
        new_prev = (
            db.query(Patient)
            .filter(ACTIVE_PATIENT, Patient.created_at >= prev_month, Patient.created_at < month_ago)
            .count()
        )
        growth_pct = None
        if new_prev > 0:
            growth_pct = round((new_recent - new_prev) / new_prev * 100, 1)
        elif new_recent > 0:
            growth_pct = 100.0

        completed = (
            db.query(Appointment).filter(ACTIVE_APPT, Appointment.status == "Completed").count()
        )
        utilization = round(completed / total_appointments * 100, 1) if total_appointments else 0
        appts_today = (
            db.query(Appointment)
            .filter(ACTIVE_APPT, Appointment.appointment_date == today)
            .count()
        )

        status_rows = (
            db.query(Appointment.status, func.count(Appointment.id))
            .filter(ACTIVE_APPT)
            .group_by(Appointment.status)
            .all()
        )
        trend_rows = (
            db.query(Appointment.appointment_date, func.count(Appointment.id))
            .filter(ACTIVE_APPT)
            .group_by(Appointment.appointment_date)
            .order_by(Appointment.appointment_date)
            .all()
        )
        workload_rows = (
            db.query(Doctor.full_name, func.count(Appointment.id))
            .select_from(Doctor)
            .outerjoin(
                Appointment,
                and_(Appointment.doctor_id == Doctor.id, ACTIVE_APPT),
            )
            .filter(ACTIVE_DOCTOR)
            .group_by(Doctor.id)
            .order_by(func.count(Appointment.id).desc())
            .all()
        )

        upcoming = (
            db.query(Appointment)
            .options(joinedload(Appointment.patient), joinedload(Appointment.doctor))
            .filter(ACTIVE_APPT, Appointment.appointment_date >= today, Appointment.status == "Scheduled")
            .order_by(Appointment.appointment_date.asc(), Appointment.start_time.asc())
            .limit(6)
            .all()
        )
        recent = (
            db.query(Appointment)
            .options(joinedload(Appointment.patient), joinedload(Appointment.doctor))
            .filter(ACTIVE_APPT)
            .order_by(Appointment.created_at.desc(), Appointment.id.desc())
            .limit(6)
            .all()
        )

        return {
            "kpis": {
                "patients": total_patients,
                "doctors": total_doctors,
                "appointments": total_appointments,
                "revenue": float(revenue or 0),
                "growth_pct": growth_pct,
                "utilization": utilization,
                "appointments_today": appts_today,
            },
            "status_distribution": [{"status": s, "count": c} for s, c in status_rows],
            "appointments_trend": [{"date": d.isoformat(), "count": c} for d, c in trend_rows],
            "doctor_workload": [{"doctor": n, "count": c} for n, c in workload_rows],
            "upcoming": [_appt_dict(a) for a in upcoming],
            "recent_activity": [_appt_dict(a) for a in recent],
        }
