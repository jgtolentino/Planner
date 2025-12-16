# IPAI Taskboard API — Odoo Module

Production-grade REST API for Notion-style Kanban backed by Odoo CE + OCA 18 data models.

## Contract Version

**1.0.0** — Must match `CONTRACT_VERSION` in frontend `/types/api-contract.ts`

## Installation

### 1. Copy module to Odoo addons

```bash
cp -r odoo-module/ipai_taskboard_api /path/to/odoo/addons/
```

### 2. Update Odoo addons list

```bash
./odoo-bin -c odoo.conf -u all --stop-after-init
```

### 3. Install module

```bash
./odoo-bin -c odoo.conf -i ipai_taskboard_api
```

Or via Odoo UI:
1. Apps → Update Apps List
2. Search "IPAI Taskboard API"
3. Install

## Architecture

```
ipai_taskboard_api/
├── __manifest__.py          # Module metadata
├── controllers/
│   ├── boards.py            # Board endpoints (project.project)
│   ├── cards.py             # Card endpoints (project.task)
│   └── comments.py          # Comment/activity endpoints (mail.message)
├── services/
│   ├── mapping.py           # DTO mapping layer (SINGLE SOURCE OF TRUTH)
│   ├── auth.py              # Authentication
│   ├── rbac.py              # Role-based access control
│   └── mentions.py          # @mention parsing & email resolution
└── security/
    ├── ir.model.access.csv  # Model access rights
    └── record_rules.xml     # Record-level access rules
```

## API Endpoints

Base URL: `/api/v1`

### Boards

- `GET /boards` — List boards
- `GET /boards/{id}` — Get board detail
- `POST /boards` — Create board

### Cards

- `GET /boards/{id}/cards` — List cards with filters
- `GET /cards/{id}` — Get card detail
- `POST /cards` — Create card
- `PATCH /cards/{id}` — Update card (including stage move)

### Comments

- `GET /cards/{id}/activity` — Get activity history
- `POST /cards/{id}/comments` — Create comment with mentions

## Data Model Mapping

| API DTO | Odoo Model | Notes |
|---------|-----------|-------|
| Board | `project.project` | Board = Project |
| Stage | `project.task.type` | Kanban columns |
| Card | `project.task` | Task with full chatter |
| Activity | `mail.message` | Comments + tracking |
| Partner | `res.partner` | Email-based identity |
| Tag | `project.tags` | Task tags |

## Security

### Authentication

All endpoints require `auth='user'` (Odoo session or token).

### Authorization

- **Board access:** Enforced via `project.project` record rules
- **Card access:** Enforced via `project.task` record rules
- **Comment access:** Only followers + task members can read/write

### Roles

| Role | Odoo Group | Permissions |
|------|-----------|-------------|
| Admin | `project.group_project_manager` | Full access to all boards |
| Manager | Project `user_id` | Full access to their boards |
| Contributor | `project.group_project_user` | Read/write access to assigned tasks |
| Viewer | `base.group_portal` | Read-only access to followed tasks |

### Audit Trail

All write operations are logged:
- Actor (user ID)
- Action (create/update/delete)
- Resource (board_id/card_id)
- Timestamp
- Changes (via `mail.tracking.value`)

## Email-Based Mentions

When a user posts a comment with `@email@example.com`:

1. **Parse:** Extract email from comment body
2. **Resolve:** Find or create `res.partner` by email
3. **Follow:** Add partner as follower on task
4. **Notify:** Send notification to partner (if has user account)

**Security:** Partner creation is controlled — only creates minimal record (name + email).

## Contract Version Header

All API responses include:

```
x-contract-version: 1.0.0
```

Frontend must validate this matches `CONTRACT_VERSION` in `/types/api-contract.ts`.

If versions mismatch → hard fail + show error to user.

## Mapping Layer (CRITICAL)

**Rule:** Controllers NEVER build JSON directly.

All DTO mapping happens in `/services/mapping.py`:

```python
from ..services.mapping import map_board, map_card, map_activity

# ✅ CORRECT
board = map_board(project)

# ❌ WRONG — never do this
board = {
    'board_id': f'project:{project.id}',
    'name': project.name,
    ...
}
```

This ensures:
- Contract compliance
- Single source of truth
- Easy to update when contract changes

## Testing

### Manual Testing

```bash
# List boards
curl -X GET http://localhost:8069/api/v1/boards \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION"

# Create card
curl -X POST http://localhost:8069/api/v1/cards \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION" \
  -d '{
    "board_id": "project:1",
    "stage_id": "stage:1",
    "title": "New task"
  }'
```

### Contract Validation

Run CI validation script against live Odoo:

```bash
./ci/validate-live-api.sh http://localhost:8069
```

This validates:
- All responses conform to JSON schemas
- Contract version matches
- Required fields present

## Dependencies

- `base` — Odoo core
- `project` — Project management (tasks, Kanban)
- `mail` — Chatter, messages, followers
- `contacts` — Partners, email identity

### Optional (OCA)

- `project_task_checklist` — Checklist items
- `project_task_multi_assign` — Multiple assignees
- `project_task_dependency` — Task dependencies

## Production Deployment

### 1. Environment Variables

```bash
ODOO_DB_NAME=taskboard_prod
ODOO_ADMIN_PASSWD=<strong_password>
CONTRACT_VERSION=1.0.0
```

### 2. Reverse Proxy (Nginx)

```nginx
location /api/v1 {
    proxy_pass http://odoo:8069;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    
    # Rate limiting
    limit_req zone=api burst=20 nodelay;
}
```

### 3. Rate Limiting

Configure in Nginx or API gateway:
- Read ops: 1000 req/min
- Write ops: 100 req/min

### 4. Monitoring

Log all API requests:
- Endpoint
- User ID
- Response time
- Status code
- Contract version

### 5. Backups

- Database: Daily full backup + hourly incremental
- Attachments: Sync to S3/GCS

## Troubleshooting

### Issue: "Board not found"

**Cause:** User doesn't have access to project

**Fix:** Check record rules in `/security/record_rules.xml`

### Issue: "Contract version mismatch"

**Cause:** Frontend and backend contract versions don't match

**Fix:** 
1. Check `CONTRACT_VERSION` in `/services/mapping.py`
2. Check `CONTRACT_VERSION` in frontend `/types/api-contract.ts`
3. Ensure both are `1.0.0`

### Issue: Mentions not creating followers

**Cause:** Email not resolving to partner

**Fix:** Check logs for partner creation errors. Verify email format is valid.

## Extending

### Adding Custom Fields

1. **Add field to Odoo model** (via custom module or OCA)
2. **Update mapping** in `/services/mapping.py`
3. **Update contract** in frontend `/types/api-contract.ts`
4. **Increment contract version**
5. **Run CI validation**

### Adding OCA Extensions

Example: Add checklist support

1. Install OCA module: `project_task_checklist`
2. Update `map_card()` in `/services/mapping.py`:

```python
def map_card(task):
    # ... existing code ...
    
    # Map checklist
    checklist = []
    if hasattr(task, 'checklist_ids'):
        checklist = [
            {
                'id': str(item.id),
                'text': item.name,
                'done': item.is_done,
                'order': item.sequence,
            }
            for item in task.checklist_ids
        ]
    
    return {
        # ... existing fields ...
        'checklist': checklist if checklist else None,
    }
```

3. Update frontend contract (already supports `checklist`)
4. Test + deploy

## License

LGPL-3 (same as Odoo CE)

## Support

For issues or questions:
1. Check logs: `/var/log/odoo/odoo-server.log`
2. Enable debug mode: `--log-level=debug`
3. Review API contract documentation
