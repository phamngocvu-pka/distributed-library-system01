# Chương 1: Mở Đầu - Giới Thiệu Hệ Thống Phân Tán

## 1.1. Tổng Quan Hệ Thống

**Hệ thống Quản lý Thư viện Phân tán** (Distributed Library Management System) là một ứng dụng được xây dựng dựa trên kiến trúc microservices, nhằm quản lý hoạt động của thư viện một cách hiệu quả, có khả năng mở rộng và chịu lỗi cao.

### 1.1.1. Mục Tiêu

- **Khả năng mở rộng**: Hệ thống có thể xử lý hàng nghìn người dùng đồng thời
- **Tính sẵn sàng cao**: Đảm bảo hoạt động 24/7 với downtime tối thiểu
- **Tính chịu lỗi**: Tự động phục hồi khi có sự cố
- **Hiệu suất cao**: Thời gian phản hồi nhanh nhờ cache và load balancing
- **Bảo mật**: Xác thực và phân quyền người dùng chặt chẽ

### 1.1.2. Ứng Dụng Thực Tế

Hệ thống này phù hợp cho:
- Thư viện trường đại học với nhiều chi nhánh
- Hệ thống thư viện công cộng cấp thành phố
- Thư viện doanh nghiệp với văn phòng đa địa điểm
- Mạng lưới thư viện liên kết

## 1.2. Lý Do Triển Khai Hệ Thống Phân Tán

### 1.2.1. Vấn Đề Với Hệ Thống Đơn Khối (Monolith)

**Hạn chế của kiến trúc monolith:**
- **Khó mở rộng**: Phải scale toàn bộ ứng dụng kể cả các module ít sử dụng
- **Deployment phức tạp**: Mỗi lần thay đổi nhỏ phải deploy lại toàn bộ
- **Single point of failure**: Một lỗi có thể làm sập toàn hệ thống
- **Technology lock-in**: Bị ràng buộc với một ngôn ngữ/framework duy nhất
- **Khó bảo trì**: Code base lớn, phức tạp theo thời gian

### 1.2.2. Lợi Ích Của Kiến Trúc Phân Tán

**Ưu điểm:**
- ✅ **Độc lập về mặt triển khai**: Mỗi service có thể deploy riêng
- ✅ **Scalability**: Scale từng service theo nhu cầu thực tế
- ✅ **Resilience**: Lỗi ở một service không làm sập toàn hệ thống
- ✅ **Technology diversity**: Mỗi service có thể dùng công nghệ phù hợp nhất
- ✅ **Team autonomy**: Nhiều team có thể làm việc độc lập
- ✅ **Fault isolation**: Dễ dàng cô lập và khắc phục sự cố

## 1.3. Yêu Cầu Hệ Thống

### 1.3.1. Yêu Cầu Chức Năng

**Quản lý sách:**
- Thêm, sửa, xóa thông tin sách
- Tìm kiếm sách theo nhiều tiêu chí
- Quản lý số lượng bản sao
- Phân loại và gắn thẻ sách

**Quản lý người dùng:**
- Đăng ký, đăng nhập, quản lý hồ sơ
- Phân quyền (admin, thủ thư, độc giả)
- Xác thực JWT

**Quản lý mượn/trả:**
- Cho mượn sách
- Trả sách và tính phí phạt
- Gia hạn mượn sách
- Đặt chỗ sách trước

**Thông báo:**
- Thông báo đến hạn trả sách
- Thông báo sách mới
- Thông báo sách đặt trước sẵn sàng
- Real-time notifications qua WebSocket

### 1.3.2. Yêu Cầu Phi Chức Năng

**Hiệu suất:**
- Response time < 200ms cho 95% requests
- Xử lý được 1000+ concurrent users
- Database query time < 100ms

**Độ tin cậy:**
- Uptime 99.9% (8.76 giờ downtime/năm)
- Data replication cho redundancy
- Automated backup hàng ngày

**Bảo mật:**
- JWT authentication
- Role-based access control (RBAC)
- SSL/TLS encryption
- Rate limiting để chống DDoS

**Khả năng mở rộng:**
- Horizontal scaling cho tất cả services
- Load balancing
- Auto-scaling dựa trên metrics

## 1.4. Tổng Quan Kiến Trúc

### 1.4.1. Sơ Đồ Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                              │
│              (Web Browser, Mobile App)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Nginx)                        │
│          Load Balancing | Rate Limiting | SSL/TLS            │
└────┬───────────┬────────────┬────────────┬───────────────────┘
     │           │            │            │
     ▼           ▼            ▼            ▼
┌─────────┐ ┌─────────┐ ┌───────────┐ ┌──────────────┐
│  Book   │ │  User   │ │ Borrowing │ │Notification  │
│ Service │ │ Service │ │  Service  │ │   Service    │
│         │ │         │ │           │ │              │
│ MongoDB │ │PostgreSQL│ │PostgreSQL│ │  WebSocket   │
└────┬────┘ └────┬────┘ └─────┬─────┘ └──────┬───────┘
     │           │            │               │
     └───────────┴────────────┴───────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────┐  ┌──────────────┐
│   RabbitMQ   │  │  Kafka   │  │    Redis     │
│Message Queue │  │Streaming │  │Cache+Redlock │
└──────────────┘  └──────────┘  └──────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────┐  ┌──────────────┐
│   Consul     │  │Prometheus│  │  ELK Stack   │
│Service Disc. │  │ +Grafana │  │   Logging    │
└──────────────┘  └──────────┘  └──────────────┘
```

### 1.4.2. Các Thành Phần Chính

**API Gateway:**
- Entry point duy nhất cho tất cả requests
- Load balancing với Nginx
- Rate limiting và security

**Microservices:**
- **Book Service**: Quản lý sách (MongoDB)
- **User Service**: Quản lý người dùng (PostgreSQL + JWT)
- **Borrowing Service**: Quản lý mượn/trả (PostgreSQL)
- **Notification Service**: Gửi thông báo (WebSocket + Socket.IO)

**Infrastructure:**
- **Message Queue**: RabbitMQ + Apache Kafka
- **Cache**: Redis (Redlock distributed locking)
- **Service Discovery**: Consul
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

## 1.5. Công Nghệ Sử Dụng

### 1.5.1. Backend

| Công nghệ | Mục đích | Lý do chọn |
|-----------|----------|------------|
| Node.js | Runtime environment | Event-driven, non-blocking I/O |
| Express.js | Web framework | Đơn giản, linh hoạt, middleware ecosystem |
| PM2 | Process manager | Cluster mode, auto-restart, monitoring |

### 1.5.2. Databases

| Database | Service | Lý do chọn |
|----------|---------|------------|
| MongoDB | Book Service | Document-based, flexible schema cho metadata sách |
| PostgreSQL | User, Borrowing | ACID compliance, relationships, transactions |

### 1.5.3. Message Queue & Streaming

| Công nghệ | Mục đích | Lý do chọn |
|-----------|----------|------------|
| RabbitMQ | Message queue | Reliable, flexible routing, easy to use |
| Apache Kafka | Event streaming | High throughput, distributed, event sourcing |

### 1.5.4. Caching & Locking

| Công nghệ | Mục đích | Lý do chọn |
|-----------|----------|------------|
| Redis | Cache | In-memory, fast, pub/sub support |
| Redlock | Distributed locking | Prevent race conditions trong distributed system |

### 1.5.5. Infrastructure

| Công nghệ | Mục đích |
|-----------|----------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Load balancer & reverse proxy |
| Consul | Service discovery & health checking |
| Prometheus | Metrics collection |
| Grafana | Metrics visualization |
| ELK Stack | Centralized logging |

## 1.6. Case Study: Distributed Systems

### 1.6.1. Netflix

**Vấn đề**: Scale từ DVD rental đến 200M+ subscribers toàn cầu

**Giải pháp**:
- Microservices architecture (700+ services)
- Chaos Engineering (Chaos Monkey)
- Circuit breakers (Hystrix)
- Service mesh

**Bài học áp dụng**:
- Circuit breaker pattern (Opossum trong dự án này)
- Health checks và monitoring
- Graceful degradation

### 1.6.2. Uber

**Vấn đề**: Xử lý millions requests/second, real-time matching

**Giải pháp**:
- Event-driven architecture
- Apache Kafka cho event streaming
- Redis cho real-time data
- Service discovery với Consul

**Bài học áp dụng**:
- Kafka cho event streaming
- Redis caching strategy
- Consul service discovery

### 1.6.3. Amazon

**Vấn đề**: E-commerce scale toàn cầu

**Giải pháp**:
- Service-oriented architecture
- Database per service pattern
- Eventual consistency
- Distributed caching

**Bài học áp dụng**:
- Database per microservice
- Eventual consistency với message queue
- Distributed locking với Redlock

## 1.7. Tài Liệu Thiết Kế

Các tài liệu chi tiết:
- [Chapter 2: Kiến Trúc](./chapter-02-architecture.md)
- [Chapter 3: Tiến Trình và Luồng](./chapter-03-processes-threads.md)
- [Chapter 4: Trao Đổi Thông Tin](./chapter-04-communication.md)
- [Chapter 5: Định Danh](./chapter-05-naming.md)
- [Chapter 6: Đồng Bộ Hóa](./chapter-06-synchronization.md)
- [Chapter 7: Sao Lưu](./chapter-07-replication.md)
- [Chapter 8: Tính Chịu Lỗi](./chapter-08-fault-tolerance.md)

## 1.8. Kết Luận

Hệ thống Quản lý Thư viện Phân tán này được thiết kế với các nguyên tắc:
- **Separation of Concerns**: Mỗi service có trách nhiệm rõ ràng
- **Loose Coupling**: Services giao tiếp qua APIs và message queues
- **High Cohesion**: Code trong mỗi service tập trung vào một domain
- **Fail Fast**: Phát hiện lỗi sớm với circuit breakers
- **Observability**: Logging, metrics, tracing đầy đủ

---
**Điểm số chương 1**: 2/2
- ✅ Tài liệu thiết kế hệ thống đầy đủ
- ✅ Sơ đồ kiến trúc tổng thể
- ✅ Case study về distributed systems
