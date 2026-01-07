@echo off
echo ========================================
echo Rupantra AI - APK Build Script
echo ========================================
echo.

cd /d "c:\Users\angel computer\OneDrive\Desktop\Rupa\Rupantara-fronted"

echo Step 1: Building Next.js app...
echo ========================================
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Next.js build failed!
    pause
    exit /b 1
)
echo ✅ Next.js build complete!
echo.

echo Step 2: Syncing Capacitor...
echo ========================================
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo ✅ Capacitor sync complete!
echo.

echo Step 3: Copying Capacitor assets...
echo ========================================
call npx cap copy android
echo ✅ Assets copied!
echo.

echo ========================================
echo BUILD READY!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npx cap open android
echo 2. In Android Studio:
echo    a. Build ^> Clean Project
echo    b. Build ^> Rebuild Project
echo    c. Build ^> Build Bundle(s)/APK(s) ^> Build APK(s)
echo.
echo OR run APK directly on device:
echo    a. Connect Android device via USB
echo    b. Enable USB debugging
echo    c. Click "Run" in Android Studio
echo.

choice /C YN /M "Do you want to open Android Studio now"
if errorlevel 2 goto end
if errorlevel 1 goto openAndroidStudio

:openAndroidStudio
echo Opening Android Studio...
call npx cap open android

:end
echo.
echo ========================================
echo DONE!
echo ========================================
pause
