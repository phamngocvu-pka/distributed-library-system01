# 🚀 Hướng Dẫn Cài Đặt và Chạy

## Yêu Cầu Hệ Thống

### Phần mềm cần thiết:
- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Node.js** >= 18.0 (nếu chạy local không dùng Docker)
- **npm** >= 9.0

### Phần cứng khuyến nghị:
- **RAM**: >= 8GB (16GB recommended)
- **CPU**: >= 4 cores
- **Disk**: >= 20GB free space

## Cài Đặt

### Option 1: Chạy với Docker Compose (Khuyến nghị)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd distributed-library-system

# 2. Copy environment variables
cp services/book-service/.env.example services/book-service/.env
cp services/user-service/.env.example services/user-service/.env
cp services/borrowing-service/.env.example services/borrowing-service/.env
cp services/notification-service/.env.example services/notification-service/.env

# 3. Build và khởi động tất cả services
docker-compose up -d --build

# 4. Kiểm tra logs
docker-compose logs -f

# 5. Kiểm tra health
bash scripts/health-check.sh
```

**Chờ khoảng 2-3 phút** để tất cả services khởi động hoàn toàn.

### Option 2: Chạy Local với PM2

```bash
# 1. Install dependencies cho tất cả services
npm run install:all

# 2. Start infrastructure với Docker
docker-compose up -d postgres mongodb redis rabbitmq kafka consul prometheus grafana elasticsearch logstash kibana

# 3. Start services với PM2
npm run start:pm2

# 4. Xem logs
pm2 logs

# 5. Monitor
pm2 monit
```

### Option 3: Chạy từng service riêng (Development)

```bash
# Terminal 1 - Infrastructure
docker-compose up -d postgres mongodb redis rabbitmq kafka

# Terminal 2 - Book Service
cd services/book-service
npm install
npm run dev

# Terminal 3 - User Service
cd services/user-service
npm install
npm run dev

# Terminal 4 - Borrowing Service
cd services/borrowing-service
npm install
npm run dev

# Terminal 5 - Notification Service
cd services/notification-service
npm install
npm run dev
```

## Truy Cập Hệ Thống

### Services:
- **API Gateway**: http://localhost:3000
- **Book Service**: http://localhost:3001
- **User Service**: http://localhost:3002
- **Borrowing Service**: http://localhost:3003
- **Notification Service**: http://localhost:3004

### Monitoring & Management:
- **Grafana**: http://localhost:3005 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601
- **Consul UI**: http://localhost:8500
- **RabbitMQ Management**: http://localhost:15672 (library_admin/library_pass_123)

### Databases:
- **PostgreSQL**: localhost:5432
  - Database: `library_db`
  - User: `library_admin`
  - Password: `library_pass_123`

- **MongoDB**: localhost:27017
  - Database: `books_db`
  - User: `library_admin`
  - Password: `library_pass_123`

- **Redis**: localhost:6379
  - Password: `library_pass_123`

## Kiểm Tra Cài Đặt

### 1. Health Check

```bash
# Tự động kiểm tra tất cả services
bash scripts/health-check.sh

# Hoặc manual
curl http://localhost:3001/health  # Book Service
curl http://localhost:3002/health  # User Service
curl http://localhost:3003/health  # Borrowing Service
curl http://localhost:3004/health  # Notification Service
```

### 2. Test API

```bash
# Get all books
curl http://localhost:3000/api/books

# Create a book (cần authentication)
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Book",
    "author": "Test Author",
    "isbn": "978-0000000000",
    "totalCopies": 5
  }'
```

### 3. View Metrics

```bash
# Prometheus metrics
curl http://localhost:3001/metrics
```

## Quản Lý

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart book-service

# Rebuild a service
docker-compose up -d --build book-service

# Remove all containers and volumes
docker-compose down -v
```

### PM2 Commands

```bash
# Start all services
pm2 start ecosystem.config.js

# Stop all
pm2 stop all

# Restart all
pm2 restart all

# Delete all
pm2 delete all

# Monitor
pm2 monit

# View logs
pm2 logs [service-name]

# Reload without downtime
pm2 reload all
```

## Backup và Restore

### Manual Backup

```bash
# Run backup script
bash scripts/backup.sh

# Backups được lưu tại:
# - PostgreSQL: /backups/postgres/
# - MongoDB: /backups/mongo/
```

### Scheduled Backup (Cron)

```bash
# Add to crontab
crontab -e

# Backup hàng ngày lúc 2h sáng
0 2 * * * /path/to/scripts/backup.sh

# Incremental backup mỗi 6 tiếng
0 */6 * * * /path/to/scripts/incremental-backup.sh
```

### Restore Database

```bash
# PostgreSQL
pg_restore -h localhost -p 5432 -U library_admin -d library_db /backups/postgres/library_db_20260107.dump

# MongoDB
mongorestore --host localhost --port 27017 --username library_admin --password library_pass_123 --db books_db /backups/mongo/20260107/books_db
```

## Troubleshooting

### Lỗi: Port đã được sử dụng

```bash
# Kiểm tra port nào đang dùng
lsof -i :3000
lsof -i :5432

# Kill process
kill -9 <PID>

# Hoặc thay đổi port trong docker-compose.yml
```

### Lỗi: Container không start

```bash
# Xem logs
docker-compose logs [service-name]

# Xóa và tạo lại
docker-compose down -v
docker-compose up -d --build
```

### Lỗi: Out of Memory

```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory

# Hoặc giảm số instances trong ecosystem.config.js
instances: 1  # Thay vì 2
```

### Lỗi: Database connection failed

```bash
# Đảm bảo databases đã sẵn sàng
docker-compose logs postgres
docker-compose logs mongodb

# Restart services
docker-compose restart book-service user-service borrowing-service
```

## Development Tips

### Hot Reload

```bash
# Sử dụng nodemon cho development
cd services/book-service
npm run dev  # Tự động reload khi code thay đổi
```

### Debug Mode

```javascript
// Thêm vào .env
NODE_ENV=development
LOG_LEVEL=debug
```

### Test API với Postman

Import collection từ `docs/postman_collection.json` (nếu có)

## Production Deployment

### Security Checklist

- [ ] Đổi tất cả passwords mặc định
- [ ] Sử dụng SSL/TLS certificates thật
- [ ] Enable firewall
- [ ] Giới hạn database access
- [ ] Enable authentication cho Consul, Prometheus, Grafana
- [ ] Sử dụng secrets management (Vault, AWS Secrets Manager)
- [ ] Enable rate limiting
- [ ] Regular security updates

### Performance Tuning

```javascript
// ecosystem.config.js
{
  instances: 'max',  // Sử dụng tất cả CPU cores
  exec_mode: 'cluster',
  max_memory_restart: '1G'
}
```

### Monitoring Setup

1. Configure Grafana dashboards
2. Setup alerts trong Prometheus
3. Configure log retention trong Elasticsearch
4. Setup external monitoring (Datadog, New Relic, etc.)

## Tài Liệu Tham Khảo

- [API Documentation](./docs/api-documentation.md)
- [Architecture Overview](./docs/chapter-02-architecture.md)
- [Fault Tolerance](./docs/chapter-08-fault-tolerance.md)

## Support

Nếu gặp vấn đề, kiểm tra:
1. Logs: `docker-compose logs -f`
2. Health checks: `bash scripts/health-check.sh`
3. System resources: `docker stats`
4. Documentation trong thư mục `docs/`
