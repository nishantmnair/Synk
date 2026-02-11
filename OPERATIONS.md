# Day-to-Day Operations Guide

## 📊 Daily Tasks (5-10 min)

### Morning Check-in (9 AM)
```bash
# Check system health
docker-compose ps
# Expected: All services "Up"

# Check error rate
curl -I https://yourdomain.com
# Expected: 200 OK, security headers present

# Monitor disk usage
df -h /
# Expected: < 80% full

# Check backup from previous night
ls -lh ./backups/synk_backup_*.sql.gz | head -1
# Expected: Recent file (within last 24h), 5-50MB
```

### End of Day Check (5 PM)
```bash
# Overall status
docker-compose ps

# Error rate (last 8 hours)
docker-compose logs --timestamps --since 8h backend | grep -i error | wc -l

# Database connections (should be <20)
docker-compose logs db | tail -5
```

---

## 📅 Weekly Tasks (30 min)

### Monday Morning
```bash
# Review logs for anomalies
docker-compose logs backend | grep -i "error\|warning" | tail -20

# Check for failed backups
ls -lh ./backups/synk_backup_*.sql.gz | tail -7
# Expected: 7 files (one per day)

# Monitor response times (should be <500ms)
docker-compose logs backend | grep "request:" | tail -5
```

### Friday Afternoon (Before Weekend)
```bash
# Verify backup works
gzip -t ./backups/synk_backup_$(date +%Y%m%d -d "yesterday").sql.gz
# Expected: No errors

# Check certificate expiration (if using Let's Encrypt)
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -noout -dates
# Expected: notAfter is > 30 days away

# Review rate limiting stats
docker-compose logs backend | grep "RATE_LIMIT" | wc -l
# Expected: Close to 0 (no excessive rate limiting)
```

---

## 🔄 Monthly Tasks (1-2 hours)

### First of Month
```bash
# Detailed security audit
./pre-deployment-security-check.sh
# Expected: All checks pass

# Dependency updates
pip list --outdated
npm outdated
# Review and plan updates

# Review access logs for suspicious patterns
tail -10000 /var/log/nginx/access.log | grep -E "\.php|\.jsp|admin|wp-" | wc -l
# Expected: 0 (no attempts to access common exploit paths)
```

### Mid-Month
```bash
# Test backup restore (IMPORTANT!)
# Restore to test database and verify
# See BACKUP_SETUP.md for procedure

# Check password strength on admin accounts
# Consider rotating admin password

# Review user activity
docker-compose exec backend python manage.py dbshell
# SELECT COUNT(*) FROM api_activity WHERE created_at > NOW() - INTERVAL '30 days';
# SELECT user_id, COUNT(*) FROM api_activity GROUP BY user_id ORDER BY COUNT DESC LIMIT 10;
```

### End of Month
```bash
# Generate usage report
# Check active users, API calls, data size
docker-compose exec backend python manage.py dbshell << EOF
SELECT COUNT(DISTINCT user_id) as active_users FROM api_activity WHERE created_at > NOW() - INTERVAL '30 days';
SELECT COUNT(*) as total_api_calls FROM api_activity WHERE created_at > NOW() - INTERVAL '30 days';
SELECT pg_size_pretty(sum(heap_blks_total) * 8 * 1024) as db_size FROM heap_blks_index;
EOF

# Review costs (cloud storage/services)
# Update security policy if needed
# Plan for next month
```

---

## 🛡️ Security Review (Quarterly)

### Q1/Q2/Q3/Q4 (90-120 min)

```bash
# 1. Security audit
./pre-deployment-security-check.sh

# 2. Dependency vulnerability scan
pip-audit
npm audit

# 3. OWASP ZAP scan (if available)
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://yourdomain.com

# 4. Database security
# - Check for unused users/roles
# - Review permissions
# - Verify encryption at rest

# 5. Access log analysis (last 90 days)
# - Identify anomalous patterns
# - Check for brute force attempts
# - Review admin access logs

# 6. Security policy update
# - Review and update SECURITY.md
# - Update incident response procedures
# - Train team on latest threats

# 7. Test disaster recovery
# - Restore from backup to test database
# - Verify data integrity
# - Time the restore (target: < 2 hours)
```

---

## 📈 Performance Optimization

### When Response Times > 500ms

```bash
# 1. Identify slow endpoints
docker-compose logs backend | grep "request_time:" | sort -t: -k2 -rn | head -10

# 2. Check database performance
# Enable slow query log
docker-compose exec db psql -U ${DB_USER} -d ${DB_NAME} <<EOF
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 second
SELECT pg_reload_conf();
EOF

# 3. Monitor for N+1 queries
# Review ORM queries in views.py

# 4. Add caching if needed
# Implement Redis caching for frequently accessed data

# 5. Check for missing indexes
# Analyze query plans and add indexes as needed
```

### When Storage Usage Growing Too Fast

```bash
# 1. Check what's taking space
docker exec synk_db du -sh /var/lib/postgresql/data/*

# 2. Check for large tables
docker-compose exec db psql -U ${DB_USER} -d ${DB_NAME} <<EOF
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
EOF

# 3. Archive old data if applicable
# Implement data retention policy
# Example: DELETE FROM api_activity WHERE created_at < NOW() - INTERVAL '1 year';

# 4. Vacuum database (cleanup)
docker-compose exec db psql -U ${DB_USER} -d ${DB_NAME} -c "VACUUM ANALYZE;"
```

---

## 🚀 Scaling Decisions

### When to Scale - Decision Tree

```
Users > 1000?
├─ Yes: Consider load balancing
│   └─ Add nginx upstream with multiple backend instances
└─ No: Continue monitoring

Response times > 1s?
├─ Yes: Add caching (Redis)
│   └─ Cache Django page views, ORM queries
└─ No: Continue monitoring

Database CPU > 80%?
├─ Yes: Add connection pooling (pgBouncer)
│   └─ Implement PgBouncer between app and DB
└─ No: Continue monitoring

Disk usage > 80%?
├─ Yes: Implement data archiving
│   └─ Archive old data to S3
└─ No: Continue monitoring

Error rate > 1%?
├─ Yes: Increase logging, identify bottleneck
│   └─ May need horizontal scaling
└─ No: Continue monitoring
```

---

## 🔧 Common Maintenance Tasks

### Adding a New Admin User

```bash
docker-compose exec backend python manage.py createsuperuser
# Follow prompts
```

### Clearing Application Cache

```bash
docker-compose exec backend python manage.py clearcache
```

### Running Database Migrations

```bash
# After code update
docker-compose exec backend python manage.py migrate
```

### Restarting Services (Graceful)

```bash
# Graceful restart - no downtime if using multiple instances
docker-compose restart backend

# Or full restart with downtime
docker-compose down
docker-compose up -d
```

### Viewing Logs

```bash
# Real-time logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail 100 backend

# Logs from last hour
docker-compose logs --timestamps --since 1h backend
```

---

## 🚨 Emergency Procedures

### Service Down - Quick Recovery

```bash
# Step 1: Check what's wrong
docker-compose ps
docker-compose logs backend | tail -50

# Step 2: Try restart
docker-compose restart backend

# Step 3: Check health
curl https://yourdomain.com/health/

# Step 4: If still down, escalate
# Contact DevOps/On-Call
```

### Disk Full Emergency

```bash
# Clean Docker system
docker system prune -a
docker volume prune

# Check what's using space
du -sh /var/lib/docker/*
du -sh /app/*
du -sh ./backups/*

# If backups too large
# Move old backups to cloud storage
# Archive: tar -czf old_backups.tar.gz ./backups/synk_backup_202501*.sql.gz
```

### Database Connection Limit Reached

```bash
# Check connections
docker-compose logs db | grep "max_connections"

# Show current connections
docker-compose exec db psql -U ${DB_USER} -d ${DB_NAME} -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Kill idle connections
docker-compose exec db psql -U ${DB_USER} -d ${DB_NAME} <<EOF
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND query_start < NOW() - INTERVAL '30 minutes';
EOF
```

---

## 📝 Runbooks

### Full System Backup & Restore

See [BACKUP_SETUP.md](./BACKUP_SETUP.md)

### Incident Response

See [INCIDENTS.md](./INCIDENTS.md)

### Security Procedures

See [SECURITY.md](./SECURITY.md)

---

## 📋 Maintenance Checklist

### Weekly
- [ ] Check system health
- [ ] Verify backups created
- [ ] Review error logs

### Monthly
- [ ] Test backup restore
- [ ] Review security audit
- [ ] Check certificate expiration
- [ ] Analyze performance metrics

### Quarterly
- [ ] Full security scan
- [ ] Dependency audit
- [ ] Performance optimization review
- [ ] Disaster recovery drill

### Annually
- [ ] Full security assessment
- [ ] Penetration testing
- [ ] Policy review and update
- [ ] Team training

---

## 🔐 On-Call Rotation

Set up on-call schedule for:
- [ ] Production incident alerts
- [ ] Security notifications
- [ ] System health checks
- [ ] Emergency response

Use PagerDuty, Opsgenie, or similar service.

---

**Last Updated**: February 11, 2026
**Next Review**: May 11, 2026

For emergency: See [INCIDENTS.md](./INCIDENTS.md)
For backups: See [BACKUP_SETUP.md](./BACKUP_SETUP.md)
For security: See [SECURITY.md](./SECURITY.md)
