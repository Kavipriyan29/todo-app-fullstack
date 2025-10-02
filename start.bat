@echo off
echo 🚀 Starting Full-Stack Todo Application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚙️ Creating environment file...
    copy .env.example .env
    echo.
    echo ⚠️  Please edit .env file with your MongoDB URI and JWT secret
    echo    Then run this script again.
    pause
    exit /b 1
)

echo ✅ Starting server...
echo.
echo 🌐 Application will be available at: http://localhost:3000
echo 🔐 Login page: http://localhost:3000/login.html
echo 📝 Signup page: http://localhost:3000/signup.html
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
