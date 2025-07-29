#!/bin/bash

echo "🐳 Rebuilding Docker containers with cache clearing..."

# Stop all containers
echo "Stopping containers..."
docker-compose down

# Remove specific containers and images to force rebuild
echo "Removing old containers and images..."
docker container prune -f
docker image rm monopolytracker_frontend:latest 2>/dev/null || true
docker image rm monopolytracker-frontend:latest 2>/dev/null || true

# Clear Docker build cache
echo "Clearing Docker build cache..."
docker builder prune -f

# Rebuild without cache
echo "Rebuilding containers without cache..."
docker-compose build --no-cache frontend

# Start containers
echo "Starting containers..."
docker-compose up -d

echo "✅ Docker rebuild complete!"
echo "📍 Access your app at: http://monopolytracker.local"
echo "🔍 Check build hash with: docker exec monopolytracker_frontend_1 ls -la /usr/share/nginx/html/static/js/"