@echo off
echo Alto Installer Builder
echo Run this from an elevated (Administrator) command prompt,
echo OR enable Developer Mode in Windows Settings first.
echo ========================================================
cd /d "%~dp0"

set CSC_IDENTITY_AUTO_DISCOVERY=false
set CSC_LINK=

echo Building renderer bundle...
call npx webpack --config webpack.config.js --mode production
if errorlevel 1 goto error

echo Building Windows installer (NSIS)...
call npx electron-builder build --win nsis --publish never
if errorlevel 1 goto error

echo.
echo Installer built successfully!
echo Find it in: %~dp0dist\
dir dist\*.exe 2>nul
goto end

:error
echo.
echo Build failed. If you see a symlink error, run this script as Administrator
echo OR go to: Windows Settings > Privacy ^& Security > For Developers > Developer Mode = ON
pause
exit /b 1

:end
pause
