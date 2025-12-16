# API Contract — Notion-style Kanban on Odoo CE + OCA 18

## Overview

This is the **API contract first** implementation for a Notion-style Kanban system backed by Odoo CE + OCA 18 data models.

**Contract Version: 1.0.0**

## Quick Start (One Command)

```bash
# Full verification (starts Odoo, installs module, seeds data, runs all tests)
make verify

# Or step by step:
make up                    # Start Odoo + Postgres
make install-module        # Install ipai_taskboard_api
make seed                  # Create test data
make test-contract         # Validate contract locally
make test-live             # Validate live API
```

**Expected result:** All tests pass green.

## What's Included

### 1. TypeScript Contract (`/types/api-contract.ts`)
- **Single source of truth** for all DTOs
- Mirrors Odoo CE + OCA 18 exactly
- `CONTRACT_VERSION = '1.0.0'` frozen

### 2. JSON Schemas (`/schemas/*.json`)
- Validates every API response
- Used in CI to detect contract drift

### 3. Odoo Module (`/odoo-module/ipai_taskboard_api/`)
- Production-ready REST API
- Controllers call mapping layer (never build JSON directly)
- Security enforced server-side (ACL + record rules)
- Email-based mentions with follower management

### 4. Test Harness (`/infra/odoo-dev/`)
- Docker Compose with Odoo 18 + Postgres
- One-command setup and validation
- Auto-seeded test data

### 5. CI/CD Pipeline (`.github/workflows/`)
- Static contract validation
- Live API validation against Docker Odoo
- Contract drift detection
- Security audit

## Architecture

```
Frontend (Replaceable)
    ↓
API Contract (v1.0.0) ← FROZEN
    ↓
Odoo REST Controllers
    ↓
Mapping Layer (mapping.py) ← SINGLE SOURCE OF TRUTH
    ↓
Odoo CE + OCA 18 Models
```

**Key Principle:** UI is replaceable, data model is stable.

## Data Model Mapping

| API DTO | Odoo Model | Notes |
|---------|-----------|-------|
| Board | `project.project` | Board = Project |
| Stage | `project.task.type` | Kanban columns |
| Card | `project.task` | Task with chatter |
| Activity | `mail.message` | Comments + tracking |
| Partner | `res.partner` | Email-based identity |
| Tag | `project.tags` | Task categorization |

## Security Model

### Authentication
- Session auth (cookies) for initial testing
- Token auth (JWT) for production

### Authorization
| Role | Odoo Group | Permissions |
|------|-----------|-------------|
| Admin | `project.group_project_manager` | Full access |
| Manager | Project `user_id` | Full access to their boards |
| Contributor | `project.group_project_user` | Read/write assigned tasks |
| Viewer | `base.group_portal` | Read-only followed tasks |

### Audit Trail
- All writes logged via `mail.tracking.value`
- Actor, action, timestamp, changes recorded

### sudo() Usage
**Verified safe:** Only 2 uses, both in `mentions.py` for partner resolution.

```bash
# Verify:
rg "sudo\(" odoo-module/ipai_taskboard_api -n
```

## Development Workflow

### Local Development
```bash
# Start stack
make up

# Install module
make install-module

# Create test data
make seed

# Run tests
make test-all

# View logs
make logs

# Open shell
make shell

# Cleanup
make clean
```

### Making Changes

**Rule:** Never drift contract and implementation.

1. **Update contract** (`/types/api-contract.ts`)
2. **Update schemas** (`/schemas/*.json`)
3. **Update mapping** (`/odoo-module/.../mapping.py`)
4. **Bump version** (if breaking change)
5. **Run validation:** `make test-all`
6. **Commit together**

### Adding OCA Extensions

Example: Add task dependencies

1. Install OCA module: `project_task_dependency`
2. Update `map_card()` in `mapping.py`:
   ```python
   dependencies = [
       {'type': 'blocks', 'task_id': f'task:{dep.id}'}
       for dep in task.dependency_ids
   ]
   ```
3. Contract already supports `dependencies` field
4. Run `make test-live`

## CI/CD Gates

### Pull Request
- ✅ TypeScript type check
- ✅ JSON schema validation
- ✅ Mock data conformance
- ✅ Contract version consistency
- ✅ Live API validation (Docker Odoo)
- ✅ Contract drift detection
- ✅ Security audit (npm audit, secrets scan)
- ✅ sudo() usage check

### Deployment
- ✅ All PR checks pass
- ✅ Live validation against staging
- ✅ Performance baseline met
- ✅ Backup tested

## File Structure

```
.
├── types/
│   └── api-contract.ts           # CONTRACT v1.0.0 (FROZEN)
├── schemas/
│   ├── board.schema.json         # Board validation
│   ├── card.schema.json          # Card validation
│   └── activity.schema.json      # Activity validation
├── odoo-module/
│   └── ipai_taskboard_api/
│       ├── controllers/          # REST endpoints
│       ├── services/
│       │   ├── mapping.py        # DTO mapping (SINGLE SOURCE)
│       │   ├── auth.py           # Authentication
│       │   ├── rbac.py           # Authorization
│       │   └── mentions.py       # Email mentions
│       └── security/             # ACL + record rules
├── infra/
│   └── odoo-dev/
│       ├── docker-compose.yml    # Odoo 18 + Postgres
│       ├── install-module.sh     # Auto-install script
│       ├── seed.py               # Test data seeder
│       └── seed.sh               # Seed wrapper
├── ci/
│   ├── validate-contract.sh      # Static validation
│   ├── validate-live-api.sh      # Live API validation
│   └── check-contract-drift.sh   # Drift detection
├── Makefile                       # One-command automation
└── .github/workflows/
    └── contract-validation.yml   # CI pipeline
```

## Documentation

- **[VERIFICATION.md](/VERIFICATION.md)** — Step-by-step testing guide
- **[PRODUCTION.md](/PRODUCTION.md)** — Production deployment guide
- **[/odoo-module/README.md](/odoo-module/README.md)** — Module documentation
- **[/docs/api-endpoints.md](/docs/api-endpoints.md)** — API specification
- **[/docs/odoo-field-mapping.md](/docs/odoo-field-mapping.md)** — Field mappings

## Troubleshooting

### "Contract version mismatch"
```bash
# Check versions match:
grep CONTRACT_VERSION types/api-contract.ts
grep CONTRACT_VERSION odoo-module/ipai_taskboard_api/services/mapping.py
```

### "Board not found"
- Check user is project member
- Verify record rules: `make psql`
- Check Odoo logs: `make logs`

### "JSON schema validation failed"
```bash
# Check actual response:
curl http://localhost:8069/api/v1/boards \
  -H "Cookie: session_id=$SESSION" | jq

# Fix mapping.py, NEVER patch controller
```

### Module won't install
```bash
# Check logs:
docker-compose -f infra/odoo-dev/docker-compose.yml logs odoo

# Common issues:
# - Missing dependency (check __manifest__.py)
# - Import error (check __init__.py imports)
# - XML parse error (check security/*.xml)
```

## Contributing

1. Fork repo
2. Create feature branch
3. Make changes
4. Run `make test-all` (must pass)
5. Open PR
6. CI must be green

## License

LGPL-3 (same as Odoo CE)

## Support

For issues:
1. Check logs: `make logs`
2. Run validation: `make test-all`
3. Review [VERIFICATION.md](/VERIFICATION.md)
4. Check contract version consistency
