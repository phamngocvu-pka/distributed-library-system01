#!/bin/bash

echo "🚀 KHỞI ĐỘNG DISTRIBUTED LIBRARY SYSTEM"
echo "========================================"
echo ""

cd /Users/phamngocvu/Desktop/distributed-library-system

# Kiểm tra Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker chưa chạy! Vui lòng mở Docker Desktop"
    exit 1
fi

echo "📦 Khởi động tất cả services..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Đợi services khởi động..."
sleep 10

echo ""
echo "🔍 Kiểm tra trạng thái..."
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "✅ HOÀN TẤT! Hệ thống đã sẵn sàng!"
echo ""
echo "🌐 TRUY CẬP SẢN PHẨM:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Book Service API:"
echo "   http://localhost:3001/api/books"
echo ""
echo "🖥️  Giao diện quản lý:"
echo "   RabbitMQ:   http://localhost:15672 (library_admin/library_pass_123)"
echo "   Consul:     http://localhost:8500"
echo "   Prometheus: http://localhost:9090"
echo "   Grafana:    http://localhost:3005 (admin/admin123)"
echo ""
echo "💾 Databases:"
echo "   MongoDB:    localhost:27017"
echo "   PostgreSQL: localhost:5432"
echo "   Redis:      localhost:6379"
echo ""
echo "📖 Tài liệu:"
echo "   RUNNING.md      - Hướng dẫn sử dụng"
echo "   PRODUCT-DEMO.md - Demo sản phẩm"
echo ""
echo "🧪 Test API ngay:"
echo "   curl http://localhost:3001/health"
echo "   curl http://localhost:3001/api/books"
echo ""
