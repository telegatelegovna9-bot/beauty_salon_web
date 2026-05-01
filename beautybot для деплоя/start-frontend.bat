@echo off
echo Starting Beauty Studio Frontend on https://unslain-hai-unprimitively.ngrok-free.dev
echo.
echo Backend API: http://localhost:3001/api
echo Frontend:    http://localhost:3000
echo.
echo For testing open: http://localhost:3000?user_id=539246472
echo.
cd /d "%~dp0frontend"
npx serve -s . -l 3000
pause
