@echo off
rem Turns on automatic posting: 12 perfumes a day (SOCIAL_POSTS_PER_DAY in .env.local), posted one
rem after another as soon as Windows starts. It also checks every hour, so if the PC stays on past
rem midnight the next day's posts still go out. Once the day's posts are done, it waits for tomorrow.
rem Run "Social_Schedule.bat off" to stop it.
cd /d "%~dp0"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "HIDDEN=%~dp0Social_AutoPost_Hidden.vbs"
rem Remove the older fixed-time tasks so nothing posts twice.
for %%n in (1 2 3) do schtasks /Delete /F /TN "ABEERX Social Post %%n" >nul 2>&1
if /i "%~1"=="off" goto off

rem A small helper that runs the posting in the background, without a black window.
> "%HIDDEN%" echo CreateObject("WScript.Shell").Run """%~dp0Social_AutoPost_Run.bat""", 0, False
rem 1) when Windows starts
copy /Y "%HIDDEN%" "%STARTUP%\ABEERX Social Post.vbs" >nul
rem 2) every hour while the PC is on
schtasks /Create /F /SC HOURLY /MO 1 /TN "ABEERX Social Post" /TR "wscript.exe \"%HIDDEN%\""
if errorlevel 1 goto failed
if not exist "%STARTUP%\ABEERX Social Post.vbs" goto failed
echo.
echo Automatic posting is ON: 12 perfumes a day, posted as soon as the PC is on.
echo Posting starts now in the background. Results are written to social_autopost.log.
echo Run "Social_Schedule.bat off" to stop.
wscript.exe "%HIDDEN%"
goto end

:off
schtasks /Delete /F /TN "ABEERX Social Post" >nul 2>&1
del "%STARTUP%\ABEERX Social Post.vbs" >nul 2>&1
echo Automatic posting is OFF.
goto end

:failed
echo.
echo Something went wrong while turning it on. Send a screenshot of this window to Claude.

:end
echo.
pause
