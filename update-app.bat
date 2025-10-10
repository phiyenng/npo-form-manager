@echo off
echo ========================================
echo    UPDATING NPO FORM MANAGER
echo ========================================
cd /d "C:\Users\Administrator\Documents\npo-form-manager"

echo.
echo [1/4] Stopping PM2...
npx pm2 stop npo-form-manager
if %errorlevel% neq 0 (
    echo Warning: PM2 stop failed or app not running
)

echo.
echo [2/4] Cleaning old build...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo [3/4] Building new version...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [4/4] Starting PM2...
npx pm2 start ecosystem.config.js
if %errorlevel% neq 0 (
    echo ERROR: PM2 start failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    UPDATE COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo App is running at: https://115.78.100.151/zte-customers-support/
echo.
pause