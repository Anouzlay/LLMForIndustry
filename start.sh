#!/bin/bash

# Document-Grounded Chatbot Startup Script

echo "🚀 Starting Document-Grounded Chatbot..."
echo "=================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup backend
echo ""
echo "🔧 Setting up backend..."
cd backend

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create one with your OpenAI API key."
    echo "You can copy from env.example and fill in your values."
    echo "Then run: python setup.py"
    exit 1
fi

# Run setup if needed
if ! grep -q "ASSISTANT_ID=" .env || ! grep -q "VECTOR_STORE_ID=" .env; then
    echo "🔧 Running initial setup..."
    python setup.py
fi

# Start backend in background
echo "🚀 Starting backend server..."
python run.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Setup frontend
echo ""
echo "🔧 Setting up frontend..."
cd ../frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Start frontend
echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Application started successfully!"
echo "=================================="
echo "📡 Backend API: http://localhost:8001"
echo "🌐 Frontend: http://localhost:3001"
echo "📚 API Docs: http://localhost:8001/docs"
echo ""
echo "🛑 Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
