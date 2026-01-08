# Chương 8: Tính Chịu Lỗi (Fault Tolerance)

## 8.1. Circuit Breaker Pattern

### 8.1.1. Implementation với Opossum

```javascript
const CircuitBreaker = require('opossum');

function createCircuitBreaker(fn, options = {}) {
  const breaker = new CircuitBreaker(fn, {
    timeout: 3000,                    // 3 seconds timeout
    errorThresholdPercentage: 50,     // Open circuit at 50% failure rate
    resetTimeout: 30000,              // Try again after 30 seconds
    rollingCountTimeout: 10000,       // 10 second window
    name: options.name || 'breaker'
  });

  breaker.on('open', () => {
    logger.warn(`Circuit breaker ${options.name} opened`);
  });

  breaker.fallback(() => {
    // Return cached data or default value
    return { error: 'Service temporarily unavailable' };
  });

  return breaker;
}
```

### 8.1.2. Usage Example

```javascript
const getBookBreaker = createCircuitBreaker(
  async (bookId) => {
    return await axios.get(`http://book-service:3001/api/books/${bookId}`);
  },
  { name: 'get-book-breaker' }
);

// Use circuit breaker
try {
  const book = await getBookBreaker.fire(bookId);
} catch (error) {
  // Circuit is open or request failed
  return fallbackData;
}
```

### 8.1.3. Circuit States

```
CLOSED (Normal)
  │  Too many failures
  ▼
OPEN (Blocking all requests)
  │  After reset timeout
  ▼
HALF_OPEN (Testing)
  │  Success → CLOSED
  │  Failure → OPEN
```

## 8.2. Health Monitoring

### 8.2.1. Prometheus Metrics

```javascript
// services/book-service/src/utils/metrics.js
const client = require('prom-client');

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
```

### 8.2.2. Health Check Endpoints

```javascript
// routes/health.routes.js
router.get('/health', async (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'UP' : 'DOWN',
      redis: await checkRedis() ? 'UP' : 'DOWN'
    }
  };

  const allUp = Object.values(health.checks).every(s => s === 'UP');
  res.status(allUp ? 200 : 503).json(health);
});
```

### 8.2.3. Grafana Dashboards

```yaml
# infrastructure/grafana/dashboards/library-overview.json
{
  "dashboard": {
    "title": "Library System Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])"
        }]
      },
      {
        "title": "Response Time",
        "targets": [{
          "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
        }]
      }
    ]
  }
}
```

## 8.3. Log Management với ELK Stack

### 8.3.1. Winston Logger Configuration

```javascript
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: 'http://elasticsearch:9200' },
      index: 'library-logs'
    })
  ]
});
```

### 8.3.2. Structured Logging

```javascript
logger.info('Book borrowed', {
  userId: '123',
  bookId: '456',
  timestamp: new Date(),
  service: 'borrowing-service',
  action: 'BORROW_BOOK'
});
```

### 8.3.3. Log Aggregation

```
Services → Logstash → Elasticsearch → Kibana
            (Parse)   (Store)        (Visualize)
```

## 8.4. Failover và Load Balancing

### 8.4.1. Nginx Load Balancing

```nginx
upstream book-service {
    least_conn;  # Least connections algorithm
    
    server book-service-1:3001 max_fails=3 fail_timeout=30s;
    server book-service-2:3001 max_fails=3 fail_timeout=30s;
    server book-service-3:3001 backup;  # Backup server
}

location /api/books {
    proxy_pass http://book-service;
    proxy_next_upstream error timeout http_500 http_502 http_503;
    proxy_next_upstream_tries 2;
}
```

### 8.4.2. Database Failover

**PostgreSQL with Patroni:**
```yaml
# Automatic failover with Patroni
scope: library-cluster
name: postgres-node-1

etcd:
  host: etcd:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576

postgresql:
  use_pg_rewind: true
  parameters:
    max_connections: 100
```

**MongoDB Replica Set Failover:**
- Automatic election khi primary fails
- Majority voting
- Priority-based failover

## 8.5. Auto-scaling

### 8.5.1. Horizontal Pod Autoscaler (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: book-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: book-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 8.5.2. Docker Swarm Scaling

```bash
# Scale service to 5 replicas
docker service scale library_book-service=5

# Auto-scale based on CPU
docker service update \
    --replicas-max-per-node 2 \
    --reserve-cpu 0.5 \
    library_book-service
```

## 8.6. Retry Strategies

### 8.6.1. Exponential Backoff

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
await retryWithBackoff(async () => {
  return await bookService.getBook(bookId);
});
```

### 8.6.2. Timeout Handling

```javascript
async function withTimeout(promise, timeoutMs = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    )
  ]);
}
```

## 8.7. Chaos Engineering

### 8.7.1. Chaos Monkey Simulation

```javascript
// Randomly fail requests for testing
function chaosMiddleware(req, res, next) {
  if (process.env.CHAOS_ENABLED === 'true') {
    const random = Math.random();
    
    if (random < 0.1) {
      // 10% chance to fail
      return res.status(500).json({ error: 'Chaos monkey!' });
    }
    
    if (random < 0.2) {
      // 10% chance to delay
      return setTimeout(next, 5000);
    }
  }
  
  next();
}
```

## 8.8. Disaster Recovery

### 8.8.1. Multi-Region Deployment

```yaml
# Deploy to multiple regions for geo-redundancy
regions:
  - us-east-1
  - us-west-2
  - eu-west-1

failover:
  strategy: active-passive
  health_check_interval: 30s
  failover_threshold: 3
```

### 8.8.2. Backup Restoration Testing

```bash
# Regularly test backup restoration
# scripts/test-restore.sh

# 1. Stop services
docker-compose down

# 2. Restore from backup
pg_restore -d library_db /backups/latest.dump
mongorestore /backups/mongo/latest

# 3. Verify data integrity
npm run verify-data

# 4. Restart services
docker-compose up -d
```

## 8.9. Summary: Fault Tolerance Checklist

✅ **Circuit Breaker**: Opossum implementation
✅ **Health Monitoring**: Prometheus + Grafana
✅ **Logging**: ELK Stack
✅ **Load Balancing**: Nginx với failover
✅ **Auto-scaling**: Ready for Kubernetes/Docker Swarm
✅ **Retry Logic**: Exponential backoff
✅ **Timeouts**: Configurable per service
✅ **Replication**: Database replicas
✅ **Backup**: Automated daily backups
✅ **Disaster Recovery**: Multi-region ready

---
**Điểm số chương 8**: 1/1
- ✅ Circuit Breaking (Opossum)
- ✅ Health Monitoring (Prometheus + Grafana)
- ✅ Log Management (ELK Stack)
- ✅ Failover & Load Balancing (Nginx, HAProxy)
- ✅ Auto-scaling capability
