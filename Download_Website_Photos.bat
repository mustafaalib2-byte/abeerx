@echo off
cd /d "%~dp0"
echo ===== Download all website photos =====
echo This only copies photos to your Desktop\Website_Photos folder. Nothing on the website is changed.
echo.
node Download_Website_Photos.js
echo.
pause
