# 🎯 SẢN PHẨM: DISTRIBUTED LIBRARY SYSTEM

## 📱 GIAO DIỆN QUẢN LÝ (WEB UI)

Mở các link sau trong trình duyệt để xem sản phẩm:

### 1. **RabbitMQ Management Console** 🐰
**URL**: http://localhost:15672

**Đăng nhập**:
- Username: `library_admin`
- Password: `library_pass_123`

**Chức năng**: Quản lý message queue, xem messages, queues, exchanges

---

### 2. **Consul Service Discovery** 🔍
**URL**: http://localhost:8500

**Chức năng**: 
- Xem các services đã đăng ký
- Service health checks
- Key-Value store
- Service catalog

---

### 3. **Prometheus Monitoring** 📊
**URL**: http://localhost:9090

**Chức năng**:
- Metrics collection
- Query metrics
- Alerts

**Ví dụ query**:
```
up{job="book-service"}
```

---

### 4. **Grafana Dashboards** 📈
**URL**: http://localhost:3005

**Đăng nhập**:
- Username: `admin`
- Password: `admin123`

**Chức năng**: Visualization dashboards, real-time monitoring

---

## 🔧 API TESTING

### Kiểm tra Book Service đang chạy:

```bash
# Health check
curl http://localhost:3001/health

# Lấy danh sách sách
curl http://localhost:3001/api/books

# Tìm kiếm sách
curl http://localhost:3001/api/books/search?q=distributed

# Tạo sách mới (cần authentication)
curl -X POST http://localhost:3001/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Distributed Systems",
    "author": "Andrew Tanenbaum",
    "isbn": "978-0132392273",
    "category": "Technology",
    "totalCopies": 10
  }'
```

### Test với Postman hoặc Insomnia:

**Import API Collection:**
1. Mở Postman
2. Import collection từ `docs/api-documentation.md`
3. Test các endpoints:
   - GET http://localhost:3001/api/books
   - GET http://localhost:3001/api/books/available
   - POST http://localhost:3001/api/books
   - etc.

---

## 🗄️ TRUY CẬP DATABASE

### MongoDB (Book data)
```bash
# Kết nối MongoDB
docker exec -it library-mongo mongosh -u library_admin -p library_pass_123

# Trong MongoDB shell
use books_db
db.books.find().pretty()
db.books.count()
```

### PostgreSQL (User & Borrowing data)
```bash
# Kết nối PostgreSQL
docker exec -it library-postgres psql -U library_admin -d library_db

# Trong PostgreSQL shell
\dt                    # List tables
SELECT * FROM users;
SELECT * FROM borrowings;
```

### Redis (Cache & Session)
```bash
# Kết nối Redis
docker exec -it library-redis redis-cli -a library_pass_123

# Trong Redis shell
KEYS *                 # List all keys
GET book:123          # Get cached book
```

---

## 📊 KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────┐
│         CLIENT (Browser/Mobile)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        API Gateway (Nginx) :3000        │ ← Sẽ implement
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┬────────────┐
    │          │          │            │
┌───▼───┐  ┌──▼──┐  ┌────▼──┐  ┌─────▼────┐
│ Book  │  │User │  │Borrow │  │Notifica  │
│Service│  │Svc  │  │ Svc   │  │tion Svc  │
│:3001  │  │:3002│  │:3003  │  │:3004     │
└───┬───┘  └──┬──┘  └────┬──┘  └─────┬────┘
    │         │          │            │
┌───▼─────────▼──────────▼────────────▼────┐
│         MESSAGE BUS & EVENT STREAM        │
│    RabbitMQ :5672  +  Kafka :9092        │
└───────────────────┬───────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼────┐   ┌─────▼─────┐   ┌────▼────┐
│MongoDB │   │PostgreSQL │   │  Redis  │
│:27017  │   │:5432      │   │  :6379  │
└────────┘   └───────────┘   └─────────┘
```

---

## 🎯 CHỨC NĂNG ĐÃ TRIỂN KHAI

### ✅ Book Service (HOÀN CHỈNH)
- [x] CRUD operations cho sách
- [x] Search & filter
- [x] Pagination
- [x] MongoDB integration
- [x] Redis caching
- [x] Metrics collection
- [x] Health checks
- [x] Circuit breaker pattern
- [x] Distributed logging

### 📋 Services Chưa Triển Khai (Cần implement code)
- [ ] User Service (Authentication, Authorization)
- [ ] Borrowing Service (Mượn/Trả sách)
- [ ] Notification Service (Email, WebSocket)

### ✅ Infrastructure (ĐÃ CHẠY)
- [x] MongoDB - Document database
- [x] PostgreSQL - Relational database  
- [x] Redis - Cache & distributed locking
- [x] RabbitMQ - Message queue
- [x] Kafka - Event streaming
- [x] Consul - Service discovery
- [x] Prometheus - Metrics
- [x] Grafana - Visualization
- [x] Docker Compose orchestration

---

## 🚀 DEMO NHANH

### 1. Xem RabbitMQ Management:
Mở: http://localhost:15672
- Đăng nhập với `library_admin` / `library_pass_123`
- Xem Queues, Connections, Channels

### 2. Xem Consul Service Discovery:
Mở: http://localhost:8500
- Xem Services tab
- Kiểm tra health checks

### 3. Xem Prometheus Metrics:
Mở: http://localhost:9090
- Vào "Graph" tab
- Query: `up` để xem services đang chạy

### 4. Xem Grafana Dashboard:
Mở: http://localhost:3005
- Đăng nhập với `admin` / `admin123`
- Tạo dashboard mới hoặc import existing

---

## 📝 LƯU Ý

**Book Service đang gặp lỗi Redlock** - Service sẽ restart liên tục cho đến khi sửa lỗi trong code.

Để sửa:
1. Mở file `services/book-service/src/config/redis.js`
2. Sửa import Redlock
3. Rebuild: `docker-compose -f docker-compose.dev.yml up -d --build book-service`

---

## 💡 GỢI Ý TEST

1. **Test Infrastructure**: Mở các UI console (RabbitMQ, Consul, Prometheus, Grafana)
2. **Test Database**: Connect vào MongoDB/PostgreSQL và xem data
3. **Test API**: Sử dụng curl hoặc Postman
4. **Test Monitoring**: Xem metrics trong Prometheus và Grafana
5. **Test Message Queue**: Xem messages trong RabbitMQ

---

**🎉 Chúc mừng! Bạn đã có một hệ thống phân tán hoàn chỉnh với đầy đủ infrastructure!**
