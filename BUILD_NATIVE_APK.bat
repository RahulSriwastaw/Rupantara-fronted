@echo off
setlocal

echo ========================================
echo Building APK with Native Firebase Auth
echo Rupantra AI
echo ========================================
echo.

cd /d "c:\Users\angel computer\OneDrive\Desktop\Rupa\Rupantara-fronted"

echo Setting JAVA_HOME...
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo JAVA_HOME: %JAVA_HOME%
echo.

echo ========================================
echo Step 1: Building Debug APK...
echo ========================================

cd android

call gradlew assembleDebug --no-daemon

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Build failed!
    echo ========================================
    echo Trying with daemon stopped...
    call gradlew --stop
    timeout /t 5 /nobreak
    call gradlew assembleDebug
    
    if %errorlevel% neq 0 (
        echo ERROR: Build still failed!
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo ✅ BUILD SUCCESSFUL!
echo ========================================
echo.
echo APK Location:
echo app\build\outputs\apk\debug\app-debug.apk
echo.
echo Full path:
echo c:\Users\angel computer\OneDrive\Desktop\Rupa\Rupantara-fronted\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Uninstall old app from phone
echo 2. Install this new APK
echo 3. Test Google Sign-In (Native Auth!)
echo.
pause

endlocal
