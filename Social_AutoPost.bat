@echo off
cd /d "%~dp0"
echo ===== ABEERX Instagram + Facebook posting =====
echo First a preview (nothing is posted):
echo.
node Social_AutoPost.js --dry
if errorlevel 1 (
  echo.
  echo The preview did not work, so nothing will be posted. Send the message above to Claude, or try again in a minute.
  echo.
  pause
  exit /b 1
)
echo.
set /p go=Type y and press Enter to post this perfume for real: 
if /i "%go%"=="y" node Social_AutoPost.js
echo.
pause
