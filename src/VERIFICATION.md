# End-to-End Verification Checklist

**Contract Version: 1.0.0**

This document provides the exact commands and expected outputs for verifying the complete system.

## Prerequisites

```bash
# Install required tools
npm install -g ajv-cli
npm install -D tsx

# Make scripts executable
chmod +x ci/validate-contract.sh
chmod +x ci/validate-live-api.sh
```

---

## Step 1: Contract Validation (Local)

**Command:**
```bash
./ci/validate-contract.sh
```

**Expected Output:**
```
==========================================
Contract Validation CI Gate
==========================================

[1/5] TypeScript type check...
✓ TypeScript types valid

[2/5] ESLint check (skipped if no config)...
⚠ No ESLint config found, skipping

[3/5] JSON Schema validation...
✓ JSON schemas valid against fixtures

[4/5] Contract version consistency...
✓ Contract version consistent: v1.0.0

[5/5] Validate mock data against contract...
Validating board...
  ✓ Board valid
Validating cards...
  ✓ All 9 cards valid
Validating activities...
  ✓ All 7 activities valid
Validating stages...
  ✓ All 5 stages valid
Validating tags...
  ✓ All 4 tags valid

✓ All mock data valid

==========================================
✓ All contract validation checks passed
==========================================
```

**Hard Fail Conditions:**
- TypeScript compilation errors → Fix types immediately
- Contract version mismatch → Update README.md
- JSON schema validation fails → Fix fixtures or schemas
- Mock data invalid → Fix data/mock.ts

---

## Step 2: Odoo Backend Installation

### 2.1 Deploy Module

**Commands:**
```bash
# Copy module to Odoo addons
sudo rsync -a ./odoo-module/ipai_taskboard_api/ /opt/odoo/addons/ipai_taskboard_api/

# Set ownership
sudo chown -R odoo:odoo /opt/odoo/addons/ipai_taskboard_api/

# Restart Odoo
sudo systemctl restart odoo

# Check status
sudo systemctl status odoo --no-pager
```

**Expected Output:**
```
● odoo.service - Odoo
   Loaded: loaded (/etc/systemd/system/odoo.service; enabled; vendor preset: enabled)
   Active: active (running) since Mon 2025-12-15 10:00:00 UTC; 5s ago
 Main PID: 12345 (python3)
    Tasks: 4 (limit: 4915)
   Memory: 250.0M
   CGroup: /system.slice/odoo.service
           └─12345 /usr/bin/python3 /opt/odoo/odoo-bin -c /etc/odoo/odoo.conf
```

### 2.2 Verify Installation

**Command:**
```bash
sudo tail -n 50 /var/log/odoo/odoo-server.log | grep -i "ipai_taskboard_api"
```

**Expected Output:**
```
2025-12-15 10:00:05,123 12345 INFO taskboard_prod odoo.modules.loading: Loading module ipai_taskboard_api (1 of 1)
2025-12-15 10:00:05,456 12345 INFO taskboard_prod odoo.modules.loading: Module ipai_taskboard_api loaded
```

**Hard Fail Conditions:**
- `ModuleNotFoundError` → Check addons path
- `ImportError` → Check Python dependencies
- `ParseError` in security XML → Check record_rules.xml syntax
- Module state != 'installed' → Check logs for errors

### 2.3 Install via Odoo UI (Alternative)

1. Login as admin: https://your-odoo.com/web
2. Apps → Update Apps List
3. Search: "IPAI Taskboard API"
4. Click Install
5. Verify: Module shows "Installed"

---

## Step 3: Create Test Data

### 3.1 Via Odoo UI (Recommended)

**Project (Board):**
1. Project → Create
   - Name: `Finance SSC Month-End`
   - Manager: Current user

**Stages:**
1. Project Settings → Stages → Create 5 stages:
   - Backlog (sequence: 10)
   - To Do (sequence: 20)
   - Doing (sequence: 30)
   - Review (sequence: 40)
   - Done (sequence: 50)

**Users & Partners:**
1. Settings → Users → Create 3 users:
   - maria.santos@company.com (Manager)
   - juan.cruz@company.com (Project User)
   - ana.reyes@company.com (Project User)

**Tasks:**
1. Project → Tasks → Create 3 tasks:
   - "Reconcile VAT input tax" (Stage: Doing, Owner: juan.cruz@company.com)
   - "Process payroll for December" (Stage: Review, Owner: ana.reyes@company.com)
   - "Submit BIR Form 2550M" (Stage: Done, Owner: juan.cruz@company.com)

**Comment with Mention:**
1. Open task "Reconcile VAT input tax"
2. Click "Log note" or "Send message"
3. Type: "Please confirm totals by EOD @juan.cruz@company.com"
4. Post

### 3.2 Via Odoo Shell (Advanced)

```python
# odoo shell -d taskboard_prod -c /etc/odoo/odoo.conf

# Create project
project = env['project.project'].create({
    'name': 'Finance SSC Month-End',
})

# Create stages
stages = []
for seq, name in [(10, 'Backlog'), (20, 'To Do'), (30, 'Doing'), (40, 'Review'), (50, 'Done')]:
    stage = env['project.task.type'].create({
        'name': name,
        'sequence': seq,
    })
    stages.append(stage)

project.write({'type_ids': [(6, 0, [s.id for s in stages])]})

# Create tasks
task1 = env['project.task'].create({
    'name': 'Reconcile VAT input tax',
    'project_id': project.id,
    'stage_id': stages[2].id,  # Doing
})

# Add comment with mention
task1.message_post(
    body='Please confirm totals by EOD @juan.cruz@company.com',
    message_type='comment',
)
```

---

## Step 4: Live API Validation

### 4.1 Get Session Token

**Command:**
```bash
# Get session ID
SESSION=$(curl -s -X POST https://your-odoo.com/web/session/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "params": {
      "db": "taskboard_prod",
      "login": "admin",
      "password": "your_admin_password"
    }
  }' | jq -r '.result.session_id')

echo "Session: $SESSION"

# Export for validation script
export ODOO_SESSION=$SESSION
```

### 4.2 Run Validation Script

**Command:**
```bash
./ci/validate-live-api.sh https://your-odoo.com
```

**Expected Output:**
```
==========================================
Live API Contract Validation
Odoo URL: https://your-odoo.com
==========================================

[1/5] Testing GET /boards...
✓ GET /boards returned valid response
✓ Board response conforms to schema

[2/5] Checking contract version header...
✓ Contract version header matches: v1.0.0

[3/5] Testing GET /boards/{id}/cards...
✓ GET /boards/{id}/cards returned valid response
✓ Card response conforms to schema

[4/5] Testing POST /cards...
✓ POST /cards created card successfully

[5/5] Testing PATCH /cards/{id}...
✓ PATCH /cards/{id} updated card successfully

==========================================
✓ All live API validation checks passed
==========================================
```

**Hard Fail Conditions:**
- Contract version mismatch → Backend not updated
- Schema validation fails → Mapping layer bug, fix mapping.py
- 404 errors → Routes not registered, check controllers/__init__.py
- 403 errors → ACL issue, check security/record_rules.xml
- 500 errors → Check Odoo logs for Python traceback

---

## Step 5: Security Verification

### 5.1 sudo() Audit

**Command:**
```bash
rg "sudo\(" odoo-module/ipai_taskboard_api -n
```

**Expected Output:**
```
odoo-module/ipai_taskboard_api/services/mentions.py:69:        partner = Partner.sudo().search([('email', '=', email)], limit=1)
odoo-module/ipai_taskboard_api/services/mentions.py:75:                partner = Partner.sudo().create({
```

**Verification:**
- ✅ Only 2 uses of `sudo()` in mentions.py
- ✅ Both are for partner lookup/creation by email
- ✅ Access validation happens on task itself (before calling mentions)
- ❌ If sudo() appears in controllers → SECURITY ISSUE, remove immediately

### 5.2 Record Rules Test

Create 4 test users and verify access:

**Test 1: Viewer Cannot Access Non-Member Board**
```bash
# Login as viewer (not member of board A)
curl -X GET https://your-odoo.com/api/v1/boards/project:1 \
  -H "Cookie: session_id=$VIEWER_SESSION"

# Expected: 403 or empty response (ACL enforced)
```

**Test 2: Contributor Can Create Card**
```bash
# Login as contributor (member of board A)
curl -X POST https://your-odoo.com/api/v1/cards \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=$CONTRIBUTOR_SESSION" \
  -d '{
    "board_id": "project:1",
    "stage_id": "stage:1",
    "title": "Test task"
  }'

# Expected: 201 Created with card DTO
```

**Test 3: Contributor Cannot Delete Board**
```bash
# Try to delete project directly
curl -X DELETE https://your-odoo.com/web/dataset/call_kw/project.project/unlink \
  -H "Cookie: session_id=$CONTRIBUTOR_SESSION" \
  -d '{"params": {"model": "project.project", "method": "unlink", "args": [[1]]}}'

# Expected: 403 Forbidden (record rules enforce)
```

---

## Step 6: Frontend Swap (Mock → Live)

### 6.1 Update API Client

**File:** `/lib/api-client.ts`

**Before (Mock):**
```typescript
export async function listBoards(): Promise<ListBoardsResponse> {
  await mockDelay();
  return {
    boards: [mockBoard],
    total: 1,
    page: 0,
    limit: 20,
  };
}
```

**After (Live):**
```typescript
import { CONTRACT_VERSION } from '../types/api-contract';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://your-odoo.com/api/v1';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // CRITICAL: Validate contract version
  const backendVersion = response.headers.get('x-contract-version');
  if (backendVersion !== CONTRACT_VERSION) {
    throw new Error(
      `Contract version mismatch!\n` +
      `Frontend: ${CONTRACT_VERSION}\n` +
      `Backend: ${backendVersion}\n` +
      `Please update frontend or backend to match versions.`
    );
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  return response.json();
}

export async function listBoards(): Promise<ListBoardsResponse> {
  return fetchAPI('/boards');
}

export async function getBoard(boardId: string): Promise<GetBoardResponse> {
  return fetchAPI(`/boards/${boardId}`);
}

export async function listCards(
  boardId: string,
  filters?: Record<string, string>
): Promise<ListCardsResponse> {
  const params = new URLSearchParams(filters);
  return fetchAPI(`/boards/${boardId}/cards?${params}`);
}

export async function createCard(
  request: CreateCardRequest
): Promise<CreateCardResponse> {
  return fetchAPI('/cards', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function updateCard(
  request: UpdateCardRequest
): Promise<UpdateCardResponse> {
  return fetchAPI(`/cards/${request.card_id}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

export async function createComment(
  request: CreateCommentRequest
): Promise<CreateCommentResponse> {
  return fetchAPI(`/cards/${request.card_id}/comments`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getCardActivity(
  cardId: string
): Promise<GetCardActivityResponse> {
  return fetchAPI(`/cards/${cardId}/activity`);
}
```

### 6.2 Test Build

**Commands:**
```bash
npm run build

# Expected: No errors, build succeeds
```

### 6.3 Verify UI Works with Real API

1. Start dev server: `npm run dev`
2. Open: http://localhost:3000
3. Verify:
   - Board loads with real data
   - Cards visible in correct stages
   - Drag-drop triggers PATCH /cards/{id}
   - Comments post and appear in activity feed
   - Contract version shown in UI (no mismatch error)

---

## Step 7: Production Readiness Gate

### 7.1 All CI Checks Pass

**Commands:**
```bash
# Local contract validation
./ci/validate-contract.sh
echo "Exit code: $?"

# Live API validation (staging)
export ODOO_SESSION=$STAGING_SESSION
./ci/validate-live-api.sh https://staging.your-odoo.com
echo "Exit code: $?"
```

**Required:** Both exit with code 0

### 7.2 Performance Baseline

**Load Test Cards List:**
```bash
# Test GET /boards/{id}/cards performance
ab -n 1000 -c 10 -H "Cookie: session_id=$SESSION" \
  https://staging.your-odoo.com/api/v1/boards/project:1/cards

# Expected:
# - Mean response time < 200ms
# - No 500 errors
# - No memory leaks
```

### 7.3 Security Scan

```bash
# Check for secrets in code
git secrets --scan

# Check dependencies for vulnerabilities
npm audit

# Check Odoo modules for known issues
# (Manual review of third-party OCA modules)
```

---

## Common Issues & Fixes

### Issue: "Contract version mismatch"

**Symptoms:**
```
Contract version mismatch: frontend=1.0.0, backend=1.0.1
```

**Fix:**
1. Check `/types/api-contract.ts`: `CONTRACT_VERSION = '1.0.0'`
2. Check `/odoo-module/.../mapping.py`: `CONTRACT_VERSION = '1.0.0'`
3. Ensure both match
4. Redeploy backend or frontend
5. Clear browser cache

### Issue: "Board not found or access denied"

**Symptoms:**
```
{"error": {"code": "BOARD_NOT_FOUND", "message": "..."}}
```

**Fix:**
1. Check user is member of project
2. Check record rules: `sudo tail -f /var/log/odoo/odoo-server.log`
3. Verify board_id format: `project:123` not `123`

### Issue: "JSON schema validation failed"

**Symptoms:**
```
✗ Card response does not conform to schema
```

**Fix:**
1. Check actual API response: `curl ... | jq`
2. Compare against `/schemas/card.schema.json`
3. Fix mapping in `mapping.py`, NEVER patch controller
4. Run `./ci/validate-live-api.sh` again

### Issue: "Mentions not creating followers"

**Symptoms:**
- Comment posts successfully
- But mentioned user not notified

**Fix:**
1. Check email format in comment body
2. Verify partner exists: Search res.partner by email
3. Check logs for partner creation errors
4. Verify `message_post()` includes `partner_ids` parameter

---

## Final Checklist

Before production deployment:

- [ ] `./ci/validate-contract.sh` exits 0
- [ ] `./ci/validate-live-api.sh` exits 0 (staging)
- [ ] `rg "sudo\("` shows only 2 uses in mentions.py
- [ ] All 4 user roles tested (admin/manager/contributor/viewer)
- [ ] Frontend build succeeds with live API
- [ ] Contract version header validated in frontend
- [ ] Performance baseline established (< 200ms avg)
- [ ] No security vulnerabilities in `npm audit`
- [ ] Backup/restore procedure tested
- [ ] Rollback plan documented
- [ ] Monitoring/alerting configured

---

## Next Steps After Verification

1. **Deploy to staging:** Follow PRODUCTION.md Phase 1-3
2. **Run full test suite:** Automated E2E tests
3. **UAT:** Real users test critical flows
4. **Deploy to production:** Blue-green deployment
5. **Monitor:** Watch error rates, response times, contract version mismatches
