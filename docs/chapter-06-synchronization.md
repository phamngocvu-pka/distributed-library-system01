# Chương 6: Đồng Bộ Hóa

## 6.1. Distributed Locking với Redlock

### 6.1.1. Redis Redlock Implementation

```javascript
const Redlock = require('redlock');
const redlock = new Redlock([redisClient], {
  driftFactor: 0.01,
  retryCount: 10,
  retryDelay: 200
});

// Acquire lock
const lock = await redlock.acquire([`lock:book:${bookId}`], 5000);

try {
  // Critical section - update book
  const book = await Book.findOne({ bookId });
  book.availableCopies -= 1;
  await book.save();
} finally {
  // Release lock
  await lock.release();
}
```

### 6.1.2. Use Cases

✅ Prevent race conditions khi update book availability
✅ Ensure atomic operations trong distributed system
✅ Coordinate access đến shared resources

## 6.2. Message Queues

### 6.2.1. RabbitMQ cho Sequential Processing

```javascript
// Đảm bảo messages được xử lý theo thứ tự
await channel.assertQueue('book-updates', {
  durable: true,
  maxPriority: 10
});

await channel.consume('book-updates', async (msg) => {
  // Process message sequentially
  await processUpdate(msg);
  channel.ack(msg);
}, { noAck: false });
```

### 6.2.2. Kafka Partitions

```javascript
// Messages cùng key đi vào cùng partition → đảm bảo order
await producer.send({
  topic: 'library-events',
  messages: [{
    key: bookId,  // Same book -> same partition
    value: JSON.stringify(event)
  }]
});
```

## 6.3. CQRS Pattern

### 6.3.1. Command Query Responsibility Segregation

**Command Side (Write):**
```javascript
// borrowing-service - Write model
async function borrowBook(userId, bookId) {
  // 1. Validate
  // 2. Update database
  const borrowing = await Borrowing.create({ userId, bookId });
  
  // 3. Publish event
  await publishEvent('BOOK_BORROWED', { userId, bookId });
  
  return borrowing;
}
```

**Query Side (Read):**
```javascript
// book-service - Read model with cache
async function getBook(bookId) {
  // Try cache first
  let book = await cacheGet(`book:${bookId}`);
  if (book) return book;
  
  // Fallback to database
  book = await Book.findOne({ bookId });
  await cacheSet(`book:${bookId}`, book);
  
  return book;
}
```

## 6.4. Event Sourcing

### 6.4.1. Store All Events

```javascript
const eventStore = [];

// Store every event
async function storeEvent(event) {
  eventStore.push({
    id: uuidv4(),
    type: event.type,
    data: event.data,
    timestamp: new Date(),
    version: getCurrentVersion()
  });
  
  await publishEvent(event);
}

// Replay events to rebuild state
async function rebuildState() {
  let state = {};
  for (const event of eventStore) {
    state = applyEvent(state, event);
  }
  return state;
}
```

## 6.5. Optimistic Locking

### 6.5.1. Version-based Concurrency Control

```javascript
const bookSchema = new mongoose.Schema({
  // ... other fields
  version: {
    type: Number,
    default: 1
  }
});

// Update with version check
async function updateBook(bookId, updates, expectedVersion) {
  const result = await Book.updateOne(
    { 
      bookId,
      version: expectedVersion  // Check version
    },
    {
      $set: updates,
      $inc: { version: 1 }  // Increment version
    }
  );
  
  if (result.modifiedCount === 0) {
    throw new Error('Conflict: Book was modified by another process');
  }
}
```

## 6.6. Pessimistic Locking

### 6.6.1. Database-level Locking

```javascript
// PostgreSQL - SELECT FOR UPDATE
const client = await pool.connect();

try {
  await client.query('BEGIN');
  
  // Lock row
  const result = await client.query(
    'SELECT * FROM borrowings WHERE id = $1 FOR UPDATE',
    [borrowingId]
  );
  
  // Update
  await client.query(
    'UPDATE borrowings SET status = $1 WHERE id = $2',
    ['returned', borrowingId]
  );
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## 6.7. Two-Phase Commit (2PC)

### 6.7.1. Distributed Transaction

```javascript
// Phase 1: Prepare
async function prepareTransaction(transactionId) {
  // Ask all participants if they can commit
  const promises = [
    bookService.prepare(transactionId),
    borrowingService.prepare(transactionId),
    userService.prepare(transactionId)
  ];
  
  const results = await Promise.all(promises);
  return results.every(r => r.canCommit);
}

// Phase 2: Commit or Abort
async function commitTransaction(transactionId) {
  if (await prepareTransaction(transactionId)) {
    // All participants agreed - commit
    await Promise.all([
      bookService.commit(transactionId),
      borrowingService.commit(transactionId),
      userService.commit(transactionId)
    ]);
  } else {
    // Someone can't commit - abort all
    await abortTransaction(transactionId);
  }
}
```

---
**Điểm số chương 6**: 1/1
- ✅ Distributed Locking (Redis Redlock)
- ✅ Message Queues (Kafka, RabbitMQ)
- ✅ CQRS Pattern
- ✅ Event Sourcing
- ✅ Optimistic/Pessimistic Locking
