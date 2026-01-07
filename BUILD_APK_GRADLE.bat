@echo off
echo ========================================
echo Building APK with Latest Changes
echo Rupantra AI
echo ========================================
echo.

cd /d "c:\Users\angel computer\OneDrive\Desktop\Rupa\Rupantara-fronted"

echo Setting JAVA_HOME...
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
echo JAVA_HOME: %JAVA_HOME%
echo.

echo Navigating to android directory...
cd android

echo.
echo ========================================
echo Step 1: Cleaning previous builds...
echo ========================================
call gradlew clean
if %errorlevel% neq 0 (
    echo ERROR: Clean failed!
    pause
    exit /b 1
)
echo ✅ Clean complete!
echo.

echo ========================================
echo Step 2: Building Debug APK...
echo ========================================
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ BUILD SUCCESSFUL!
echo ========================================
echo.
echo APK Location:
echo android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Full path:
echo c:\Users\angel computer\OneDrive\Desktop\Rupa\Rupantara-fronted\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Uninstall old app from phone
echo 2. Install this new APK
echo 3. Test Google Sign-In
echo.
pause
