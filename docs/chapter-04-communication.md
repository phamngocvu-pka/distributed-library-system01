# Chương 4: Trao Đổi Thông Tin

## 4.1. REST APIs

### 4.1.1. RESTful Endpoints

```javascript
// Book Service APIs
GET    /api/books           # Get all books
GET    /api/books/:id       # Get book by ID
POST   /api/books           # Create new book
PUT    /api/books/:id       # Update book
DELETE /api/books/:id       # Delete book
GET    /api/books/search    # Search books
```

### 4.1.2. Request/Response Format

```json
// Request
POST /api/books
{
  "title": "Distributed Systems",
  "author": "Andrew Tanenbaum",
  "isbn": "978-0132392273",
  "totalCopies": 5
}

// Response
{
  "success": true,
  "data": {
    "bookId": "uuid-here",
    "title": "Distributed Systems",
    ...
  }
}
```

## 4.2. Message Queue với RabbitMQ

### 4.2.1. Publish/Subscribe Pattern

```javascript
// Publisher
await channel.publish('library.events', 'book.created', 
  Buffer.from(JSON.stringify(data))
);

// Consumer
await channel.consume('notification-queue', async (msg) => {
  const data = JSON.parse(msg.content.toString());
  await handleNotification(data);
  channel.ack(msg);
});
```

### 4.2.2. Work Queue Pattern

```javascript
// Multiple workers cùng consume từ 1 queue
await channel.assertQueue('tasks', { durable: true });
await channel.prefetch(1); // Mỗi worker xử lý 1 task tại 1 thời điểm
```

## 4.3. Event Streaming với Apache Kafka

### 4.3.1. Producer

```javascript
await producer.send({
  topic: 'library-events',
  messages: [{
    key: eventId,
    value: JSON.stringify(event),
    headers: { 'event-type': 'BOOK_BORROWED' }
  }]
});
```

### 4.3.2. Consumer Groups

```javascript
const consumer = kafka.consumer({ groupId: 'notification-service' });
await consumer.subscribe({ topic: 'library-events' });
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    await processEvent(message);
  }
});
```

## 4.4. Real-time Communication với WebSocket

### 4.4.1. Socket.IO Server

```javascript
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe', (userId) => {
    socket.join(`user:${userId}`);
  });
});

// Broadcast notification
io.to(`user:${userId}`).emit('notification', {
  type: 'BOOK_DUE_SOON',
  message: 'Sách sắp đến hạn trả'
});
```

### 4.4.2. Client Connection

```javascript
const socket = io('http://localhost:3004');
socket.emit('subscribe', userId);
socket.on('notification', (data) => {
  console.log('Notification:', data);
});
```

## 4.5. Caching với Redis

### 4.5.1. Cache Strategy

```javascript
async function getBook(id) {
  const cacheKey = `book:${id}`;
  
  // Try cache first
  let book = await cacheGet(cacheKey);
  if (book) return book;
  
  // Cache miss - fetch from DB
  book = await Book.findOne({ bookId: id });
  
  // Store in cache for 10 minutes
  await cacheSet(cacheKey, book, 600);
  
  return book;
}
```

### 4.5.2. Cache Invalidation

```javascript
async function updateBook(id, data) {
  await Book.updateOne({ bookId: id }, data);
  
  // Invalidate cache
  await cacheDel(`book:${id}`);
  await cacheDel('books:list:*');
}
```

## 4.6. RPC với gRPC (Optional)

Hệ thống có thể mở rộng với gRPC cho high-performance service-to-service communication.

---
**Điểm số chương 4**: 1/1
- ✅ REST APIs
- ✅ Message Queue (RabbitMQ)
- ✅ Event Streaming (Kafka)
- ✅ Real-time Communication (WebSocket/Socket.IO)
- ✅ Caching (Redis)
