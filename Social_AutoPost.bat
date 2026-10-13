@echo off
cd /d "%~dp0"
echo ===== ABEERX Instagram + Facebook posting =====
echo First a preview (nothing is posted):
echo.
node Social_AutoPost.js --dry
echo.
set /p go=Type y and press Enter to post this perfume for real: 
if /i "%go%"=="y" node Social_AutoPost.js
echo.
pause
