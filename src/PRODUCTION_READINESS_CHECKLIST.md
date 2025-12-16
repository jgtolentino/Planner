# Production Readiness Verification Checklist

**Project:** Notion-style Kanban on Odoo CE + OCA 18  
**Contract Version:** 1.0.0  
**Purpose:** Binary YES/NO assessment for production deployment

---

## How to Use This Checklist

Go through each section systematically. Mark items as:
- ✅ **PASS** - Verified working
- ❌ **FAIL** - Blocking issue
- ⚠️ **WARNING** - Non-blocking but should fix
- 🔍 **NEEDS REVIEW** - Requires manual inspection

**Production deployment is GO only if ALL critical items are ✅**

---

## 1. Contract Lock (Critical)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1.1 | Contract version is 1.0.0 in `/types/api-contract.ts` | [ ] | `grep CONTRACT_VERSION types/api-contract.ts` |
| 1.2 | Contract version is 1.0.0 in Odoo `mapping.py` | [ ] | `grep CONTRACT_VERSION odoo-module/.../mapping.py` |
| 1.3 | All JSON schemas exist and validate | [ ] | `./ci/validate-contract.sh` |
| 1.4 | API responses include `x-contract-version` header | [ ] | `curl response headers` |
| 1.5 | Frontend validates contract version mismatch | [ ] | Check `lib/api-client.ts` |

**Critical?** YES - If ANY item fails, contract is not locked.

---

## 2. Backend Security (Critical)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 2.1 | No SQL injection vulnerabilities | [ ] | `rg "execute\(f\"" odoo-module/ -n` → ZERO results |
| 2.2 | sudo() usage is safe and minimal | [ ] | `rg "sudo\(" odoo-module/ -n` → Only in mentions.py |
| 2.3 | Authentication enforced on all protected endpoints | [ ] | Manual review of `controllers/*.py` |
| 2.4 | Record-level security rules exist | [ ] | `ls security/record_rules.xml` |
| 2.5 | ACL defined for all models | [ ] | `ls security/ir.model.access.csv` |
| 2.6 | Input validation present | [ ] | Check for sanitization in controllers |
| 2.7 | XSS protection enabled | [ ] | `html_sanitize()` used for user input |
| 2.8 | CSRF tokens configured | [ ] | Odoo CSRF enabled |
| 2.9 | Rate limiting implemented | [ ] | Check Nginx config or Odoo middleware |
| 2.10 | HTTPS enforced | [ ] | Check reverse proxy config |

**Critical?** YES - Any vulnerability blocks production.

---

## 3. Backend API Completeness (Critical)

| # | Endpoint | Implemented | Tested | Status |
|---|----------|-------------|--------|--------|
| 3.1 | `GET /api/v1/boards` | [ ] | [ ] | [ ] |
| 3.2 | `GET /api/v1/boards/{id}` | [ ] | [ ] | [ ] |
| 3.3 | `GET /api/v1/boards/{id}/cards` | [ ] | [ ] | [ ] |
| 3.4 | `POST /api/v1/boards/{id}/cards` | [ ] | [ ] | [ ] |
| 3.5 | `PATCH /api/v1/cards/{id}` | [ ] | [ ] | [ ] |
| 3.6 | `GET /api/v1/cards/{id}/activity` | [ ] | [ ] | [ ] |
| 3.7 | `POST /api/v1/cards/{id}/comments` | [ ] | [ ] | [ ] |
| 3.8 | All endpoints return contract-compliant JSON | [ ] | [ ] | [ ] |

**Critical?** YES - Missing endpoints break frontend.

**Verification:**
```bash
# Test each endpoint manually
SESSION="<session_id>"
curl http://localhost:8069/api/v1/boards -H "Cookie: session_id=$SESSION"
```

---

## 4. Frontend View Completeness (Critical)

| # | View | File Exists | Functional | Mock Data | Status |
|---|------|-------------|-----------|-----------|--------|
| 4.1 | My Tasks | [ ] | [ ] | [ ] | [ ] |
| 4.2 | My Day | [ ] | [ ] | [ ] | [ ] |
| 4.3 | My Plans | [ ] | [ ] | [ ] | [ ] |
| 4.4 | Board → Board (Kanban) | [ ] | [ ] | [ ] | [ ] |
| 4.5 | Board → Grid (Table) | [ ] | [ ] | [ ] | [ ] |
| 4.6 | Board → Schedule (Calendar) | [ ] | [ ] | [ ] | [ ] |
| 4.7 | Board → Charts (Analytics) | [ ] | [ ] | [ ] | [ ] |

**Critical?** YES - All 7 views must be complete.

**Verification:**
```bash
# Check files exist
ls -la components/views/MyTasks.tsx
ls -la components/views/MyDay.tsx
ls -la components/views/MyPlans.tsx
ls -la components/board-views/BoardKanbanView.tsx
ls -la components/board-views/BoardGridView.tsx
ls -la components/board-views/BoardScheduleView.tsx
ls -la components/board-views/BoardChartsView.tsx

# Check for mock data (should be replaced)
rg "setTimeout.*setTasks|mockData" components/views/ components/board-views/
```

---

## 5. Frontend Production States (High Priority)

| # | State | Implemented Across All Views | Status |
|---|-------|------------------------------|--------|
| 5.1 | Loading states (skeletons/spinners) | [ ] | [ ] |
| 5.2 | Empty states (no data messages) | [ ] | [ ] |
| 5.3 | Error states (API failures) | [ ] | [ ] |
| 5.4 | Error boundaries (crash recovery) | [ ] | [ ] |

**Critical?** NO - But blocks good UX.

**Verification:**
```bash
# Check for loading states
rg "loading|isLoading|Loading" components/ -c

# Check for empty states
rg "no.*found|empty|Empty" components/ -c

# Check for error handling
rg "try.*catch|error|Error" components/ -c
```

---

## 6. Test Harness (High Priority)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 6.1 | Docker Compose starts cleanly | [ ] | `docker-compose up -d` |
| 6.2 | Odoo module installs successfully | [ ] | `make install-module` |
| 6.3 | Seed data creates test data | [ ] | `make seed` |
| 6.4 | Contract validation passes | [ ] | `./ci/validate-contract.sh` |
| 6.5 | Live API validation passes | [ ] | `./ci/validate-live-api.sh` |
| 6.6 | Golden fixtures exist | [ ] | `ls ci/fixtures/*.json` |
| 6.7 | `make verify` runs end-to-end | [ ] | `make verify` |

**Critical?** NO - But needed for confidence.

---

## 7. API Integration (Critical)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 7.1 | API client is implemented | [ ] | `ls lib/api-client.ts` |
| 7.2 | API client validates contract version | [ ] | Check for version check in code |
| 7.3 | Frontend is using real API (not mocks) | [ ] | No setTimeout in components |
| 7.4 | Error responses are handled | [ ] | Try/catch around API calls |
| 7.5 | Authentication is wired up | [ ] | Session/token management |

**Critical?** YES - Frontend must connect to backend.

**Verification:**
```bash
# Check API client implementation
cat lib/api-client.ts | grep -E "fetch|CONTRACT_VERSION"

# Check for mock usage
rg "setTimeout" components/ -l
```

---

## 8. Documentation (Medium Priority)

| # | Document | Exists | Accurate | Complete | Status |
|---|----------|--------|----------|----------|--------|
| 8.1 | README.md | [ ] | [ ] | [ ] | [ ] |
| 8.2 | PRODUCTION.md | [ ] | [ ] | [ ] | [ ] |
| 8.3 | VERIFICATION.md | [ ] | [ ] | [ ] | [ ] |
| 8.4 | API endpoints docs | [ ] | [ ] | [ ] | [ ] |
| 8.5 | Odoo field mapping docs | [ ] | [ ] | [ ] | [ ] |

**Critical?** NO - But needed for maintenance.

---

## 9. Infrastructure (High Priority)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 9.1 | Reverse proxy configured (Nginx) | [ ] | Check PRODUCTION.md |
| 9.2 | HTTPS configured | [ ] | SSL certs present |
| 9.3 | Rate limiting configured | [ ] | Nginx config |
| 9.4 | CORS configured | [ ] | Odoo config |
| 9.5 | Health check endpoint exists | [ ] | `curl /health` |
| 9.6 | Logging configured | [ ] | Odoo logs to file |
| 9.7 | Error tracking set up (Sentry) | [ ] | Config present |
| 9.8 | Backup procedure documented | [ ] | PRODUCTION.md |
| 9.9 | Restore procedure tested | [ ] | Manual test |

**Critical?** SOME - HTTPS, rate limiting, health checks are critical.

---

## 10. Data Integrity (Critical)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 10.1 | All contract fields map to Odoo models | [ ] | Review mapping.py |
| 10.2 | No orphaned records possible | [ ] | Foreign key constraints |
| 10.3 | Audit trail works (mail.tracking.value) | [ ] | Test card updates |
| 10.4 | Mentions create followers | [ ] | Test @mention in comments |
| 10.5 | Checklist updates persist | [ ] | Test checklist toggle |

**Critical?** YES - Data corruption blocks production.

---

## Final Production Decision

### Critical Items Summary

**Total Critical Items:** ~45  
**Passing:** ___  
**Failing:** ___  

### Go/No-Go Decision

**Production deployment is:**

- [ ] ✅ **GO** - All critical items pass
- [ ] ⚠️ **GO WITH RISK** - Minor issues, acceptable risk
- [ ] ❌ **NO GO** - Blocking issues present

### Blocking Issues (Must Fix)

1. [ Issue 1 ]
2. [ Issue 2 ]
3. [ Issue 3 ]

### Sign-off

**Reviewed by:** _______________  
**Date:** _______________  
**Recommendation:** GO / NO-GO  

---

## Quick Commands for Verification

```bash
# Clone and setup
git clone <repo>
cd <repo>

# Contract version check
grep -r "CONTRACT_VERSION" types/ odoo-module/

# Security audit
rg "sudo\(" odoo-module/ -n
rg "execute\(f\"" odoo-module/ -n

# View completeness
ls -la components/views/*.tsx
ls -la components/board-views/*.tsx

# Mock data check
rg "setTimeout|mockData" components/ -l

# Test harness
make verify

# Start dev environment
docker-compose -f infra/odoo-dev/docker-compose.yml up -d
make install-module
make seed

# Test API
SESSION="<session_id>"
curl http://localhost:8069/api/v1/boards -H "Cookie: session_id=$SESSION"

# Frontend build
npm install
npm run build
```

---

## Assessment Workflow

1. **Clone repository**
2. **Run quick commands** (above)
3. **Fill out checklist** (mark each item)
4. **Calculate pass rate** (count ✅ vs total)
5. **Identify blockers** (all ❌ in critical sections)
6. **Make decision** (GO / NO-GO)
7. **Sign off**

**Time required:** 2-3 hours for thorough assessment

---

## Pass Criteria

**GO Decision requires:**
- **100% of Critical security items** (Section 2)
- **100% of Critical backend items** (Section 3)
- **100% of Critical frontend items** (Section 4)
- **100% of Critical API integration items** (Section 7)
- **≥80% of High Priority items** (Sections 5, 6, 9)
- **≥60% of Medium Priority items** (Section 8)

**Anything less = NO GO** (or GO WITH RISK if minor)
