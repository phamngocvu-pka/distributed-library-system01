#!/bin/bash

echo "🔍 KIỂM TRA HỆ THỐNG - DISTRIBUTED LIBRARY SYSTEM"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Test 1: Container Status
echo "📦 TEST 1: Container Status"
echo "----------------------------"
CONTAINERS=$(docker ps -a --filter "name=library-" --format "{{.Names}}\t{{.Status}}")
echo "$CONTAINERS"
DOWN_CONTAINERS=$(echo "$CONTAINERS" | grep -v "Up" | wc -l)
if [ $DOWN_CONTAINERS -gt 0 ]; then
    echo -e "${RED}❌ Có $DOWN_CONTAINERS containers không chạy${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Tất cả containers đang chạy${NC}"
fi
echo ""

# Test 2: Health Checks
echo "🏥 TEST 2: Health Checks"
echo "-------------------------"

# Book Service Health
echo -n "Book Service: "
HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"status":"UP"'; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# MongoDB
echo -n "MongoDB: "
if docker exec library-mongo mongosh --quiet --eval "db.adminCommand('ping')" -u library_admin -p library_pass_123 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# PostgreSQL
echo -n "PostgreSQL: "
if docker exec library-postgres pg_isready -U library_admin > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Redis
echo -n "Redis: "
if docker exec library-redis redis-cli -a library_pass_123 ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# RabbitMQ
echo -n "RabbitMQ: "
if curl -s -u library_admin:library_pass_123 http://localhost:15672/api/overview 2>/dev/null | grep -q "rabbitmq_version"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Consul
echo -n "Consul: "
if curl -s http://localhost:8500/v1/status/leader 2>/dev/null | grep -q ":"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Test 3: API Endpoints
echo "🔌 TEST 3: API Endpoints"
echo "-------------------------"

# GET /api/books
echo -n "GET /api/books: "
BOOKS_RESPONSE=$(curl -s http://localhost:3001/api/books)
if echo "$BOOKS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

# GET /api/books/available
echo -n "GET /api/books/available: "
AVAILABLE_RESPONSE=$(curl -s http://localhost:3001/api/books/available)
if echo "$AVAILABLE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Test 4: Log Errors
echo "📋 TEST 4: Recent Errors in Logs"
echo "----------------------------------"
ERROR_COUNT=$(docker logs library-book-service --tail 100 2>&1 | grep -i "error" | grep -v "KafkaJS" | wc -l)
if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Tìm thấy $ERROR_COUNT errors (không bao gồm Kafka)${NC}"
    WARNINGS=$((WARNINGS + 1))
    docker logs library-book-service --tail 100 2>&1 | grep -i "error" | grep -v "KafkaJS" | tail -5
else
    echo -e "${GREEN}✅ Không có errors${NC}"
fi

KAFKA_ERRORS=$(docker logs library-book-service --tail 100 2>&1 | grep -i "KafkaJS.*error" | wc -l)
if [ $KAFKA_ERRORS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Kafka có $KAFKA_ERRORS errors (không quan trọng nếu service vẫn chạy)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Test 5: Performance
echo "⚡ TEST 5: Performance Check"
echo "-----------------------------"
echo -n "API Response Time: "
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3001/health)
echo "${RESPONSE_TIME}s"
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    echo -e "${GREEN}✅ Nhanh (<1s)${NC}"
elif (( $(echo "$RESPONSE_TIME < 3.0" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Trung bình (1-3s)${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${RED}❌ Chậm (>3s)${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Summary
echo "=================================================="
echo "📊 KẾT QUẢ TỔNG HỢP"
echo "=================================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ HỆ THỐNG HOẠT ĐỘNG TỐT!${NC}"
else
    echo -e "${RED}❌ Có $ERRORS lỗi cần sửa${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Có $WARNINGS cảnh báo${NC}"
fi

echo ""
echo "📝 DANH SÁCH BUG ĐÃ PHÁT HIỆN:"
echo "-----------------------------"

if [ $KAFKA_ERRORS -gt 0 ]; then
    echo "1. ⚠️  Kafka timeout warnings (không nghiêm trọng)"
fi

echo ""
echo "🌐 TRUY CẬP SẢN PHẨM:"
echo "- Book Service API: http://localhost:3001"
echo "- RabbitMQ UI: http://localhost:15672 (library_admin/library_pass_123)"
echo "- Consul UI: http://localhost:8500"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3005 (admin/admin123)"
echo ""

exit $ERRORS
