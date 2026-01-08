#!/bin/bash

# Distributed Library System - Automated Backup Script
# This script performs backups of PostgreSQL and MongoDB databases

set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=7

# PostgreSQL Configuration
PG_HOST="${POSTGRES_HOST:-localhost}"
PG_PORT="${POSTGRES_PORT:-5432}"
PG_USER="${POSTGRES_USER:-library_admin}"
PG_PASSWORD="${POSTGRES_PASSWORD:-library_pass_123}"
PG_DATABASE="${POSTGRES_DB:-library_db}"

# MongoDB Configuration
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_USER="${MONGO_USER:-library_admin}"
MONGO_PASSWORD="${MONGO_PASSWORD:-library_pass_123}"
MONGO_DATABASE="${MONGO_DATABASE:-books_db}"

# Create backup directory
mkdir -p "${BACKUP_DIR}/postgres" "${BACKUP_DIR}/mongo"

echo "==================================="
echo "Starting backup process..."
echo "Timestamp: ${TIMESTAMP}"
echo "==================================="

# Backup PostgreSQL
echo "📦 Backing up PostgreSQL database: ${PG_DATABASE}"
export PGPASSWORD="${PG_PASSWORD}"
pg_dump -h "${PG_HOST}" \
        -p "${PG_PORT}" \
        -U "${PG_USER}" \
        -d "${PG_DATABASE}" \
        -F c \
        -f "${BACKUP_DIR}/postgres/${PG_DATABASE}_${TIMESTAMP}.dump"

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL backup completed successfully"
    # Compress backup
    gzip "${BACKUP_DIR}/postgres/${PG_DATABASE}_${TIMESTAMP}.dump"
    echo "📦 Backup compressed"
else
    echo "❌ PostgreSQL backup failed"
    exit 1
fi

# Backup MongoDB
echo "📦 Backing up MongoDB database: ${MONGO_DATABASE}"
mongodump --host "${MONGO_HOST}" \
          --port "${MONGO_PORT}" \
          --username "${MONGO_USER}" \
          --password "${MONGO_PASSWORD}" \
          --authenticationDatabase admin \
          --db "${MONGO_DATABASE}" \
          --out "${BACKUP_DIR}/mongo/${MONGO_DATABASE}_${TIMESTAMP}"

if [ $? -eq 0 ]; then
    echo "✅ MongoDB backup completed successfully"
    # Compress backup
    tar -czf "${BACKUP_DIR}/mongo/${MONGO_DATABASE}_${TIMESTAMP}.tar.gz" \
        -C "${BACKUP_DIR}/mongo" "${MONGO_DATABASE}_${TIMESTAMP}"
    rm -rf "${BACKUP_DIR}/mongo/${MONGO_DATABASE}_${TIMESTAMP}"
    echo "📦 Backup compressed"
else
    echo "❌ MongoDB backup failed"
    exit 1
fi

# Clean up old backups (keep last RETENTION_DAYS days)
echo "🧹 Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}/postgres" -name "*.dump.gz" -type f -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}/mongo" -name "*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Calculate backup sizes
PG_SIZE=$(du -sh "${BACKUP_DIR}/postgres" | cut -f1)
MONGO_SIZE=$(du -sh "${BACKUP_DIR}/mongo" | cut -f1)

echo "==================================="
echo "Backup Summary:"
echo "PostgreSQL backup size: ${PG_SIZE}"
echo "MongoDB backup size: ${MONGO_SIZE}"
echo "Backup location: ${BACKUP_DIR}"
echo "==================================="
echo "✅ All backups completed successfully!"

# Optional: Upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
# Uncomment and configure as needed
# aws s3 sync "${BACKUP_DIR}" s3://your-bucket/library-backups/

exit 0
