@echo off
rem Run by Windows at start-up and every hour (see Social_Schedule.bat). Posts whatever is left of
rem today's 12 perfumes, one after another, and logs the result.
cd /d "%~dp0"
echo ===== %date% %time% =====>> social_autopost.log
node Social_AutoPost.js --auto >> social_autopost.log 2>&1
