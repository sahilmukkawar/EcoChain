# PowerShell script to start both frontend and backend servers

# Function to check if a command exists
function Test-CommandExists {
    param ($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Check if Node.js is installed
if (-not (Test-CommandExists "node")) {
    Write-Host "Error: Node.js is not installed. Please install Node.js and try again." -ForegroundColor Red
    exit 1
}

# Set execution policy for this process only
Write-Host "Setting execution policy to RemoteSigned for this process..." -ForegroundColor Yellow
try {
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned -Force
} catch {
    Write-Host "Warning: Could not set execution policy. You may need to run this script as administrator." -ForegroundColor Yellow
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd '$PSScriptRoot'; node server.js" -WindowStyle Normal

# Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# Start frontend server
Write-Host "Starting frontend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd '$PSScriptRoot\client'; npm start" -WindowStyle Normal

Write-Host "Both servers are starting. The React app should open in your browser shortly." -ForegroundColor Cyan
Write-Host "Backend running at: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend running at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C in the respective terminal windows to stop the servers." -ForegroundColor Yellow