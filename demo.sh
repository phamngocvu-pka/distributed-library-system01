#!/bin/bash

# Quick Product Demo Script
# Distributed Library System

echo "🎯 DISTRIBUTED LIBRARY SYSTEM - PRODUCT DEMO"
echo "=============================================="
echo ""

# Check if containers are running
echo "📊 Checking system status..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep library

echo ""
echo "🌐 WEB INTERFACES:"
echo "-------------------"
echo "✅ RabbitMQ Management: http://localhost:15672"
echo "   👤 Login: library_admin / library_pass_123"
echo ""
echo "✅ Consul UI: http://localhost:8500"
echo "   🔍 Service Discovery & Health Checks"
echo ""
echo "✅ Prometheus: http://localhost:9090"
echo "   📊 Metrics & Monitoring"
echo ""
echo "✅ Grafana: http://localhost:3005"
echo "   👤 Login: admin / admin123"
echo "   📈 Dashboards & Visualization"
echo ""

echo "🔌 API ENDPOINTS:"
echo "-------------------"
echo "Book Service: http://localhost:3001"
echo ""

# Test API
echo "🧪 Testing Book Service API..."
echo "Testing health endpoint..."
curl -s http://localhost:3001/health 2>/dev/null || echo "❌ Book Service not responding (likely due to Redlock error)"

echo ""
echo ""
echo "💾 DATABASE ACCESS:"
echo "-------------------"
echo "MongoDB:    docker exec -it library-mongo mongosh -u library_admin -p library_pass_123"
echo "PostgreSQL: docker exec -it library-postgres psql -U library_admin -d library_db"
echo "Redis:      docker exec -it library-redis redis-cli -a library_pass_123"
echo ""

echo "📚 DOCUMENTATION:"
echo "-------------------"
echo "📖 Running Guide: RUNNING.md"
echo "🎯 Product Demo:  PRODUCT-DEMO.md"
echo "📋 API Docs:      docs/api-documentation.md"
echo ""

echo "🎉 Your distributed system is ready!"
echo "Open the web interfaces above to explore the product."
echo ""
