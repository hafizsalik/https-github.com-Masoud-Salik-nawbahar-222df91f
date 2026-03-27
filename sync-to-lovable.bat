@echo off
echo 🚀 Syncing changes to upstream repository...
echo.

echo 📋 Step 1: Pushing to your fork...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Failed to push to fork
    pause
    exit /b 1
)

echo ✅ Pushed to fork successfully
echo.

echo 📋 Step 2: Creating pull request to upstream...
echo 📍 You need to:
echo 1. Go to: https://github.com/hafizsalik/nawbahar-222df91f
echo 2. Click "Compare & pull request"
echo 3. Select "Masoud-Salik:main" as head
echo 4. Create pull request
echo.

echo 🎯 Alternative: Point Lovable to your fork:
echo 1. Go to Lovable dashboard
echo 2. Update repository to: https://github.com/Masoud-Salik/nawbahar-222df91f
echo 3. Select branch: main
echo 4. Deploy
echo.

echo ✅ Sync process completed!
echo 🔄 Check Lovable deployment status...
pause
