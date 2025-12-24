@echo off
echo ========================================
echo SHA-1 Fingerprint Generator
echo Rupantra AI Android App
echo ========================================
echo.

echo Looking for Java installation...
echo.

REM Try to find Java in common locations
set "JAVA_EXE="

REM Check Android Studio's bundled JDK
if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_EXE=C:\Program Files\Android\Android Studio\jbr\bin\java.exe"
    echo Found Java in Android Studio: %JAVA_EXE%
    goto :found_java
)

REM Check common JDK locations
for %%i in (
    "C:\Program Files\Java\jdk*\bin\java.exe"
    "C:\Program Files (x86)\Java\jdk*\bin\java.exe"
    "%ProgramFiles%\Eclipse Adoptium\jdk*\bin\java.exe"
) do (
    for /f "delims=" %%j in ('dir /b "%%~i" 2^>nul') do (
        set "JAVA_EXE=%%~dpj\java.exe"
        echo Found Java: !JAVA_EXE!
        goto :found_java
    )
)

REM Try to use system PATH
where java >nul 2>&1
if %errorlevel% equ 0 (
    set "JAVA_EXE=java.exe"
    echo Found Java in PATH
    goto :found_java
)

echo.
echo ========================================
echo WARNING: Java not found!
echo ========================================
echo.
echo Java is required to generate SHA-1 fingerprint.
echo.
echo Please install one of the following:
echo 1. Android Studio (recommended)
echo    Download: https://developer.android.com/studio
echo.
echo 2. Java Development Kit (JDK)
echo    Download: https://adoptium.net/
echo.
echo After installing, run this script again.
echo.
pause
exit /b 1

:found_java
echo.
echo ========================================
echo Generating SHA-1 fingerprint...
echo ========================================
echo.

set "KEYSTORE=%USERPROFILE%\.android\debug.keystore"

if not exist "%KEYSTORE%" (
    echo.
    echo ERROR: Debug keystore not found!
    echo.
    echo Location checked: %KEYSTORE%
    echo.
    echo The keystore is automatically created when you:
    echo 1. Build an Android app in Android Studio
    echo 2. Run: gradlew assembleDebug
    echo.
    echo Please build your Android project first.
    echo.
    pause
    exit /b 1
)

echo Keystore found: %KEYSTORE%
echo.

REM Find keytool
set "KEYTOOL="
if exist "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" (
    set "KEYTOOL=C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
) else (
    where keytool >nul 2>&1
    if %errorlevel% equ 0 (
        set "KEYTOOL=keytool.exe"
    )
)

if not defined KEYTOOL (
    echo ERROR: keytool not found!
    echo Please make sure Android Studio or JDK is properly installed.
    pause
    exit /b 1
)

echo.
echo ========================================
echo DEBUG SHA-1 FINGERPRINT:
echo ========================================

"%KEYTOOL%" -list -v -keystore "%KEYSTORE%" -alias androiddebugkey -storepass android -keypass android 2>nul | findstr "SHA1:"

if %errorlevel% neq 0 (
    echo.
    echo Could not extract SHA-1. Showing full certificate info:
    echo.
    "%KEYTOOL%" -list -v -keystore "%KEYSTORE%" -alias androiddebugkey -storepass android -keypass android
)

echo.
echo ========================================
echo INSTRUCTIONS:
echo ========================================
echo.
echo 1. Copy the SHA-1 fingerprint shown above
echo    (Format: SHA1: XX:XX:XX:XX:...)
echo.
echo 2. Go to Firebase Console:
echo    https://console.firebase.google.com/
echo.
echo 3. Select project: rupantra-ai
echo.
echo 4. Click gear icon (Settings) → Project settings
echo.
echo 5. Scroll to "Your apps" → Android app
echo.
echo 6. Find "SHA certificate fingerprints"
echo.
echo 7. Click "Add fingerprint"
echo.
echo 8. Paste the SHA-1 and Save
echo.
echo ========================================
echo.
pause
