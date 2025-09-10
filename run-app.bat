@echo off
echo Starting EcoChain Application...

echo Setting up environment...
cd /d "%~dp0"

echo Starting backend server...
start cmd /k "node server.js"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting frontend server...
cd client
start cmd /k "npm start"

echo Both servers are starting. The React app should open in your browser shortly.
echo Backend running at: http://localhost:3001
echo Frontend running at: http://localhost:3000
echo Press Ctrl+C in the respective terminal windows to stop the servers.