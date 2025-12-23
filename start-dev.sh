#!/bin/bash

# Quick start script for local development

echo "🚀 Starting Firebase Emulators + Dev Server..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Start Firebase emulators
echo "📦 Starting Firebase emulators in Docker..."
docker-compose up -d

# Wait for emulators to initialize
echo "⏳ Waiting for emulators to initialize (60 seconds)..."
sleep 60

# Check if emulators are running
if docker ps | grep -q firebase-emulators; then
    echo "✅ Firebase emulators are running!"
    echo ""
    echo "   📱 Emulator UI: http://localhost:4000"
    echo "   🔐 Auth Emulator: http://localhost:9099"
    echo "   🗄️  Firestore Emulator: http://localhost:8080"
    echo ""
else
    echo "❌ Failed to start emulators. Check logs with: docker logs activity-app-firebase-emulators-1"
    exit 1
fi

# Start dev server
echo "🌐 Starting Vite dev server..."
echo ""
npm run dev
