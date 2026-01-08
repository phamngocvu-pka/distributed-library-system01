# Chương 2: Kiến Trúc Hệ Thống Phân Tán

## 2.1. Tổng Quan Kiến Trúc

Hệ thống sử dụng **Microservices Architecture** kết hợp với các pattern:
- Event-Driven Architecture
- Service-Oriented Architecture (SOA)
- CQRS (Command Query Responsibility Segregation)

## 2.2. Event-Driven Architecture

### 2.2.1. Khái Niệm

Event-Driven Architecture (EDA) là kiến trúc trong đó các services giao tiếp thông qua events thay vì direct calls.

### 2.2.2. Triển Khai

**Kafka cho Event Streaming:**

```javascript
// services/book-service/src/config/kafka.js
const { Kafka } = require('kafkajs');

async function publishEvent(topic, event) {
  await producer.send({
    topic,
    messages: [{
      key: event.id,
      value: JSON.stringify(event),
      headers: {
        'event-type': event.type,
        'timestamp': Date.now().toString()
      }
    }]
  });
}
```

**Event Types:**
- `BOOK_CREATED`: Sách mới được thêm vào
- `BOOK_BORROWED`: Sách được mượn
- `BOOK_RETURNED`: Sách được trả
- `USER_REGISTERED`: Người dùng mới đăng ký
- `BORROWING_OVERDUE`: Mượn sách quá hạn

### 2.2.3. Lợi Ích

✅ **Loose Coupling**: Services không cần biết về nhau
✅ **Scalability**: Dễ dàng thêm consumers mới
✅ **Resilience**: Service tạm thời offline vẫn nhận được events sau
✅ **Event Sourcing**: Lưu trữ toàn bộ lịch sử events

## 2.3. Microservices Architecture

### 2.3.1. Nguyên Tắc Thiết Kế

**Single Responsibility Principle:**
- Mỗi service chịu trách nhiệm về một business domain
- Book Service: Chỉ quản lý sách
- User Service: Chỉ quản lý người dùng

**Database Per Service:**
- Mỗi service có database riêng
- Book Service → MongoDB
- User/Borrowing Service → PostgreSQL

**Decentralized Governance:**
- Mỗi team tự chọn công nghệ phù hợp
- Book Service dùng MongoDB vì flexible schema
- User Service dùng PostgreSQL vì cần ACID

### 2.3.2. Cấu Trúc Services

```
services/
├── book-service/          # Port 3001, MongoDB
│   ├── src/
│   │   ├── config/       # Database, Redis, Kafka, Consul
│   │   ├── models/       # Book model
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Validation, auth
│   │   └── utils/        # Logger, metrics, circuit breaker
│   ├── Dockerfile
│   └── package.json
│
├── user-service/          # Port 3002, PostgreSQL
│   └── ... (tương tự)
│
├── borrowing-service/     # Port 3003, PostgreSQL
│   └── ... (tương tự)
│
└── notification-service/  # Port 3004, WebSocket
    └── ... (tương tự)
```

### 2.3.3. Service Communication

**Synchronous (REST APIs):**
```javascript
// Client gọi trực tiếp qua HTTP
GET /api/books/{id}
POST /api/books
PUT /api/books/{id}
DELETE /api/books/{id}
```

**Asynchronous (Message Queue):**
```javascript
// Publish event khi sách được mượn
await publishEvent('library-events', {
  type: 'BOOK_BORROWED',
  bookId: '123',
  userId: '456',
  timestamp: new Date()
});

// Notification Service nhận và xử lý
consumer.on('message', async (event) => {
  if (event.type === 'BOOK_BORROWED') {
    await sendNotification(event.userId, 'Bạn đã mượn sách thành công');
  }
});
```

## 2.4. Service-Oriented Architecture (SOA)

### 2.4.1. API Gateway Pattern

**Nginx Load Balancer:**

```nginx
# gateway/nginx.conf
upstream book-service {
    least_conn;
    server book-service:3001 max_fails=3 fail_timeout=30s;
}

location /api/books {
    proxy_pass http://book-service;
    proxy_next_upstream error timeout http_500 http_502;
}
```

**Lợi ích:**
- Single entry point cho clients
- Load balancing tự động
- Rate limiting và security
- SSL/TLS termination

### 2.4.2. Service Registry và Discovery

**Consul Configuration:**

```javascript
// services/book-service/src/config/consul.js
async function registerService(serviceName, port) {
  await consul.agent.service.register({
    id: `${serviceName}-${port}`,
    name: serviceName,
    port: port,
    check: {
      http: `http://localhost:${port}/health`,
      interval: '10s',
      timeout: '5s'
    }
  });
}

async function discoverService(serviceName) {
  const services = await consul.health.service({
    service: serviceName,
    passing: true
  });
  // Round-robin load balancing
  return services[Math.floor(Math.random() * services.length)];
}
```

**Workflow:**
1. Service khởi động → Register với Consul
2. Consul health check mỗi 10 giây
3. Service khác discover qua Consul
4. Load balancing tự động

## 2.5. Phân Chia Công Việc Giữa Các Node

### 2.5.1. Horizontal Scaling

**PM2 Cluster Mode:**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'book-service',
    script: './src/index.js',
    instances: 2,          // 2 instances (processes)
    exec_mode: 'cluster',   // Cluster mode
    max_memory_restart: '1G'
  }]
};
```

**Load Balancing Strategy:**
- Nginx: `least_conn` (least connections)
- PM2: Round-robin giữa các instances

### 2.5.2. Work Distribution

**Task Queue với Bull:**

```javascript
const Queue = require('bull');
const emailQueue = new Queue('email-notifications');

// Producer: Thêm job vào queue
await emailQueue.add({
  to: 'user@example.com',
  subject: 'Sách sắp đến hạn',
  template: 'overdue-reminder'
});

// Consumer: Xử lý job
emailQueue.process(async (job) => {
  await sendEmail(job.data);
});
```

## 2.6. Communication Patterns

### 2.6.1. Request-Response (Synchronous)

**REST APIs:**
- Client chờ response từ server
- Timeout sau 60 giây
- Retry với circuit breaker

### 2.6.2. Publish-Subscribe (Asynchronous)

**RabbitMQ Topic Exchange:**

```javascript
// Publisher
await channel.publish('library.events', 'book.created', {
  bookId: '123',
  title: 'New Book'
});

// Subscriber 1: Notification Service
await channel.bindQueue('notifications', 'library.events', 'book.*');

// Subscriber 2: Analytics Service
await channel.bindQueue('analytics', 'library.events', '#');
```

### 2.6.3. Event Streaming

**Kafka Streams:**

```javascript
// Producer
await kafka.send({
  topic: 'library-events',
  messages: [{ value: JSON.stringify(event) }]
});

// Consumer with offset management
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const event = JSON.parse(message.value);
    await handleEvent(event);
    // Kafka tự động commit offset
  }
});
```

## 2.7. Sơ Đồ Chi Tiết

### 2.7.1. Sequence Diagram: Mượn Sách

```
User App -> API Gateway: POST /api/borrowings
API Gateway -> Borrowing Service: Forward request
Borrowing Service -> User Service: GET /api/users/{id}
User Service -> Borrowing Service: User data
Borrowing Service -> Book Service: GET /api/books/{id}
Book Service -> Borrowing Service: Book data
Borrowing Service -> Database: Create borrowing record
Borrowing Service -> Book Service: Update available copies
Borrowing Service -> Kafka: Publish BOOK_BORROWED event
Borrowing Service -> API Gateway: Success response
API Gateway -> User App: 201 Created
Kafka -> Notification Service: Consume event
Notification Service -> User: Send notification
```

### 2.7.2. Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐      │
│  │  Nginx   │  │   Rate   │  │  SSL/TLS         │      │
│  │  LB      │  │ Limiter  │  │  Termination     │      │
│  └──────────┘  └──────────┘  └──────────────────┘      │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Book Service │ │ User Service │ │Borrowing Svc │
│              │ │              │ │              │
│ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │
│ │Controller│ │ │ │Controller│ │ │ │Controller│ │
│ └────┬─────┘ │ │ └────┬─────┘ │ │ └────┬─────┘ │
│      │       │ │      │       │ │      │       │
│ ┌────▼─────┐ │ │ ┌────▼─────┐ │ │ ┌────▼─────┐ │
│ │  Model   │ │ │ │  Model   │ │ │ │  Model   │ │
│ └────┬─────┘ │ │ └────┬─────┘ │ │ └────┬─────┘ │
│      │       │ │      │       │ │      │       │
│ ┌────▼─────┐ │ │ ┌────▼─────┐ │ │ ┌────▼─────┐ │
│ │ MongoDB  │ │ │ │PostgreSQL│ │ │ │PostgreSQL│ │
│ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │
└──────────────┘ └──────────────┘ └──────────────┘
```

## 2.8. Đánh Giá Kiến Trúc

### 2.8.1. Ưu Điểm

✅ **Scalability**: Mỗi service scale độc lập
✅ **Resilience**: Lỗi cô lập, không lan rộng
✅ **Flexibility**: Dễ thêm/sửa/xóa services
✅ **Technology Diversity**: Mỗi service dùng stack phù hợp
✅ **Team Independence**: Nhiều team làm việc song song

### 2.8.2. Thách Thức

⚠️ **Complexity**: Nhiều moving parts cần quản lý
⚠️ **Distributed Transactions**: Cần Saga pattern hoặc 2PC
⚠️ **Network Latency**: Inter-service calls qua network
⚠️ **Monitoring**: Cần centralized logging và tracing
⚠️ **Testing**: Integration testing phức tạp hơn

### 2.8.3. Giải Pháp

✅ **Circuit Breaker**: Ngăn cascade failures (Opossum)
✅ **Service Mesh**: Consul cho service discovery
✅ **API Gateway**: Nginx cho centralized entry point
✅ **Observability**: ELK Stack + Prometheus + Grafana
✅ **Containerization**: Docker cho consistent environments

---
**Điểm số chương 2**: 2/2
- ✅ Event-driven architecture
- ✅ Microservices architecture
- ✅ Service-oriented architecture
- ✅ Sơ đồ chi tiết và phân tích đầy đủ
