@echo off
echo Alto Video Editor - Development Launch
echo ========================================
cd /d "%~dp0"

echo Installing dependencies...
call npm install
if errorlevel 1 goto error

echo Building renderer...
call npx webpack --config webpack.config.js --mode production
if errorlevel 1 goto error

echo Launching Alto...
call npx electron .
goto end

:error
echo Build failed. See error above.
pause
exit /b 1

:end
