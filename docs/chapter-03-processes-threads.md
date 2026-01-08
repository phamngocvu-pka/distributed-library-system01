# Chương 3: Tiến Trình và Luồng

## 3.1. Multithreading với Node.js

### 3.1.1. Event Loop và Non-blocking I/O

Node.js sử dụng event-driven, non-blocking I/O model.

### 3.1.2. PM2 Cluster Mode

```javascript
// ecosystem.config.js
instances: 2,          // 2 worker processes
exec_mode: 'cluster'   // Cluster mode với load balancing
```

## 3.2. Asynchronous Processing

### 3.2.1. Async/Await Pattern

```javascript
// services/book-service/src/controllers/book.controller.js
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find(query);
    res.json({ success: true, data: books });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false });
  }
};
```

### 3.2.2. Promise.all cho Parallel Processing

```javascript
const [books, total] = await Promise.all([
  Book.find(query).skip(skip).limit(limit),
  Book.countDocuments(query)
]);
```

## 3.3. Process Management với PM2

### 3.3.1. Auto-restart và Monitoring

```javascript
{
  autorestart: true,
  max_memory_restart: '1G',
  error_file: './logs/error.log',
  out_file: './logs/out.log'
}
```

### 3.3.2. Graceful Shutdown

```javascript
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await cleanup();
  process.exit(0);
});
```

## 3.4. Task Scheduling

### 3.4.1. Cron Jobs với node-cron

```javascript
const cron = require('node-cron');

// Check overdue borrowings mỗi ngày lúc 9h sáng
cron.schedule('0 9 * * *', async () => {
  const overdue = await Borrowing.find({
    dueDate: { $lt: new Date() },
    status: 'borrowed'
  });
  
  for (const borrowing of overdue) {
    await notifyOverdue(borrowing);
  }
});
```

## 3.5. Background Jobs với Bull Queue

### 3.5.1. Email Queue

```javascript
const Queue = require('bull');
const emailQueue = new Queue('emails');

emailQueue.process(async (job) => {
  await sendEmail(job.data);
});

// Add job
await emailQueue.add({ to: 'user@example.com', subject: 'Reminder' });
```

---
**Điểm số chương 3**: 1/1
- ✅ Async/Await Processing
- ✅ PM2 Process Management
- ✅ Task Scheduling
- ✅ Background Jobs
