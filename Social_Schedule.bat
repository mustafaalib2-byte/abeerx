@echo off
rem Turns on daily automatic posting: one perfume at 12:00, 17:00 and 21:00 while this PC is on.
rem Run "Social_Schedule.bat off" to stop it.
cd /d "%~dp0"
if /i "%~1"=="off" goto off
schtasks /Create /F /SC DAILY /ST 12:00 /TN "ABEERX Social Post 1" /TR "\"%~dp0Social_AutoPost_Run.bat\""
schtasks /Create /F /SC DAILY /ST 17:00 /TN "ABEERX Social Post 2" /TR "\"%~dp0Social_AutoPost_Run.bat\""
schtasks /Create /F /SC DAILY /ST 21:00 /TN "ABEERX Social Post 3" /TR "\"%~dp0Social_AutoPost_Run.bat\""
echo.
echo Automatic posting is ON: one perfume at 12:00, 17:00 and 21:00 every day.
echo Results are written to social_autopost.log. Run "Social_Schedule.bat off" to stop.
goto end
:off
schtasks /Delete /F /TN "ABEERX Social Post 1"
schtasks /Delete /F /TN "ABEERX Social Post 2"
schtasks /Delete /F /TN "ABEERX Social Post 3"
echo Automatic posting is OFF.
:end
echo.
pause
