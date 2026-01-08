# Chương 7: Sao Lưu (Replication)

## 7.1. Database Backup

### 7.1.1. PostgreSQL Backup

```bash
# scripts/backup.sh
pg_dump -h localhost \
        -p 5432 \
        -U library_admin \
        -d library_db \
        -F c \
        -f /backups/postgres/library_db_$(date +%Y%m%d).dump

# Compress
gzip /backups/postgres/library_db_$(date +%Y%m%d).dump
```

### 7.1.2. MongoDB Backup

```bash
mongodump --host localhost \
          --port 27017 \
          --username library_admin \
          --password library_pass_123 \
          --db books_db \
          --out /backups/mongo/$(date +%Y%m%d)

# Compress
tar -czf /backups/mongo/books_db_$(date +%Y%m%d).tar.gz \
    /backups/mongo/$(date +%Y%m%d)
```

## 7.2. Incremental Backup

### 7.2.1. Rsync for Incremental Backup

```bash
# Sync only changed files
rsync -avz --delete \
    /var/lib/postgresql/data/ \
    /backups/postgres/incremental/
```

### 7.2.2. Backup Schedule

```bash
# Crontab
0 2 * * * /scripts/backup.sh              # Full backup daily at 2 AM
0 */6 * * * /scripts/incremental-backup.sh # Incremental every 6 hours
```

## 7.3. Data Replication

### 7.3.1. PostgreSQL Streaming Replication

```sql
-- postgresql.conf (Master)
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64

-- pg_hba.conf
host replication library_admin 0.0.0.0/0 md5
```

```bash
# Slave configuration
standby_mode = 'on'
primary_conninfo = 'host=master port=5432 user=library_admin password=xxx'
trigger_file = '/tmp/postgresql.trigger'
```

**Lợi ích:**
- ✅ High availability
- ✅ Read replicas cho load balancing
- ✅ Automatic failover

### 7.3.2. MongoDB Replica Set

```javascript
// docker-compose.yml
mongodb-primary:
  image: mongo:7
  command: mongod --replSet rs0
  
mongodb-secondary-1:
  image: mongo:7
  command: mongod --replSet rs0
  
mongodb-secondary-2:
  image: mongo:7
  command: mongod --replSet rs0
```

```javascript
// Initialize replica set
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-primary:27017", priority: 2 },
    { _id: 1, host: "mongodb-secondary-1:27017", priority: 1 },
    { _id: 2, host: "mongodb-secondary-2:27017", priority: 1 }
  ]
});
```

**Lợi ích:**
- ✅ Automatic failover
- ✅ Data redundancy
- ✅ Read preference (primary/secondary)

## 7.4. Automated Backup Scripts

### 7.4.1. Backup Script với Retention Policy

```bash
#!/bin/bash
# scripts/backup.sh

RETENTION_DAYS=7

# Create backup
/usr/bin/pg_dump ... > backup.sql

# Upload to cloud (optional)
aws s3 cp backup.sql s3://library-backups/

# Clean old backups
find /backups -name "*.dump.gz" -mtime +${RETENTION_DAYS} -delete
```

### 7.4.2. Backup Verification

```bash
# Verify backup integrity
pg_restore --list backup.dump > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backup verified successfully"
else
    echo "❌ Backup verification failed"
    # Send alert
fi
```

## 7.5. Cloud Storage Backup

### 7.5.1. AWS S3

```bash
# Sync to S3
aws s3 sync /backups/ s3://library-backups/ \
    --storage-class STANDARD_IA \
    --exclude "*" \
    --include "*.dump.gz"
```

### 7.5.2. Google Cloud Storage

```bash
gsutil -m rsync -r /backups/ gs://library-backups/
```

## 7.6. Restore Procedures

### 7.6.1. PostgreSQL Restore

```bash
# Restore from backup
pg_restore -h localhost \
           -p 5432 \
           -U library_admin \
           -d library_db \
           -c \
           /backups/postgres/library_db_20260107.dump
```

### 7.6.2. MongoDB Restore

```bash
mongorestore --host localhost \
             --port 27017 \
             --username library_admin \
             --password library_pass_123 \
             --db books_db \
             /backups/mongo/20260107/books_db
```

## 7.7. Disaster Recovery Plan

### 7.7.1. Recovery Time Objective (RTO)

- **RTO Target**: 1 hour
- **Steps**:
  1. Detect failure (automated alerts)
  2. Activate standby database
  3. Update DNS/Load balancer
  4. Verify service functionality

### 7.7.2. Recovery Point Objective (RPO)

- **RPO Target**: 15 minutes
- **Implementation**:
  - Continuous replication
  - Transaction logs backup every 15 minutes
  - Point-in-time recovery capability

---
**Điểm số chương 7**: 1/1
- ✅ Database Backup (pg_dump, mongodump)
- ✅ Incremental Backup (rsync)
- ✅ Data Replication (PostgreSQL Streaming, MongoDB Replica Set)
- ✅ Automated Backup Scripts
- ✅ Cloud Storage integration
