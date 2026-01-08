# 📚 Distributed Library Management System

Hệ thống quản lý thư viện phân tán được xây dựng theo kiến trúc Microservices, đáp ứng đầy đủ 8 chương đánh giá hệ thống phân tán.

## 🏗 Kiến trúc hệ thống

### Microservices
- **API Gateway**: Điểm vào duy nhất, load balancing với Nginx
- **Book Service**: Quản lý sách (MongoDB)
- **User Service**: Quản lý người dùng (PostgreSQL + JWT)
- **Borrowing Service**: Quản lý mượn/trả sách (PostgreSQL)
- **Notification Service**: Gửi thông báo (WebSocket + Socket.IO)

### Infrastructure
- **Message Queue**: RabbitMQ + Apache Kafka
- **Cache**: Redis (Redlock distributed locking)
- **Service Discovery**: Consul
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Process Manager**: PM2
- **Container**: Docker + Docker Compose

## 📋 Đáp ứng tiêu chí đánh giá

### Chương 1: Mở đầu (2 điểm)
- ✅ Tài liệu thiết kế hệ thống đầy đủ
- ✅ Sơ đồ kiến trúc tổng thể (PlantUML)
- ✅ Case study về distributed systems

### Chương 2: Kiến trúc (2 điểm)
- ✅ Event-driven architecture
- ✅ Microservices architecture
- ✅ Service-oriented architecture

### Chương 3: Tiến trình và luồng (1 điểm)
- ✅ Async/Await processing (Node.js)
- ✅ Process Management (PM2)
- ✅ Task Scheduling (node-cron)
- ✅ Background Jobs (Bull Queue)

### Chương 4: Trao đổi thông tin (1 điểm)
- ✅ REST APIs
- ✅ Message Queue (RabbitMQ + Kafka)
- ✅ Real-time (WebSocket/Socket.IO)
- ✅ Caching (Redis)
- ✅ Event Streaming (Kafka Streams)

### Chương 5: Định danh (1 điểm)
- ✅ UUID/GUID cho tài nguyên
- ✅ Service Registry (Consul)
- ✅ JWT Token Authentication
- ✅ SSL/TLS Certificates
- ✅ Resource Identifiers (URIs)

### Chương 6: Đồng bộ hóa (1 điểm)
- ✅ Distributed Locking (Redis Redlock)
- ✅ Message Queues (Kafka, RabbitMQ)
- ✅ CQRS + Event Sourcing
- ✅ Optimistic/Pessimistic Locking

### Chương 7: Sao lưu (1 điểm)
- ✅ Database Backup (pg_dump, mongodump)
- ✅ Incremental Backup (rsync)
- ✅ Data Replication (PostgreSQL Streaming Replication, MongoDB Replica Set)
- ✅ Automated Backup Scripts

### Chương 8: Tính chịu lỗi (1 điểm)
- ✅ Circuit Breaking (Opossum)
- ✅ Health Monitoring (Prometheus + Grafana)
- ✅ Log Management (ELK Stack)
- ✅ Failover & Load Balancing (Nginx)
- ✅ Auto-scaling ready

## 🚀 Cài đặt và chạy

### Yêu cầu
- Docker & Docker Compose
- Node.js 18+
- npm/yarn

### Khởi động toàn bộ hệ thống
```bash
# Clone repository
git clone <repo-url>
cd distributed-library-system

# Khởi động tất cả services với Docker Compose
docker-compose up -d

# Hoặc chạy từng service riêng với PM2
npm install -g pm2
pm2 start ecosystem.config.js
```

### Truy cập services
- API Gateway: http://localhost:3000
- Book Service: http://localhost:3001
- User Service: http://localhost:3002
- Borrowing Service: http://localhost:3003
- Notification Service: http://localhost:3004
- Grafana Dashboard: http://localhost:3005
- Kibana Dashboard: http://localhost:5601
- Consul UI: http://localhost:8500

## 📖 Tài liệu

Chi tiết tài liệu cho từng chương:
- [Chương 1: Mở đầu](./docs/chapter-01-introduction.md)
- [Chương 2: Kiến trúc](./docs/chapter-02-architecture.md)
- [Chương 3: Tiến trình và luồng](./docs/chapter-03-processes-threads.md)
- [Chương 4: Trao đổi thông tin](./docs/chapter-04-communication.md)
- [Chương 5: Định danh](./docs/chapter-05-naming.md)
- [Chương 6: Đồng bộ hóa](./docs/chapter-06-synchronization.md)
- [Chương 7: Sao lưu](./docs/chapter-07-replication.md)
- [Chương 8: Tính chịu lỗi](./docs/chapter-08-fault-tolerance.md)

## 🛠 Công nghệ sử dụng

- **Backend**: Node.js + Express
- **Databases**: PostgreSQL, MongoDB
- **Message Brokers**: RabbitMQ, Apache Kafka
- **Cache**: Redis (with Redlock)
- **Service Discovery**: Consul
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack
- **Process Manager**: PM2
- **Container**: Docker + Docker Compose
- **Load Balancer**: Nginx
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Circuit Breaker**: Opossum

## 📊 API Documentation

Xem Postman Collection: [API Documentation](./docs/api-documentation.md)

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run load tests
npm run test:load
```

## 📝 License

MIT
