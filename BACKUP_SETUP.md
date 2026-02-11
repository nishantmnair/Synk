# Automated Backup Setup Instructions

## For Docker Deployment

### Option 1: Backup via Systemd Service + Timer (Recommended)

Create `/etc/systemd/system/synk-backup.service`:
```ini
[Unit]
Description=Synk Database Backup
After=docker.service

[Service]
Type=oneshot
User=root
ExecStart=/usr/local/bin/synk-backup.sh
StandardOutput=journal
StandardError=journal
```

Create `/etc/systemd/system/synk-backup.timer`:
```ini
[Unit]
Description=Synk Database Backup Timer
Requires=synk-backup.service

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable synk-backup.timer
sudo systemctl start synk-backup.timer
sudo systemctl status synk-backup.timer
```

---

### Option 2: Cron Job

Add to `/etc/crontab`:
```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/synk-backup.sh >> /var/log/synk-backup.log 2>&1
```

Or in Docker:
```bash
# Copy script into container
crontab -e
# Add: 0 2 * * * /app/backup.sh
```

---

### Option 3: Docker Compose Service (Simplest)

Add to `docker-compose.production.yml`:

```yaml
  backup:
    image: postgres:15-alpine
    container_name: synk_backup
    environment:
      PGPASSWORD: ${DB_PASSWORD}
    volumes:
      - ./backups:/backups
      - ./backup.sh:/backup.sh:ro
    command: sh -c "apk add --no-cache bash && while true; do /backup.sh; sleep 86400; done"
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - synk-network
    # Don't expose ports - backup only
```

---

## Verification

### Check Backups Created
```bash
ls -lh ./backups/
# Should show: synk_backup_YYYYMMDD_HHMMSS.sql.gz files
```

### Test Restore (Important! - Monthly)
```bash
# Extract backup
zcat ./backups/synk_backup_latest.sql.gz > dump.sql

# Restore to test database
createdb synk_test
psql synk_test < dump.sql

# Verify data
psql synk_test -c "SELECT COUNT(*) FROM api_user;"

# Cleanup
dropdb synk_test
rm dump.sql
```

---

## Backup Storage Options

### Option A: Local Storage (Current)
✅ Pro: Simple, no cost
❌ Con: Lost if server failure

### Option B: S3 / Cloud Storage (Recommended)
```bash
# Install AWS CLI
apt-get install awscli

# In backup.sh, after creating backup:
aws s3 cp "$BACKUP_FILE" s3://your-bucket/synk-backups/
```

### Option C: External Hard Drive
```bash
# Mount: sudo mount /dev/sdb1 /mnt/backups
# In backup.sh: cp "$BACKUP_FILE" /mnt/backups/
```

---

## Monitoring Backups

### Check Backup Size Progression
```bash
ls -lh ./backups/synk_backup_* | grep $(date +%Y%m) | awk '{print $9, $5}'
```

### Set Up Email Alerts (Optional)
```bash
# After successful backup in backup.sh:
echo "Backup successful: $SIZE" | mail -s "Synk Backup Alert" admin@yourdomain.com
```

---

## Configure in .env.production

```env
# Backup Settings
RETENTION_DAYS=30
BACKUP_SCHEDULE=daily  # daily, weekly, monthly
BACKUP_TIME=02:00      # 2 AM
```

---

## Security Considerations

- ✅ Backups stored outside database container
- ✅ Compressed (gzip) to save space
- ✅ Timestamped for easy identification
- ❌ **Not encrypted** - Consider encrypting before uploading to cloud
- ❌ **Password in plaintext** - Use AWS credentials file instead of env vars for S3

### Encrypt Backups
```bash
# In backup.sh, after gzip:
openssl enc -aes-256-cbc -salt -in backup.sql.gz -out backup.sql.gz.enc -k "$ENCRYPTION_KEY"
```

---

## Disaster Recovery Test Schedule

- **Monthly**: Verify backup integrity (gzip -t)
- **Quarterly**: Full restore test to test database
- **Annually**: Disaster recovery drill (full system restore)

Record results in a log file.

