# Production Deployment Guide

Complete guide for deploying the Notion-style Kanban system backed by Odoo CE + OCA 18.

## Contract Version: 1.0.0

This version must be consistent across:
- Frontend: `/types/api-contract.ts`
- Backend: `/odoo-module/ipai_taskboard_api/services/mapping.py`
- All API responses: `x-contract-version` header

## Pre-Deployment Checklist

### Contract Lock

- [ ] Contract version frozen at `1.0.0`
- [ ] All CI gates passing:
  ```bash
  ./ci/validate-contract.sh
  ```
- [ ] JSON schemas validated against fixtures
- [ ] TypeScript types compile without errors
- [ ] Mock data conforms to contract

### Odoo Backend

- [ ] Odoo CE 18 installed
- [ ] `ipai_taskboard_api` module installed
- [ ] All dependencies present (base, project, mail, contacts)
- [ ] Database backed up
- [ ] Record rules tested
- [ ] ACL tested for all user roles

### Frontend

- [ ] Build passes: `npm run build`
- [ ] Contract version matches backend
- [ ] API client ready to swap mock → real
- [ ] Error handling for contract version mismatch

### Security

- [ ] Authentication method chosen (session/token)
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] CORS configured
- [ ] Input validation enabled
- [ ] SQL injection protection verified
- [ ] XSS protection verified

### Observability

- [ ] Structured logging configured
- [ ] Error tracking set up (Sentry/similar)
- [ ] Performance monitoring enabled
- [ ] Health check endpoint working
- [ ] Backup procedure tested

## Phase 1: Deploy Odoo Backend

### 1.1 Environment Setup

```bash
# Production environment variables
export ODOO_DB_NAME=taskboard_prod
export ODOO_DB_USER=odoo
export ODOO_DB_PASSWORD=<strong_password>
export ODOO_DB_HOST=postgres
export ODOO_DB_PORT=5432
export ODOO_ADMIN_PASSWD=<strong_admin_password>
export CONTRACT_VERSION=1.0.0
```

### 1.2 Install Odoo Module

```bash
# Copy module to Odoo addons directory
cp -r odoo-module/ipai_taskboard_api /opt/odoo/addons/

# Restart Odoo
systemctl restart odoo

# Install module via CLI
/opt/odoo/odoo-bin -c /etc/odoo/odoo.conf -i ipai_taskboard_api -d $ODOO_DB_NAME --stop-after-init

# Restart again
systemctl restart odoo
```

### 1.3 Verify Installation

```bash
# Check module is installed
psql -U $ODOO_DB_USER -d $ODOO_DB_NAME -c "SELECT name, state FROM ir_module_module WHERE name = 'ipai_taskboard_api';"

# Expected output: state = 'installed'
```

### 1.4 Test Endpoints

```bash
# Get session token (replace with your credentials)
SESSION=$(curl -s -X POST http://localhost:8069/web/session/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "params": {
      "db": "'$ODOO_DB_NAME'",
      "login": "admin",
      "password": "'$ODOO_ADMIN_PASSWD'"
    }
  }' | jq -r '.result.session_id')

# Test GET /boards
curl -X GET http://localhost:8069/api/v1/boards \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=$SESSION"

# Should return: {"boards": [...], "total": N, ...}
```

## Phase 2: Configure Reverse Proxy

### 2.1 Nginx Configuration

```nginx
# /etc/nginx/sites-available/taskboard

upstream odoo {
    server 127.0.0.1:8069;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_read:10m rate=1000r/m;
limit_req_zone $binary_remote_addr zone=api_write:10m rate=100r/m;

server {
    listen 443 ssl http2;
    server_name taskboard.example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/taskboard.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/taskboard.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # API endpoints with rate limiting
    location /api/v1 {
        # Read endpoints
        if ($request_method = GET) {
            limit_req zone=api_read burst=20 nodelay;
        }
        
        # Write endpoints
        if ($request_method ~ ^(POST|PATCH|DELETE)$) {
            limit_req zone=api_write burst=10 nodelay;
        }

        proxy_pass http://odoo;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Odoo web interface (admin)
    location / {
        proxy_pass http://odoo;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name taskboard.example.com;
    return 301 https://$host$request_uri;
}
```

### 2.2 Enable and Test

```bash
# Enable site
ln -s /etc/nginx/sites-available/taskboard /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Test via proxy
curl https://taskboard.example.com/health
# Expected: OK
```

## Phase 3: Deploy Frontend

### 3.1 Update API Client

Replace mock implementation in `/lib/api-client.ts`:

```typescript
import { CONTRACT_VERSION } from '../types/api-contract';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://taskboard.example.com/api/v1';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Validate contract version
  const responseVersion = response.headers.get('x-contract-version');
  if (responseVersion !== CONTRACT_VERSION) {
    throw new Error(
      `Contract version mismatch: frontend=${CONTRACT_VERSION}, backend=${responseVersion}`
    );
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  return response.json();
}

export async function listBoards() {
  return fetchWithAuth(`${API_BASE}/boards`);
}

export async function getBoard(boardId: string) {
  return fetchWithAuth(`${API_BASE}/boards/${boardId}`);
}

// ... implement all other endpoints
```

### 3.2 Build and Deploy

```bash
# Build frontend
npm run build

# Deploy to hosting (example: Vercel)
vercel deploy --prod

# Or deploy to your own server
rsync -avz build/ user@server:/var/www/taskboard/
```

### 3.3 Environment Variables

```bash
# Frontend environment variables
NEXT_PUBLIC_API_BASE=https://taskboard.example.com/api/v1
NEXT_PUBLIC_CONTRACT_VERSION=1.0.0
```

## Phase 4: Contract Validation (CI/CD)

### 4.1 GitHub Actions Workflow

`.github/workflows/contract-validation.yml`:

```yaml
name: Contract Validation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate-contract:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run contract validation
        run: ./ci/validate-contract.sh
      
      - name: Validate against live API (staging)
        if: github.ref == 'refs/heads/develop'
        env:
          ODOO_SESSION: ${{ secrets.STAGING_ODOO_SESSION }}
        run: ./ci/validate-live-api.sh https://staging.taskboard.example.com

  deploy-staging:
    needs: validate-contract
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to staging
        run: |
          # Your staging deployment script

  deploy-production:
    needs: validate-contract
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to production
        run: |
          # Your production deployment script
```

## Phase 5: Monitoring & Observability

### 5.1 Structured Logging

Add to Odoo config (`/etc/odoo/odoo.conf`):

```ini
[options]
logfile = /var/log/odoo/odoo-server.log
log_level = info
log_handler = :INFO,werkzeug:WARNING,odoo.http.rpc:INFO
```

Log format for API requests:

```python
import logging
import json

_logger = logging.getLogger(__name__)

def log_api_request(endpoint, user_id, method, status, duration_ms):
    _logger.info(json.dumps({
        'event': 'api_request',
        'endpoint': endpoint,
        'user_id': user_id,
        'method': method,
        'status': status,
        'duration_ms': duration_ms,
        'contract_version': CONTRACT_VERSION,
    }))
```

### 5.2 Error Tracking (Sentry)

```python
import sentry_sdk

sentry_sdk.init(
    dsn="https://your-sentry-dsn",
    environment="production",
    release=f"taskboard-api@{CONTRACT_VERSION}",
)
```

### 5.3 Performance Monitoring

Monitor key metrics:
- API response time (p50, p95, p99)
- Error rate by endpoint
- Database query time
- Card count per board
- Active users

Tools:
- Prometheus + Grafana
- Datadog
- New Relic

### 5.4 Health Checks

Add to Odoo module:

```python
@http.route('/api/v1/health', type='json', auth='none', csrf=False)
def health_check(self):
    try:
        # Check database
        request.env.cr.execute("SELECT 1")
        
        # Check contract version
        contract_ok = CONTRACT_VERSION == '1.0.0'
        
        return {
            'status': 'healthy',
            'contract_version': CONTRACT_VERSION,
            'timestamp': datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
        }
```

## Phase 6: Backup & Disaster Recovery

### 6.1 Database Backup

```bash
# Daily full backup
0 2 * * * /usr/local/bin/backup-odoo-db.sh

# /usr/local/bin/backup-odoo-db.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U $ODOO_DB_USER -d $ODOO_DB_NAME | gzip > /backups/odoo_$DATE.sql.gz

# Upload to S3
aws s3 cp /backups/odoo_$DATE.sql.gz s3://taskboard-backups/db/

# Retain last 30 days
find /backups -name "odoo_*.sql.gz" -mtime +30 -delete
```

### 6.2 Filestore Backup

```bash
# Daily filestore sync
0 3 * * * rsync -avz /opt/odoo/.local/share/Odoo/filestore/ s3://taskboard-backups/filestore/
```

### 6.3 Restore Procedure

```bash
# Restore database
gunzip < /backups/odoo_YYYYMMDD_HHMMSS.sql.gz | psql -U $ODOO_DB_USER -d $ODOO_DB_NAME

# Restore filestore
aws s3 sync s3://taskboard-backups/filestore/ /opt/odoo/.local/share/Odoo/filestore/

# Restart Odoo
systemctl restart odoo
```

## Phase 7: Security Hardening

### 7.1 Authentication

Use token-based auth instead of session cookies for API:

```python
@http.route('/api/v1/auth/token', type='json', auth='none', csrf=False)
def generate_token(self, username, password):
    uid = request.session.authenticate(request.session.db, username, password)
    if not uid:
        raise AccessDenied("Invalid credentials")
    
    # Generate JWT or opaque token
    token = generate_secure_token(uid)
    
    return {'token': token, 'expires_in': 86400}
```

### 7.2 Input Validation

Validate all request bodies against JSON schemas:

```python
import jsonschema

def validate_request_body(schema_path, data):
    with open(schema_path) as f:
        schema = json.load(f)
    
    try:
        jsonschema.validate(data, schema)
    except jsonschema.ValidationError as e:
        raise UserError(f"Invalid request: {e.message}")
```

### 7.3 SQL Injection Protection

Always use parameterized queries:

```python
# ✅ CORRECT
request.env.cr.execute("SELECT * FROM project_task WHERE id = %s", (task_id,))

# ❌ WRONG
request.env.cr.execute(f"SELECT * FROM project_task WHERE id = {task_id}")
```

### 7.4 XSS Protection

Sanitize user input before storing:

```python
from odoo.tools import html_sanitize

description = html_sanitize(user_input)
```

## Phase 8: Scaling

### 8.1 Database Optimization

```sql
-- Index frequently queried fields
CREATE INDEX idx_task_project_stage ON project_task(project_id, stage_id);
CREATE INDEX idx_task_user ON project_task(user_id);
CREATE INDEX idx_message_task ON mail_message(model, res_id) WHERE model = 'project.task';

-- Vacuum regularly
VACUUM ANALYZE project_task;
VACUUM ANALYZE mail_message;
```

### 8.2 Caching

Use Redis for caching:

```python
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

def get_board_cached(board_id):
    cache_key = f'board:{board_id}'
    cached = r.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    # Fetch from database
    board = fetch_board_from_db(board_id)
    
    # Cache for 5 minutes
    r.setex(cache_key, 300, json.dumps(board))
    
    return board
```

### 8.3 Load Balancing

Multiple Odoo workers:

```ini
[options]
workers = 4
max_cron_threads = 2
```

### 8.4 Read Replicas

For read-heavy workloads, use PostgreSQL read replicas for GET endpoints.

## Production Checklist Summary

- [ ] Contract frozen at v1.0.0
- [ ] All CI gates passing
- [ ] Odoo module deployed and tested
- [ ] Frontend deployed with real API integration
- [ ] Reverse proxy configured with rate limiting
- [ ] HTTPS enforced
- [ ] Authentication and authorization working
- [ ] Logging and monitoring set up
- [ ] Error tracking configured
- [ ] Backup and restore procedures tested
- [ ] Security audit passed
- [ ] Performance testing completed
- [ ] Documentation updated

## Rollback Procedure

If deployment fails:

1. **Frontend:** Revert to previous version via hosting platform
2. **Backend:** 
   ```bash
   # Uninstall module
   /opt/odoo/odoo-bin -c /etc/odoo/odoo.conf -u ipai_taskboard_api -d $ODOO_DB_NAME --stop-after-init
   
   # Restore database backup
   gunzip < /backups/odoo_backup.sql.gz | psql -U $ODOO_DB_USER -d $ODOO_DB_NAME
   ```
3. **Verify:** Run contract validation against rolled-back backend

## Support

For issues during deployment:
1. Check logs: `/var/log/odoo/odoo-server.log`
2. Review nginx logs: `/var/log/nginx/error.log`
3. Verify contract version consistency
4. Run health check: `curl https://taskboard.example.com/api/v1/health`
