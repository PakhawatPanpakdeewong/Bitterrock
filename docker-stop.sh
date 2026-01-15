#!/bin/bash

# Docker Stop Script for Bitterrock Application

set -e

echo "🛑 Stopping Bitterrock Docker containers..."

# Check if .docker.env exists
if [ ! -f .docker.env ]; then
    echo "⚠️  .docker.env file not found. Using default configuration..."
fi

# Load environment variables if exists
if [ -f .docker.env ]; then
    export $(cat .docker.env | grep -v '^#' | xargs)
fi

# Check mode
MODE=${1:-production}

if [ "$MODE" = "dev" ]; then
    echo "🔧 Stopping DEVELOPMENT containers..."
    docker-compose -f docker-compose.dev.yml down
else
    echo "🚀 Stopping PRODUCTION containers..."
    docker-compose down
fi

echo "✅ Containers stopped successfully!"



