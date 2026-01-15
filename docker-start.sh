#!/bin/bash

# Docker Start Script for Bitterrock Application

set -e

echo "🐳 Starting Bitterrock with Docker..."

# Check if .docker.env exists
if [ ! -f .docker.env ]; then
    echo "⚠️  .docker.env file not found. Creating from .docker.env.example..."
    if [ -f .docker.env.example ]; then
        cp .docker.env.example .docker.env
        echo "✅ Created .docker.env file. Please edit it with your configuration."
    else
        echo "❌ .docker.env.example not found. Please create .docker.env manually."
        exit 1
    fi
fi

# Load environment variables
export $(cat .docker.env | grep -v '^#' | xargs)

# Check if running in production or development mode
MODE=${1:-production}

if [ "$MODE" = "dev" ]; then
    echo "🔧 Starting in DEVELOPMENT mode..."
    docker-compose -f docker-compose.dev.yml up --build
else
    echo "🚀 Starting in PRODUCTION mode..."
    docker-compose up --build -d
    echo ""
    echo "✅ Application started successfully!"
    echo "📱 Application URL: ${NEXT_PUBLIC_APP_URL:-http://localhost:3001}"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
fi



