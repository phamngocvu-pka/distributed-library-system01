#!/bin/bash

# Health Check Script for Distributed Library System
# Checks the health of all services and dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICES=(
    "book-service:3001"
    "user-service:3002"
    "borrowing-service:3003"
    "notification-service:3004"
)

INFRASTRUCTURE=(
    "postgres:5432"
    "mongodb:27017"
    "redis:6379"
    "rabbitmq:15672"
    "kafka:9092"
    "consul:8500"
    "prometheus:9090"
    "grafana:3005"
    "elasticsearch:9200"
    "kibana:5601"
)

HEALTHY=0
UNHEALTHY=0

echo "========================================="
echo "🏥 Distributed Library System Health Check"
echo "========================================="
echo ""

# Function to check HTTP endpoint
check_http() {
    local name=$1
    local url=$2
    
    if curl -sf "${url}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${name} is healthy${NC}"
        ((HEALTHY++))
        return 0
    else
        echo -e "${RED}❌ ${name} is unhealthy${NC}"
        ((UNHEALTHY++))
        return 1
    fi
}

# Function to check TCP port
check_port() {
    local name=$1
    local host=$2
    local port=$3
    
    if timeout 2 bash -c "cat < /dev/null > /dev/tcp/${host}/${port}" 2>/dev/null; then
        echo -e "${GREEN}✅ ${name} (${host}:${port}) is reachable${NC}"
        ((HEALTHY++))
        return 0
    else
        echo -e "${RED}❌ ${name} (${host}:${port}) is unreachable${NC}"
        ((UNHEALTHY++))
        return 1
    fi
}

# Check Microservices
echo "🔍 Checking Microservices..."
echo "----------------------------"
for service in "${SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$service"
    check_http "${name}" "http://localhost:${port}/health"
done
echo ""

# Check Infrastructure Components
echo "🔍 Checking Infrastructure..."
echo "----------------------------"

# PostgreSQL
check_port "PostgreSQL" "localhost" "5432"

# MongoDB
check_port "MongoDB" "localhost" "27017"

# Redis
check_port "Redis" "localhost" "6379"

# RabbitMQ
check_http "RabbitMQ" "http://localhost:15672"

# Kafka
check_port "Kafka" "localhost" "9092"

# Consul
check_http "Consul" "http://localhost:8500/v1/status/leader"

# Prometheus
check_http "Prometheus" "http://localhost:9090/-/healthy"

# Grafana
check_http "Grafana" "http://localhost:3005/api/health"

# Elasticsearch
check_http "Elasticsearch" "http://localhost:9200/_cluster/health"

# Kibana
check_http "Kibana" "http://localhost:5601/api/status"

echo ""
echo "========================================="
echo "📊 Health Check Summary"
echo "========================================="
echo -e "${GREEN}Healthy services: ${HEALTHY}${NC}"
echo -e "${RED}Unhealthy services: ${UNHEALTHY}${NC}"
echo "========================================="

# Exit with error if any service is unhealthy
if [ ${UNHEALTHY} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some services are unhealthy. Please check the logs.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All services are healthy!${NC}"
    exit 0
fi
