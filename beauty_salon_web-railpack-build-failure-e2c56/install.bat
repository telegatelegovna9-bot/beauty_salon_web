@echo off
echo ============================================
echo   Beauty Studio — Install Dependencies
echo ============================================
echo.

echo [1/2] Installing backend dependencies...
cd /d "%~dp0backend"
npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend install failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Installing bot dependencies...
cd /d "%~dp0bot"
npm install
if %errorlevel% neq 0 (
    echo ERROR: Bot install failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Installation complete!
echo ============================================
echo.
echo Next steps:
echo 1. Edit backend\.env with your BOT_TOKEN and ADMIN_TELEGRAM_ID
echo 2. Double-click start-backend.bat
echo 3. Double-click start-bot.bat
echo 4. Double-click start-frontend.bat
echo 5. Open http://localhost:3000?user_id=YOUR_TELEGRAM_ID
echo.
pause
