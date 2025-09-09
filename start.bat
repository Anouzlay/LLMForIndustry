@echo off
REM Document-Grounded Chatbot Startup Script for Windows

echo 🚀 Starting Document-Grounded Chatbot...
echo ==================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Setup backend
echo.
echo 🔧 Setting up backend...
cd backend

REM Check if virtual environment exists, create if not
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo ⚠️  .env file not found. Please create one with your OpenAI API key.
    echo You can copy from env.example and fill in your values.
    echo Then run: python setup.py
    pause
    exit /b 1
)

REM Run setup if needed
findstr /C:"ASSISTANT_ID=" .env >nul
if errorlevel 1 (
    echo 🔧 Running initial setup...
    python setup.py
) else (
    findstr /C:"VECTOR_STORE_ID=" .env >nul
    if errorlevel 1 (
        echo 🔧 Running initial setup...
        python setup.py
    )
)

REM Start backend in background
echo 🚀 Starting backend server...
start /B python run.py

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Setup frontend
echo.
echo 🔧 Setting up frontend...
cd ..\frontend

REM Install dependencies
echo Installing Node.js dependencies...
npm install

REM Start frontend
echo 🚀 Starting frontend server...
start /B npm run dev

echo.
echo 🎉 Application started successfully!
echo ==================================
echo 📡 Backend API: http://localhost:8001
echo 🌐 Frontend: http://localhost:3001
echo 📚 API Docs: http://localhost:8001/docs
echo.
echo 🛑 Press any key to stop both servers

pause >nul

REM Stop processes (this is a simplified approach)
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

echo ✅ Servers stopped
