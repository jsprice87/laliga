#!/bin/bash

# La Liga del Fuego Development Server Startup Script

echo "🏆 Starting La Liga del Fuego Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating a basic one..."
    cat > .env << EOF
# MongoDB Connection (Update with your MongoDB URL)
MONGODB_URI=mongodb://localhost:27017/laliga

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-$(date +%s)

# ESPN API credentials (optional for basic testing)
ESPN_LEAGUE_ID=789298
ESPN_S2=your_espn_s2_cookie
ESPN_SWID=your_espn_swid_cookie
EOF
    echo "✅ Created .env file. Please update MongoDB connection string if needed."
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Stopping servers..."
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo "🚀 Starting API server..."
node api/server.js &
API_PID=$!

# Wait a moment for API server to start
sleep 2

echo "🌐 Starting frontend server..."
cd public
python3 -m http.server 4000 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Development environment is running!"
echo ""
echo "🔗 Dashboard:     http://localhost:4000"
echo "🔗 API Health:    http://localhost:3001/api/health"
echo "🔗 Auth Test:     http://localhost:4000/test-auth.html"
echo ""
echo "📝 To stop: Press Ctrl+C"
echo ""

# Wait for any process to exit
wait