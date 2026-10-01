@echo off
cd /d "%~dp0"
echo ===== ABEERX photo refresh =====
echo First a preview (nothing is changed):
echo.
node Refresh_Photos.js --dry
echo.
set /p go=Type y and press Enter to do it for real:
if /i "%go%"=="y" node Refresh_Photos.js
echo.
pause
