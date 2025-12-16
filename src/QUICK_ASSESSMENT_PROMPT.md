# Quick Project Assessment Prompt (30-Minute Version)

## Context

Audit this Notion-style Kanban system built on Odoo CE 18 with React frontend. Contract version: **1.0.0**.

---

## 5-Phase Quick Assessment

### 1. Contract Integrity (5 min)

**Check:**
```bash
# Extract contract versions
grep "CONTRACT_VERSION" types/api-contract.ts
grep "CONTRACT_VERSION" odoo-module/ipai_taskboard_api/services/mapping.py

# Verify schemas exist
ls -la schemas/*.json
```

**Questions:**
- Are versions consistent across frontend/backend/schemas?
- Do schemas validate all required fields?

**Grade:** ✅ Pass / ⚠️ Issues / ❌ Fail

---

### 2. Backend Security (10 min)

**Check:**
```bash
# Dangerous patterns
rg "sudo\(" odoo-module/ -n              # Should be minimal
rg "execute\(f\"" odoo-module/ -n        # Should be ZERO
rg "return.*{" odoo-module/controllers/ -n  # Should use mapping.py

# Security files exist
ls -la odoo-module/ipai_taskboard_api/services/auth.py
ls -la odoo-module/ipai_taskboard_api/services/rbac.py
ls -la odoo-module/ipai_taskboard_api/security/
```

**Questions:**
- Is sudo() usage safe (only in mentions.py)?
- Are there SQL injection risks?
- Is authentication enforced?
- Are ACL rules defined?

**Grade:** ✅ Secure / ⚠️ Risks / 🚨 Vulnerable

---

### 3. Frontend Completeness (10 min)

**Check:**
```bash
# Count views
ls -la components/views/*.tsx
ls -la components/board-views/*.tsx

# Check for mocks
rg "setTimeout|mockData" components/ -c

# Check for error handling
rg "try.*catch" components/ -c
```

**Required views (7 total):**
- [ ] My Tasks (components/views/MyTasks.tsx)
- [ ] My Day (components/views/MyDay.tsx)
- [ ] My Plans (components/views/MyPlans.tsx)
- [ ] Board → Board tab (components/board-views/BoardKanbanView.tsx)
- [ ] Board → Grid tab (components/board-views/BoardGridView.tsx)
- [ ] Board → Schedule tab (components/board-views/BoardScheduleView.tsx)
- [ ] Board → Charts tab (components/board-views/BoardChartsView.tsx)

**Questions:**
- Are all 7 views implemented?
- Are they still using mock data?
- Do they have error handling?

**Grade:** ✅ Complete / ⚠️ Partial / ❌ Missing

---

### 4. Test Coverage (3 min)

**Check:**
```bash
# CI scripts exist
ls -la ci/*.sh

# Docker setup exists
ls -la infra/odoo-dev/docker-compose.yml

# Try running tests (if time permits)
make verify || echo "Tests not runnable"
```

**Questions:**
- Is there automated contract validation?
- Can the dev environment start?
- Are there golden fixtures?

**Grade:** ✅ Good / ⚠️ Basic / ❌ None

---

### 5. Production Readiness (2 min)

**Check:**
```bash
# Documentation exists
ls -la README.md PRODUCTION.md VERIFICATION.md

# Check for obvious blockers
rg "TODO|FIXME|XXX|HACK" . -c
```

**Blockers checklist:**
- [ ] Contract frozen at 1.0.0
- [ ] No critical TODOs
- [ ] Security hardening documented
- [ ] Deployment guide exists
- [ ] All views complete

**Grade:** ✅ Ready / ⚠️ Needs Work / ❌ Not Ready

---

## Quick Report Template

```markdown
# Quick Assessment: [Project Name]

**Date:** [Today]  
**Time Spent:** 30 minutes  
**Overall Grade:** A/B/C/D/F  

## Findings

1. **Contract:** ✅/⚠️/❌ [One sentence]
2. **Security:** ✅/⚠️/🚨 [One sentence]
3. **Frontend:** ✅/⚠️/❌ [One sentence]
4. **Tests:** ✅/⚠️/❌ [One sentence]
5. **Production:** ✅/⚠️/❌ [One sentence]

## Critical Issues (P0)
- [Issue 1]
- [Issue 2]

## Production Ready?
**[YES / NO / WITH FIXES]**

## Top 3 Recommendations
1. [Action]
2. [Action]
3. [Action]
```

---

## Go!

Run through the 5 phases in order. Be fast but thorough. Focus on blockers.
