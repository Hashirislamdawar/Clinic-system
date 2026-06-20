# One-command startup — launches the API and the web app in two terminals.
# Usage:  ./start.ps1
$root = $PSScriptRoot

Write-Host "Starting City Clinic..." -ForegroundColor Cyan

# Backend (FastAPI on :8000)
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\backend'; .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"
)

# Frontend (Vite on :5173)
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\frontend'; npm run dev"
)

Write-Host "API  -> http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "App  -> http://localhost:5173" -ForegroundColor Green
Write-Host "Login: admin@cityclinic.com / admin123" -ForegroundColor Yellow
