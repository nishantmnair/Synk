# Security Incident Response Plan

## 🚨 Incident Response Procedures

### Severity Levels

| Level | Impact | Response Time | Examples |
|-------|--------|----------------|----------|
| 🔴 **Critical** | System down / data exposed | Immediate | DB breach, ransomware, DDoS |
| 🟠 **High** | Partial outage / security risk | 1 hour | One service down, auth bypass attempt |
| 🟡 **Medium** | Performance issue / suspicious activity | 4 hours | Rate limit spike, auth failure surge |
| 🟢 **Low** | Minor issue / monitoring | 24 hours | Slow API, low disk space warning |

---

## 🔴 CRITICAL - Active Breach/Compromise

### Immediate Actions (First 5 Minutes)

1. **STOP** - Take systems offline
   ```bash
   docker-compose -f docker-compose.production.yml down
   ```

2. **PRESERVE** - Save all logs
   ```bash
   docker-compose logs --no-color > /tmp/incident_logs.txt
   tar -czf /tmp/incident_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/lib/docker/volumes/*
   ```

3. **NOTIFY** - Alert team immediately
   - Call: [On-Call Phone]
   - Slack: #security-incident
   - Email: security@yourdomain.com

4. **ASSESS** - Determine breach scope
   - What was accessed? (API logs)
   - When did it start? (Check logs for first suspicious activity)
   - Who has been affected? (Check auth tokens, user accounts)

### Containment (First Hour)

5. **REVOKE** - Invalidate all tokens/sessions
   ```bash
   # Delete all JWT tokens from Redis (if using)
   # Or force logout all users by clearing sessions
   
   docker-compose exec db psql -U ${DB_USER} -d ${DB_NAME} <<EOF
   -- Invalidate all sessions
   DELETE FROM authtoken_token;
   DELETE FROM tokenblacklist_blacklistedtoken;
   EOF
   ```

6. **CHANGE** - Rotate all credentials
   ```bash
   # Generate new SECRET_KEY
   python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
   
   # Generate new passwords for:
   # - Database user
   # - Admin account
   # - API keys (Gemini, email, etc.)
   
   # Update .env.production with new credentials
   ```

7. **ISOLATE** - Disconnect from internet if needed
   ```bash
   # Stop external communications temporarily
   # Keep investigation access only
   ```

### Investigation (First 24 Hours)

8. **ANALYZE** - Examine logs and code
   ```bash
   # Check recent deployments
   git log --oneline -10
   
   # Review access logs for anomalies
   cat /var/log/nginx/access.log | grep "2026-02-11" | sort | uniq -c | sort -rn
   
   # Check for modified files
   find /app -type f -mtime -1 -ls
   ```

9. **AUDIT** - Database integrity check
   ```bash
   docker-compose exec db psql -U ${DB_USER} -d ${DB_NAME} <<EOF
   -- Check for suspicious user accounts
   SELECT * FROM auth_user WHERE date_joined > NOW() - INTERVAL '24 hours';
   
   -- Check for unusual API calls
   SELECT * FROM api_activity WHERE created_at > NOW() - INTERVAL '24 hours' ORDER BY created_at DESC;
   EOF
   ```

10. **FORENSICS** - External security firm (if major breach)
    - Contact: [Security Firm Contact Info]
    - Provide: All logs, code changes, affected data list

### Recovery (Hour 4+)

11. **PATCH** - Fix vulnerability
    - Update code if compromised
    - Apply security patches
    - Review and strengthen authentication

12. **RESTORE** - From known-good backup
    ```bash
    # If data was corrupted
    docker-compose exec db psql -U ${DB_USER} -d ${DB_NAME} < ./backups/synk_backup_YYYYMMDD.sql
    
    # Verify data integrity
    docker-compose exec backend python manage.py check
    ```

13. **REBUILD** - Redeploy from scratch
    ```bash
    docker-compose -f docker-compose.production.yml build --no-cache
    docker-compose -f docker-compose.production.yml up -d
    
    # Run migrations
    docker-compose exec backend python manage.py migrate
    ```

14. **RESTART** - Bring system online
    ```bash
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for health checks
    docker-compose ps
    ```

### Post-Incident (Day 2+)

15. **NOTIFY USERS** - If data was exposed
    - Send notification email within 24-72 hours
    - Include: What happened, what was accessed, what to do (password reset, etc.)
    - Keep it factual, don't minimize

16. **DOCUMENT** - Create incident report
    ```markdown
    ## Incident Report - [Date]
    
    ### Timeline
    - 14:32 - Detection: Rate limiting alerts triggered
    - 14:35 - Alerting: Team notified
    - 14:40 - Response: Systems taken offline
    - 15:15 - Investigation: Breach confirmed
    - 16:00 - Containment: Credentials rotated
    - 17:30 - Recovery: System restored
    
    ### Root Cause
    [Describe what happened]
    
    ### Impact
    - X users affected
    - Y data records accessed
    - Z hours of downtime
    
    ### Prevention
    [What changed to prevent recurrence]
    ```

17. **PREVENT** - Implement fixes
    - For breach: Add 2FA, MFA, or stronger auth
    - For DDoS: Implement rate limiting, WAF
    - For injection: Add input validation, WAF
    - Update security policies

18. **MONITOR** - Enhanced surveillance
    ```bash
    # Increase log verbosity temporarily
    LOG_LEVEL=DEBUG
    
    # Monitor for similar attacks
    watch -n 5 'tail -20 /var/log/nginx/access.log | grep -i "' union\|select\|script\|etc/passwd'
    ```

---

## 🟠 HIGH - One Service Down

### Response (1 Hour)

1. **IDENTIFY** - Which service?
   ```bash
   docker-compose ps
   docker-compose logs backend | tail -50
   docker-compose logs db | tail -50
   ```

2. **RESTART** - Try simple restart
   ```bash
   docker-compose restart backend
   # or
   docker-compose restart db
   ```

3. **CHECK** - Is it a resource issue?
   ```bash
   docker stats
   # If disk full: docker system prune -a
   # If memory full: Increase resource limits
   ```

4. **RESTORE** - If corrupted
   ```bash
   docker-compose down
   docker-compose -f docker-compose.production.yml up -d
   ```

5. **NOTIFY** - If service remains down > 15 min
   - Post status page update
   - Send notification email to users
   - Post on status.yourdomain.com

---

## 🟡 MEDIUM - Performance Degradation

### Response (4 Hours)

1. **INVESTIGATE**
   ```bash
   # Check which endpoint is slow
   tail -f /var/log/nginx/access.log | grep -v "200 "
   
   # Check database performance
   docker-compose logs db | grep "slow query"
   
   # Check server resources
   docker stats
   ```

2. **ANALYZE** - Is it a query?
   ```bash
   # Enable query logging
   LOG_LEVEL=DEBUG  # in .env
   
   # Find slow queries
   tail -1000 /var/log/django.log | grep "Query.*ms"
   ```

3. **FIX** - Add indexing or caching
   - Add database index if missing
   - Clear cache: `docker-compose exec backend python manage.py clearcache`
   - Restart if memory leak suspected

---

## 🟢 LOW - Minor Issues

### Examples
- One user can't login (check password reset)
- Slow email delivery (check SMTP)
- Missing CSS (clear browser cache)

### Response
- Check logs: `docker-compose logs [service] | grep error`
- Restart container if needed
- Monitor but don't escalate unless pattern emerges

---

## 📊 Monitoring & Early Detection

### Watch These Metrics

```bash
# Rate limit violations (DDos attempt)
grep "429 Too Many Requests" /var/log/nginx/access.log | wc -l

# Authentication failures (Brute force)
grep "401\|403" /var/log/nginx/access.log | wc -l

# Database errors
docker-compose logs db | grep "ERROR\|FATAL"

# High CPU/Memory
docker stats --no-stream | grep "Backend\|Database"

# Disk space
df -h | grep "/var\|/app\|/backups"
```

### Set Up Alerts (Optional)

```bash
# Email alert on high error rate
*/5 * * * * if [ $(grep "500" /var/log/nginx/access.log | wc -l) -gt 10 ]; then echo "High error rate" | mail admin@yourdomain.com; fi
```

---

## 📞 Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Security Lead | [Name] | [Phone] | [Email] |
| CTO/Tech Lead | [Name] | [Phone] | [Email] |
| DevOps | [Name] | [Phone] | [Email] |
| On-Call (24/7) | [Rotation] | [Phone] | [Email] |

---

## 🔐 Critical Credentials (Store Securely)

- [ ] Database password (encrypted backup)
- [ ] SSL certificate private key (encrypted)
- [ ] Admin accounts recovery codes (encrypted)
- [ ] API key backups (encrypted)
- [ ] Backup encryption key (encrypted, separate storage)

**Never store credentials in this document.** Use encrypted password manager (BitWarden, LastPass, 1Password).

---

## ✅ Incident Response Checklist

After any incident:
- [ ] Root cause identified
- [ ] Security patches applied
- [ ] All credentials rotated
- [ ] Code review completed
- [ ] Monitoring enhanced
- [ ] Documentation updated
- [ ] Team trained on prevention
- [ ] Post-mortem meeting held
- [ ] Status page updated
- [ ] Users notified (if applicable)

---

## 📖 References

- [NIST Cybersecurity Incident Handling Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf)
- [OWASP Incident Response](https://owasp.org/www-community/attacks/Incident_Research)
- [DigitalOcean Incident Response Guide](https://www.digitalocean.com/blog/incident-response-for-web-applications)

---

**Last Updated**: February 11, 2026
**Review Schedule**: Quarterly
**Next Drill**: May 11, 2026
