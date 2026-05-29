@echo off
setlocal enabledelayedexpansion

set ANGULAR_DIR=C:\Users\Focare\projects\ai-suite\desktop-angular
set DIST_DIR=%ANGULAR_DIR%\dist\desktop-angular\browser
set STATIC_DIR=C:\Users\Focare\projects\ai-suite\backend\src\main\resources\static

echo ============================================
echo Build and Deploy Angular to Static
echo ============================================

echo.
echo [1/3] Compiling Angular project...
cd /d "%ANGULAR_DIR%"
call npm run build
if errorlevel 1 (
  echo.
  echo [ERROR] Angular build failed!
  pause
  exit /b 1
)

echo.
echo [2/3] Cleaning static directory...
if exist "%STATIC_DIR%" (
  del /q "%STATIC_DIR%\*"
  for /d %%i in ("%STATIC_DIR%\*") do rd /s /q "%%i"
)
if not exist "%STATIC_DIR%" mkdir "%STATIC_DIR%"

echo.
echo [3/3] Moving dist files to static...
xcopy "%DIST_DIR%\*" "%STATIC_DIR%\" /e /i /q /y
if errorlevel 1 (
  echo.
  echo [ERROR] Failed to move files to static directory!
  pause
  exit /b 1
)

echo.
echo ============================================
echo [OK] Build and deploy completed successfully!
echo ============================================
pause
