# API Documentation - Distributed Library System

## Base URL
```
http://localhost:3000  # Via API Gateway
```

## Authentication

Hầu hết endpoints yêu cầu JWT token trong header:
```
Authorization: Bearer <your-jwt-token>
```

## Book Service APIs

### 1. Get All Books
```http
GET /api/books?page=1&limit=10&category=Fiction&author=Nguyen
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category
- `author` (optional): Filter by author name
- `status` (optional): Filter by status (Available, Unavailable, Maintenance)
- `search` (optional): Full-text search

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "bookId": "uuid-here",
      "title": "Distributed Systems",
      "author": "Andrew Tanenbaum",
      "isbn": "978-0132392273",
      "category": "Technology",
      "totalCopies": 5,
      "availableCopies": 3,
      "status": "Available"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

### 2. Get Book by ID
```http
GET /api/books/{bookId}
```

### 3. Create Book (Admin only)
```http
POST /api/books
Content-Type: application/json

{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "978-0132350884",
  "publisher": "Prentice Hall",
  "publishedYear": 2008,
  "category": "Technology",
  "totalCopies": 10,
  "description": "A handbook of agile software craftsmanship"
}
```

### 4. Update Book (Admin only)
```http
PUT /api/books/{bookId}
Content-Type: application/json

{
  "totalCopies": 15,
  "status": "Available"
}
```

### 5. Delete Book (Admin only)
```http
DELETE /api/books/{bookId}
```

### 6. Search Books
```http
GET /api/books/search?q=distributed+systems
```

### 7. Get Available Books
```http
GET /api/books/available
```

## User Service APIs

### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phone": "0123456789"
}
```

### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "uuid-here",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "member"
  }
}
```

### 3. Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

### 4. Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Doe Jr.",
  "phone": "0987654321",
  "address": "123 Main St"
}
```

## Borrowing Service APIs

### 1. Borrow Book
```http
POST /api/borrowings
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "uuid-of-book",
  "dueDate": "2026-02-07T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "borrowingId": "uuid-here",
    "userId": "user-uuid",
    "bookId": "book-uuid",
    "borrowDate": "2026-01-07T10:00:00Z",
    "dueDate": "2026-02-07T00:00:00Z",
    "status": "borrowed"
  }
}
```

### 2. Return Book
```http
POST /api/borrowings/{borrowingId}/return
Authorization: Bearer <token>
```

### 3. Get My Borrowings
```http
GET /api/borrowings/my?status=borrowed
Authorization: Bearer <token>
```

### 4. Extend Due Date
```http
POST /api/borrowings/{borrowingId}/extend
Authorization: Bearer <token>
Content-Type: application/json

{
  "newDueDate": "2026-03-07T00:00:00Z"
}
```

### 5. Get Borrowing History
```http
GET /api/borrowings/history?page=1&limit=20
Authorization: Bearer <token>
```

## Notification Service APIs

### 1. WebSocket Connection
```javascript
const socket = io('http://localhost:3004');

// Subscribe to notifications
socket.emit('subscribe', { userId: 'your-user-id' });

// Listen for notifications
socket.on('notification', (data) => {
  console.log('Notification:', data);
});
```

### 2. Get Notifications
```http
GET /api/notifications?unreadOnly=true
Authorization: Bearer <token>
```

### 3. Mark as Read
```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer <token>
```

## Health Check Endpoints

All services expose health check endpoints:

```http
GET /health
```

**Response:**
```json
{
  "status": "UP",
  "timestamp": "2026-01-07T10:00:00Z",
  "service": "book-service",
  "checks": {
    "mongodb": "UP",
    "redis": "UP"
  }
}
```

## Metrics Endpoints

```http
GET /metrics
```

Returns Prometheus metrics for monitoring.

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

**HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error
- `503`: Service Unavailable

## Rate Limiting

- **Rate**: 100 requests per 15 minutes per IP
- **Burst**: 20 additional requests allowed

When exceeded, response:
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

## Postman Collection

Import this collection for testing: `docs/postman_collection.json`
