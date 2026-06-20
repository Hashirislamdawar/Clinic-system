"""Pytest fixtures: an isolated in-memory database and an authenticated client."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app


@pytest.fixture()
def client():
    # Fresh in-memory SQLite shared across the app via a single connection.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    # Seed the minimum needed for the tests.
    db = TestingSession()
    db.add_all([
        models.User(full_name="Test Admin", email="admin@test.com",
                    password_hash=hash_password("admin123"), role="Admin"),
        models.User(full_name="Front Desk", email="recep@test.com",
                    password_hash=hash_password("recep123"), role="Receptionist"),
        models.Specialization(name="Cardiology"),
    ])
    db.commit()
    db.close()

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    settings.rate_limit_enabled = False  # don't throttle the test burst

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def auth_headers(client, email="admin@test.com", password="admin123"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
