#!/bin/bash

# Deployment Script for Distributed Library System

set -e

echo "========================================="
echo "🚀 Deploying Distributed Library System"
echo "========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose pull

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old volumes (optional - comment out if you want to preserve data)
# echo "🗑️  Removing old volumes..."
# docker-compose down -v

# Build custom images
echo "🔨 Building custom images..."
docker-compose build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check health
echo "🏥 Running health checks..."
bash ./scripts/health-check.sh

echo ""
echo "========================================="
echo "✅ Deployment completed successfully!"
echo "========================================="
echo ""
echo "Access points:"
echo "  - API Gateway: http://localhost:3000"
echo "  - Grafana: http://localhost:3005 (admin/admin123)"
echo "  - Kibana: http://localhost:5601"
echo "  - Consul: http://localhost:8500"
echo "  - RabbitMQ: http://localhost:15672 (library_admin/library_pass_123)"
echo "  - Prometheus: http://localhost:9090"
echo ""
echo "To view logs: docker-compose logs -f [service-name]"
echo "To stop: docker-compose down"
echo "========================================="
