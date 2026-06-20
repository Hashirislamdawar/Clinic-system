from sqlalchemy import desc
from sqlalchemy.orm import joinedload

from ..models import Appointment
from .base import BaseRepository


class AppointmentRepository(BaseRepository):
    model = Appointment
    search_fields = ["reason", "status"]
    soft_delete = True

    def load_options(self):
        return [joinedload(Appointment.patient), joinedload(Appointment.doctor)]

    def default_ordering(self):
        return [desc(Appointment.appointment_date), desc(Appointment.start_time)]

    def by_patient(self, patient_id):
        return self.query().filter(Appointment.patient_id == patient_id).order_by(*self.default_ordering()).all()

    def by_doctor(self, doctor_id):
        return self.query().filter(Appointment.doctor_id == doctor_id).order_by(*self.default_ordering()).all()
