@echo off
setlocal enabledelayedexpansion

set STATIC_DIR=C:\Users\USER\projects\github\ai-suite\backend\src\main\resources\static
set NGINX_DIR=C:\Users\USER\projects\github\ai-suite\desktop-angular
set DIST_DIR=%NGINX_DIR%\dist\desktop-angular\browser

echo Cleaning static directory...
if exist "%STATIC_DIR%" (
    del /q "%STATIC_DIR%\*" 2>nul
    for /d %%d in ("%STATIC_DIR%\*") do (
        rmdir /s /q "%%d" 2>nul
    )
    echo Static directory cleaned.
) else (
    mkdir "%STATIC_DIR%"
    echo Static directory created.
)

echo.
echo Building Angular application...
cd /d "%NGINX_DIR%"
call npm run build
if errorlevel 1 (
    echo.
    echo ERROR: npm build failed!
    pause
    exit /b 1
)
echo.

echo Moving compiled files to static directory...
if exist "%DIST_DIR%" (
    xcopy /e /y /q "%DIST_DIR%\*" "%STATIC_DIR%\" >nul 2>&1
    echo Files moved successfully.
) else (
    echo ERROR: Distribution directory not found: %DIST_DIR%
    pause
    exit /b 1
)

echo.
echo Building native backend...
cd /d C:\Users\USER\projects\github\ai-suite\backend
call mvn -Pnative clean package -DskipTests
if errorlevel 1 (
    echo.
    echo ERROR: Maven build failed!
    pause
    exit /b 1
)
echo.

echo Starting backend application...
cd /d C:\Users\USER\projects\github\ai-suite\backend
rem java -Dspring.aot.enabled=true -jar target\backend-3.5.0.jar
call mvn -Pnative native:compile