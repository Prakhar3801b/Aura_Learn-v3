@echo off
title Aura Learn V3 - Server Launcher

echo ==========================================
echo   Aura Learn V3 - Starting Servers...
echo ==========================================
echo.

:: Start Backend (FastAPI) in a new window
echo [1/2] Starting Backend on http://localhost:8000 ...
start "Aura Learn - Backend" cmd /k "cd /d "%~dp0backend" && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Wait a moment before starting frontend
timeout /t 2 /nobreak >nul

:: Start Frontend (Next.js) in a new window
echo [2/2] Starting Frontend on http://localhost:3000 ...
start "Aura Learn - Frontend" cmd /k "cd /d "%~dp0frontend" && node node_modules/next/dist/bin/next dev"

echo.
echo ==========================================
echo   Servers are starting in new windows!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ==========================================
echo.
pause
