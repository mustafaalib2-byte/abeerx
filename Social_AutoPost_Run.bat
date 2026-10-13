@echo off
rem Used by Windows Task Scheduler (see Social_Schedule.bat). Posts one perfume and logs the result.
cd /d "%~dp0"
echo ===== %date% %time% =====>> social_autopost.log
node Social_AutoPost.js >> social_autopost.log 2>&1
