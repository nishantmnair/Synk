#!/bin/bash
# PostgreSQL Automated Backup Script
# Run daily via cron: 0 2 * * * /path/to/backup.sh
# Or via systemd timer

set -e

# Configuration
BACKUP_DIR="/backups"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-synk_db}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/synk_backup_$TIMESTAMP.sql.gz"

# Logging
LOG_FILE="$BACKUP_DIR/backup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting PostgreSQL backup..."

# Check if database is accessible
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    log "ERROR: Cannot connect to database at $DB_HOST:$DB_PORT"
    exit 1
fi

# Create backup
if PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    | gzip > "$BACKUP_FILE"; then
    
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✅ Backup successful: $BACKUP_FILE ($SIZE)"
    
    # Verify backup integrity
    if gzip -t "$BACKUP_FILE" 2>/dev/null; then
        log "✅ Backup verified: File is not corrupted"
    else
        log "❌ ERROR: Backup file is corrupted!"
        exit 1
    fi
else
    log "❌ Backup failed!"
    exit 1
fi

# Delete old backups (keep only last N days)
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "synk_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -type f -name "synk_backup_*.sql.gz" | wc -l)
log "Current backups: $BACKUP_COUNT"

log "Backup process completed successfully!"
