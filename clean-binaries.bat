@echo off
setlocal enabledelayedexpansion

set STATIC_DIR=C:\Users\Focare\projects\ai-suite\backend\src\main\resources\static
set NGINX_DIR=C:\Users\Focare\projects\ai-suite\desktop-angular
set DIST_DIR=%NGINX_DIR%\dist\desktop-angular\browser
set BACKEND_DIR=C:\Users\Focare\projects\ai-suite\backend

echo ============================================
echo Building Agentic AI Suite
echo ============================================

echo.
echo [1/4] Cleaning static directory...
if exist "%STATIC_DIR%" (
    del /q "%STATIC_DIR%\*" 2>nul
    for /d %%d in ("%STATIC_DIR%\*") do (
        rmdir /s /q "%%d" 2>nul
    )
    echo [OK] Static directory cleaned.
) else (
    mkdir "%STATIC_DIR%" 2>nul
    echo [OK] Static directory created.
)

echo.
echo [2/4] Building Angular application...
cd /d "%NGINX_DIR%"
call npm run build
if errorlevel 1 (
    echo.
    echo [ERROR] npm build failed!
    pause
    exit /b 1
)
echo [OK] Angular build completed.

echo.
echo [3/4] Moving compiled files to static directory...
if exist "%DIST_DIR%" (
    xcopy /e /y /q "%DIST_DIR%\*" "%STATIC_DIR%\" >nul 2>&1
    echo [OK] Files moved to static directory.
) else (
    echo [ERROR] Distribution directory not found: %DIST_DIR%
    pause
    exit /b 1
)

echo.
echo [4/4] Building native backend executable...
echo [INFO] This may take 10-30+ minutes on first build...
cd /d "%BACKEND_DIR%"
call mvn -Pnative clean package -DskipTests
if errorlevel 1 (
    echo.
    echo [ERROR] Maven native build failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo [OK] Build completed successfully!
echo Executable: %BACKEND_DIR%\target\agentic.exe
echo ============================================
pause