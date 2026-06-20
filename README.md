# City Clinic — Care Platform

A production-grade healthcare client-management platform built for the
**CSE-403L DBMS Lab — CQI Open-Ended Activity**. It manages patients, doctors and
appointments on a **normalized, audited PostgreSQL schema**, behind a layered
FastAPI backend with **JWT authentication & role-based access**, and a premium
React single-page application.

> **Demo login:** `admin@cityclinic.com` / `admin123`

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 18 · Vite · React Router · Framer Motion · Recharts · Lucide |
| Backend / API | Python · FastAPI (layered: routers → services → repositories) |
| ORM / DB | SQLAlchemy 2 · PostgreSQL (SQLite for zero-setup dev) |
| Auth | JWT (PyJWT) · bcrypt password hashing · RBAC |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Tests | pytest |

---

## Features

- **Authentication & roles** — JWT login; three roles (**Admin / Doctor / Receptionist**)
  with role-based access enforced on every endpoint.
- **Live analytics dashboard** — KPIs (patients, doctors, revenue, growth, utilization),
  appointment-trend, status-distribution and doctor-workload charts, upcoming visits and
  an activity feed.
- **Full CRUD** for patients, doctors and appointments with **search, sort, filtering and
  pagination**.
- **Patient & doctor profile pages** — stats + full appointment history.
- **Double-booking prevention** — a DB unique constraint plus live in-form conflict
  detection.
- **Soft delete, timestamps & optimistic-locking version columns** on core entities.
- **Audit trail** — every create/update/delete is recorded with the acting user
  (Admin-only viewer).
- **CSV export** on every table.
- **Consistent API envelope** — `{ success, message, data, meta }`, with rich error codes.
- **Cross-cutting backend** — centralized exception handling, request logging,
  rate limiting, in-memory caching, environment-based config.
- Premium responsive UI with a full design system, animations, toasts, skeletons and
  empty/loading states.

---

## Project structure

```
DBMS/
├── start.ps1                     # one-command startup (backend + frontend)
├── backend/
│   ├── app/
│   │   ├── main.py               # app factory: middleware, exception handlers, routers
│   │   ├── core/                 # config · logging · exceptions · responses · pagination
│   │   │                         #   · cache · security (JWT/bcrypt) · deps (auth/RBAC)
│   │   ├── db/                   # base · session · mixins (timestamps, soft delete)
│   │   ├── models/               # ORM models — one file per entity
│   │   ├── schemas/              # Pydantic schemas + generic response envelopes
│   │   ├── repositories/         # data access (generic BaseRepository + per entity)
│   │   ├── services/             # business logic (auth, patients, doctors, …)
│   │   ├── middleware/           # request logging · rate limiting
│   │   ├── routers/              # thin HTTP handlers
│   │   └── seed.py               # sample data + demo users
│   ├── alembic/                  # database migrations
│   ├── tests/                    # pytest API suite
│   ├── schema.sql                # PostgreSQL DDL  ← database-script deliverable
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── pages/                # Login, Dashboard, Patients(+Profile), Doctors(+Profile),
│       │                         #   Appointments, Audit
│       ├── components/ui/        # Button, Card, Badge, Modal, Toast, DataTable, Field, …
│       ├── components/layout/    # AppShell (sidebar + topbar)
│       ├── context/AuthContext   # auth state + token handling
│       ├── lib/                  # api · format · export
│       └── index.css             # design system (tokens + components)
├── LAB_REPORT.md                 # the report deliverable
└── README.md
```

---

## Quick start

### Option A — one command (Windows)

```powershell
./start.ps1
```

Launches the API (`:8000`) and the web app (`:5173`) in two terminals.

> First time only: create the venv + install deps (see Option B steps 1–2) and run
> `npm install` in `frontend/`, plus `python -m app.seed` to create the demo data.

### Option B — manual (two terminals)

**Backend**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m app.seed          # creates clinic.db + demo users/data
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

**Frontend**
```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173> and sign in with a demo account below.
Interactive API docs: <http://127.0.0.1:8000/docs>.

### Demo accounts

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | `admin@cityclinic.com` | `admin123` |
| Doctor | `doctor@cityclinic.com` | `doctor123` |
| Receptionist | `reception@cityclinic.com` | `reception123` |

---

## Running against PostgreSQL

1. Create the database & user (`psql`):
   ```sql
   CREATE DATABASE clinic_db;
   CREATE USER clinic_user WITH PASSWORD 'clinic_pass';
   GRANT ALL PRIVILEGES ON DATABASE clinic_db TO clinic_user;
   ```
2. Build the schema — either load the DDL directly **or** run the migrations:
   ```powershell
   psql -U clinic_user -d clinic_db -f backend/schema.sql      # option 1: raw DDL
   # — or —
   cd backend; $env:DATABASE_URL="postgresql+psycopg://clinic_user:clinic_pass@localhost:5432/clinic_db"
   .\.venv\Scripts\python.exe -m alembic upgrade head           # option 2: Alembic
   ```
3. Point the app at it — copy `backend/.env.example` to `backend/.env` and set:
   ```
   DATABASE_URL=postgresql+psycopg://clinic_user:clinic_pass@localhost:5432/clinic_db
   ```
4. Seed demo data with `python -m app.seed`. No code changes — SQLAlchemy handles the
   dialect switch.

> **Note:** for zero-setup dev the app also calls `create_all` on startup. If you manage
> the schema with Alembic on an existing `create_all` database, run
> `alembic stamp head` once so Alembic knows the schema is already present.

---

## Testing

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
```

The suite (`backend/tests/`) covers auth, RBAC, CRUD, validation, pagination/search,
double-booking conflict and soft-delete + audit, against an isolated in-memory database.

---

## API overview

All responses use the envelope `{ success, message, data, meta? }`; list endpoints accept
`page`, `page_size`, `sort`, `order` and `q`.

| Area | Endpoints |
| ---- | --------- |
| Auth | `POST /api/auth/login` · `POST /api/auth/register` (Admin) · `GET /api/auth/me` |
| Analytics | `GET /api/analytics/overview` |
| Patients | `GET/POST/PUT/DELETE /api/patients[/{id}]` · `GET /api/patients/{id}/profile` |
| Doctors | `GET/POST/PUT/DELETE /api/doctors[/{id}]` · `GET /api/doctors/{id}/profile` |
| Appointments | `GET/POST/PUT/DELETE /api/appointments[/{id}]` |
| Lookups | `GET/POST /api/specializations` |
| Audit | `GET /api/audit` (Admin) |

Full, interactive documentation is auto-generated at **`/docs`** (with an *Authorize*
button for the bearer token).
