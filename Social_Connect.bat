@echo off
cd /d "%~dp0"
echo ===== ABEERX: connect Instagram + Facebook (one time) =====
echo.
node Social_AutoPost.js --connect
if errorlevel 1 goto end
echo.
node Social_AutoPost.js --check
:end
echo.
pause
