# Chương 5: Định Danh

## 5.1. UUID/GUID

### 5.1.1. Sử dụng UUID cho Resource IDs

```javascript
const { v4: uuidv4 } = require('uuid');

const bookSchema = new mongoose.Schema({
  bookId: {
    type: String,
    default: () => uuidv4(),  // Tạo UUID tự động
    unique: true,
    required: true
  }
});
```

### 5.1.2. Lợi Ích

✅ Globally unique - không trùng lặp
✅ Không cần centralized ID generator
✅ Có thể tạo offline
✅ An toàn hơn sequential IDs

## 5.2. Service Registry với Consul

### 5.2.1. Service Registration

```javascript
await consul.agent.service.register({
  id: 'book-service-3001',
  name: 'book-service',
  address: 'localhost',
  port: 3001,
  check: {
    http: 'http://localhost:3001/health',
    interval: '10s'
  }
});
```

### 5.2.2. Service Discovery

```javascript
const services = await consul.health.service({
  service: 'book-service',
  passing: true  // Chỉ lấy healthy services
});

const service = services[0];
const url = `http://${service.Service.Address}:${service.Service.Port}`;
```

## 5.3. DNS và IP Address

### 5.3.1. Docker Network DNS

```yaml
# docker-compose.yml
networks:
  library-network:
    driver: bridge

services:
  book-service:
    networks:
      - library-network
    # Có thể truy cập qua hostname "book-service"
```

### 5.3.2. Service Resolution

```javascript
// Từ User Service, có thể call Book Service qua DNS
const response = await axios.get('http://book-service:3001/api/books/123');
```

## 5.4. JWT Token Authentication

### 5.4.1. Token Generation

```javascript
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}
```

### 5.4.2. Token Verification

```javascript
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
```

## 5.5. SSL/TLS Certificates

### 5.5.1. Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    
    ssl_certificate /etc/nginx/ssl/certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

## 5.6. Resource Identifiers (URIs)

### 5.6.1. RESTful URI Design

```
/api/books                    # Collection
/api/books/{bookId}           # Specific resource
/api/books/{bookId}/reviews   # Nested resource
/api/users/{userId}/borrowings # User's borrowings
```

### 5.6.2. URI Best Practices

✅ Sử dụng nouns, không dùng verbs
✅ Plural cho collections
✅ Lowercase và dấu gạch ngang
✅ Versioning: `/api/v1/books`

---
**Điểm số chương 5**: 1/1
- ✅ UUID/GUID
- ✅ DNS và IP Address
- ✅ Service Registry (Consul)
- ✅ JWT Token Authentication
- ✅ SSL/TLS Certificates
- ✅ Resource Identifiers (URIs)
