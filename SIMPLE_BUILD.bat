@echo off
setlocal

echo ========================================
echo Simple APK Builder
echo Rupantra AI - Command Line Build
echo ========================================
echo.

cd /d "c:\Users\angel computer\OneDrive\Desktop\Rupa\Rupantara-fronted"

echo Step 1: Building Next.js...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Next.js build failed!
    pause
    exit /b 1
)
echo ✅ Next.js build complete
echo.

echo Step 2: Copying to Android...
call npx cap copy android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor copy failed!
    pause
    exit /b 1
)
echo ✅ Capacitor copy complete
echo.

echo Step 3: Building APK...
echo Setting JAVA_HOME...
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME: %JAVA_HOME%
echo.

cd android
call gradlew assembleDebug

if %errorlevel% neq 0 (
    echo.
    echo ERROR: APK build failed!
    echo Try: Open in Android Studio and build there
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ APK BUILD SUCCESSFUL!
echo ========================================
echo.
echo APK Location:
echo app\build\outputs\apk\debug\app-debug.apk
echo.
echo Full path:
echo c:\Users\angel computer\OneDrive\Desktop\Rupa\Rupantara-fronted\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo ========================================
echo Next: Install on phone and test!
echo ========================================
echo.
pause

endlocal
