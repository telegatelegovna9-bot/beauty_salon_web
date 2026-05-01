#!/bin/bash
set -e

cd workspace

# Install dependencies
npm install

# Build frontend if needed
if [ -d "frontend" ]; then
    cd frontend
    npm install
    npm run build 2>/dev/null || true
    cd ..
fi

# Start the backend
cd backend
npm install
npm start
