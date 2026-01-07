@echo off
echo ========================================
echo Pushing to GitHub...
echo ========================================
cd /d "%~dp0"

echo.
echo Step 1: Adding all changes...
git add -A
if %errorlevel% neq 0 (
    echo ERROR: git add failed
    pause
    exit /b 1
)

echo.
echo Step 2: Checking status...
git status --short

echo.
echo Step 3: Committing changes...
git commit -m "Fix: Add mock data fallback for templates and improve error handling"
if %errorlevel% neq 0 (
    echo WARNING: Commit may have failed or nothing to commit
)

echo.
echo Step 4: Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Push failed!
    echo ========================================
    echo.
    echo Possible reasons:
    echo 1. Authentication required - use GitHub Desktop or VS Code
    echo 2. Network issue - check internet connection
    echo 3. Remote not configured - run: git remote set-url origin https://github.com/RahulSriwastaw/Rupantara-fronted.git
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo SUCCESS: Push completed!
    echo ========================================
    echo.
    echo Verify at: https://github.com/RahulSriwastaw/Rupantara-fronted
    echo.
)

pause
