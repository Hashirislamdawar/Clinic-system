"""API tests covering auth, RBAC, CRUD, validation, pagination, conflicts and soft delete."""
from tests.conftest import auth_headers


def _make_doctor(client, h, email="dr@test.com"):
    spec_id = client.get("/api/specializations", headers=h).json()["data"][0]["id"]
    res = client.post("/api/doctors", headers=h, json={
        "full_name": "Dr. Test", "email": email, "specialization_id": spec_id, "consultation_fee": 1000,
    })
    return res.json()["data"]["id"]


def _make_patient(client, h, email="p1@test.com", name="Pat One"):
    res = client.post("/api/patients", headers=h, json={
        "full_name": name, "email": email, "phone": "03001112222", "gender": "Male", "date_of_birth": "1990-01-01",
    })
    return res.json()["data"]["id"]


# --- System / auth --------------------------------------------------------- #
def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["success"] is True


def test_login_and_me(client):
    h = auth_headers(client)
    me = client.get("/api/auth/me", headers=h)
    assert me.status_code == 200
    assert me.json()["data"]["role"] == "Admin"


def test_login_wrong_password(client):
    r = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "nope"})
    assert r.status_code == 401
    assert r.json()["code"] == "INVALID_CREDENTIALS"


def test_patients_require_auth(client):
    r = client.get("/api/patients")
    assert r.status_code == 401


# --- CRUD + validation ----------------------------------------------------- #
def test_create_and_list_patient(client):
    h = auth_headers(client)
    pid = _make_patient(client, h)
    assert pid
    listing = client.get("/api/patients", headers=h).json()
    assert listing["success"] is True
    assert listing["meta"]["total"] == 1
    assert listing["data"][0]["version"] == 1


def test_patient_validation_error(client):
    h = auth_headers(client)
    r = client.post("/api/patients", headers=h, json={
        "full_name": "X", "phone": "03001112222", "gender": "Alien", "date_of_birth": "1990-01-01",
    })
    assert r.status_code == 422
    body = r.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert any(e["field"] == "gender" for e in body["errors"])


# --- RBAC ------------------------------------------------------------------ #
def test_receptionist_cannot_add_doctor(client):
    h = auth_headers(client, email="recep@test.com", password="recep123")
    spec_id = client.get("/api/specializations", headers=h).json()["data"][0]["id"]
    r = client.post("/api/doctors", headers=h, json={
        "full_name": "Dr. No", "email": "no@test.com", "specialization_id": spec_id, "consultation_fee": 0,
    })
    assert r.status_code == 403
    assert r.json()["code"] == "FORBIDDEN"


def test_receptionist_cannot_view_audit(client):
    h = auth_headers(client, email="recep@test.com", password="recep123")
    assert client.get("/api/audit", headers=h).status_code == 403


# --- Business rules -------------------------------------------------------- #
def test_double_booking_conflict(client):
    h = auth_headers(client)
    pid = _make_patient(client, h)
    did = _make_doctor(client, h)
    payload = {"patient_id": pid, "doctor_id": did, "appointment_date": "2025-05-20",
               "start_time": "09:30:00", "status": "Scheduled", "reason": "x"}
    assert client.post("/api/appointments", headers=h, json=payload).status_code == 201
    dup = client.post("/api/appointments", headers=h, json=payload)
    assert dup.status_code == 409
    assert dup.json()["code"] == "SLOT_TAKEN"


def test_pagination_and_search(client):
    h = auth_headers(client)
    _make_patient(client, h, email="a@test.com", name="Alice Adams")
    _make_patient(client, h, email="b@test.com", name="Bob Brown")
    _make_patient(client, h, email="c@test.com", name="Carol Clark")
    page = client.get("/api/patients?page_size=2", headers=h).json()
    assert page["meta"]["total"] == 3
    assert page["meta"]["total_pages"] == 2
    assert len(page["data"]) == 2
    found = client.get("/api/patients?q=bob", headers=h).json()
    assert found["meta"]["total"] == 1
    assert found["data"][0]["full_name"] == "Bob Brown"


def test_soft_delete_and_audit(client):
    h = auth_headers(client)
    pid = _make_patient(client, h)
    assert client.delete(f"/api/patients/{pid}", headers=h).status_code == 200
    # hidden from the list
    assert client.get("/api/patients", headers=h).json()["meta"]["total"] == 0
    # but recorded in the audit trail with the acting user
    audit = client.get("/api/audit", headers=h).json()["data"]
    delete_entry = next(e for e in audit if e["action"] == "delete" and e["entity"] == "patient")
    assert delete_entry["actor"] == "admin@test.com"
