# 📚 Hướng Dẫn Chạy Dự Án - Distributed Library System

## ✅ Trạng Thái Hiện Tại

Dự án đã được cấu hình và chạy thành công với:
- ✅ Infrastructure Services: PostgreSQL, MongoDB, Redis, RabbitMQ, Kafka, Consul
- ✅ Monitoring: Prometheus, Grafana
- ✅ Service: Book Service (đang chạy trên port 3001)

## 🚀 Cách Chạy Dự Án

### Bước 1: Khởi động tất cả services

```bash
cd /Users/phamngocvu/Desktop/distributed-library-system
docker-compose -f docker-compose.dev.yml up -d
```

### Bước 2: Kiểm tra trạng thái containers

```bash
docker ps
```

Bạn sẽ thấy các containers sau đang chạy:
- `library-book-service` - Port 3001
- `library-mongo` - Port 27017
- `library-postgres` - Port 5432
- `library-redis` - Port 6379
- `library-rabbitmq` - Port 5672, 15672 (Management UI)
- `library-kafka` - Port 9092, 9093
- `library-zookeeper` - Port 2181
- `library-consul` - Port 8500 (UI)
- `library-prometheus` - Port 9090
- `library-grafana` - Port 3005

### Bước 3: Xem logs của service

```bash
# Xem logs của Book Service
docker logs library-book-service -f

# Xem logs của MongoDB
docker logs library-mongo -f

# Xem logs của tất cả services
docker-compose -f docker-compose.dev.yml logs -f
```

## 🌐 Truy Cập Services

### API Services
- **Book Service**: http://localhost:3001
  - Health Check: http://localhost:3001/health

### Monitoring & Management UI
- **RabbitMQ Management**: http://localhost:15672
  - Username: `library_admin`
  - Password: `library_pass_123`

- **Consul UI**: http://localhost:8500

- **Prometheus**: http://localhost:9090

- **Grafana**: http://localhost:3005
  - Username: `admin`
  - Password: `admin123`

### Databases
- **PostgreSQL**: 
  - Host: localhost
  - Port: 5432
  - User: library_admin
  - Password: library_pass_123
  - Database: library_db

- **MongoDB**: 
  - Host: localhost
  - Port: 27017
  - User: library_admin
  - Password: library_pass_123

- **Redis**: 
  - Host: localhost
  - Port: 6379
  - Password: library_pass_123

## 🛠 Lệnh Quản Lý

### Dừng tất cả services
```bash
docker-compose -f docker-compose.dev.yml down
```

### Dừng và xóa volumes (dữ liệu)
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Khởi động lại một service cụ thể
```bash
docker-compose -f docker-compose.dev.yml restart book-service
```

### Rebuild một service
```bash
docker-compose -f docker-compose.dev.yml up -d --build book-service
```

### Xem resource usage
```bash
docker stats
```

## ⚠️ Lưu Ý

### 1. Các Service Chưa Hoàn Thiện
Hiện tại chỉ có **Book Service** được implement đầy đủ. Các services sau chưa có code:
- User Service (port 3002)
- Borrowing Service (port 3003)  
- Notification Service (port 3004)

Khi implement các service này, bạn cần:
1. Tạo code trong thư mục tương ứng (`services/user-service/`, etc.)
2. Đảm bảo có `package.json` và code đầy đủ
3. Update `docker-compose.dev.yml` hoặc sử dụng `docker-compose.yml` đầy đủ

### 2. Lỗi Redlock trong Book Service
Book Service đang gặp lỗi về Redlock (distributed locking). Để sửa, kiểm tra file:
```
services/book-service/src/config/redis.js
```

Đảm bảo import Redlock đúng cách:
```javascript
const Redlock = require('redlock');
// hoặc
const { default: Redlock } = require('redlock');
```

### 3. Cấu Hình Environment Variables
Các biến môi trường đã được cấu hình trong `docker-compose.dev.yml`. Nếu cần thay đổi:
- Database credentials
- JWT secrets
- SMTP settings
- etc.

Chỉnh sửa trực tiếp trong file `docker-compose.dev.yml`

## 🔍 Debug & Troubleshooting

### Kiểm tra container bị crash
```bash
docker ps -a
```

### Xem logs chi tiết
```bash
docker logs <container-name> --tail 100
```

### Truy cập vào container
```bash
docker exec -it library-book-service sh
```

### Kiểm tra kết nối database
```bash
# MongoDB
docker exec -it library-mongo mongosh -u library_admin -p library_pass_123

# PostgreSQL
docker exec -it library-postgres psql -U library_admin -d library_db

# Redis
docker exec -it library-redis redis-cli -a library_pass_123
```

## 📊 Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                    Book Service :3001                   │
└────────────┬────────────────────────────────┬───────────┘
             │                                │
    ┌────────▼────────┐              ┌───────▼────────┐
    │   MongoDB       │              │   Redis        │
    │   :27017        │              │   :6379        │
    └─────────────────┘              └────────────────┘
             │                                │
    ┌────────▼────────────────────────────────▼────────┐
    │         Message Queue & Event Streaming          │
    │   RabbitMQ (:5672)  +  Kafka (:9092)            │
    └──────────────────────────────────────────────────┘
             │                                │
    ┌────────▼────────┐              ┌───────▼────────┐
    │   Consul        │              │  Prometheus    │
    │   :8500         │              │  :9090         │
    └─────────────────┘              └────┬───────────┘
                                          │
                                   ┌──────▼────────┐
                                   │   Grafana     │
                                   │   :3005       │
                                   └───────────────┘
```

## 🎯 Bước Tiếp Theo

1. **Sửa lỗi Redlock** trong Book Service
2. **Implement các services còn lại**:
   - User Service
   - Borrowing Service
   - Notification Service
3. **Thêm API Gateway** (Nginx) khi đã có đủ services
4. **Test các API endpoints**
5. **Cấu hình monitoring dashboards** trong Grafana

## 📚 Tài Liệu Tham Khảo

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [RabbitMQ Management UI](https://www.rabbitmq.com/management.html)
- [Consul Documentation](https://www.consul.io/docs)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

---

**Chúc bạn code vui vẻ! 🚀**
