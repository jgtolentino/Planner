# Comprehensive End-to-End Project Assessment Prompt

## Context

You are a senior full-stack engineer conducting a **production readiness audit** of a complete task management system. This is a real codebase—not a prototype—built with:

- **Backend:** Odoo CE 18 + OCA extensions with custom REST API module
- **Frontend:** React + TypeScript + Tailwind CSS (7 complete views)
- **Contract:** TypeScript-first API contract (frozen at v1.0.0)
- **Architecture:** Contract-first design with replaceable UI layer
- **Deployment:** Docker-based dev environment + production hardening

---

## Your Mission

Perform a **comprehensive, systematic assessment** of this repository covering:

1. **Contract Integrity** - Is the contract truly locked and honored?
2. **Backend Completeness** - Does the Odoo module implement the full contract?
3. **Frontend Completeness** - Are all 7 views production-ready?
4. **Data Model Alignment** - Do UI, contract, and Odoo models align perfectly?
5. **Security Posture** - Is the system secure for production?
6. **Testing Coverage** - Is the test harness comprehensive?
7. **Deployment Readiness** - Can this be deployed to production today?
8. **Documentation Quality** - Can a new developer onboard without help?

---

## Assessment Framework

### Phase 1: Repository Structure Audit

**Read and analyze:**
- `/README.md` - Main documentation
- `/PRODUCTION.md` - Production deployment guide
- `/VERIFICATION.md` - Testing procedures
- `/UI_COMPLETE_VIEW_SUITE.md` - Frontend view documentation
- `/PRODUCTION_HARDENING_COMPLETE.md` - Security hardening status

**Questions to answer:**
1. Does the repository have a clear file structure?
2. Are there redundant or conflicting documentation files?
3. Is there a single source of truth for each concern?
4. Are there any stale or abandoned files?

**Output:**
```markdown
## Repository Structure Assessment

### ✅ Strengths
- [List organized aspects]

### ⚠️ Issues
- [List structural problems]

### 🔧 Recommendations
- [Actionable fixes]
```

---

### Phase 2: Contract Lock Verification

**Files to inspect:**
- `/types/api-contract.ts` - TypeScript contract (version: ?)
- `/schemas/*.json` - JSON schemas for validation
- `/odoo-module/ipai_taskboard_api/services/mapping.py` - Backend mapping

**Verification steps:**
1. Extract `CONTRACT_VERSION` from all locations
2. Verify all versions match exactly
3. Check if contract is truly frozen (no breaking changes)
4. Validate that all JSON schemas align with TypeScript contract
5. Ensure backend mapping.py honors every field

**Critical questions:**
- Is the contract version consistent across frontend, backend, and schemas?
- Are there any undocumented fields in the API responses?
- Do the JSON schemas actually validate all required fields?
- Is there a mechanism to reject mismatched contract versions?

**Output:**
```markdown
## Contract Lock Assessment

### Contract Version Consistency
- Frontend: `[version]`
- Backend: `[version]`
- Schemas: `[version]`
- **Status:** ✅ Match / ❌ Mismatch

### Schema Validation
- Board schema: ✅/❌
- Card schema: ✅/❌
- Activity schema: ✅/❌

### Breaking Change Protection
- Version check in API client: ✅/❌
- Version header in responses: ✅/❌

### 🔧 Recommendations
- [List contract fixes needed]
```

---

### Phase 3: Backend Implementation Audit

**Files to inspect:**
- `/odoo-module/ipai_taskboard_api/controllers/*.py` - REST endpoints
- `/odoo-module/ipai_taskboard_api/services/mapping.py` - DTO mapping
- `/odoo-module/ipai_taskboard_api/services/auth.py` - Authentication
- `/odoo-module/ipai_taskboard_api/services/rbac.py` - Authorization
- `/odoo-module/ipai_taskboard_api/services/security.py` - Security middleware
- `/odoo-module/ipai_taskboard_api/security/ir.model.access.csv` - ACL rules

**Questions to answer:**
1. **API Completeness:**
   - Are all endpoints from `/docs/api-endpoints.md` implemented?
   - Do controllers call mapping.py (never build JSON directly)?
   - Are all request/response types validated?

2. **Security:**
   - Is authentication enforced on protected endpoints?
   - Are record-level permissions (RLS) correctly applied?
   - Is `sudo()` used safely (only for partner resolution)?
   - Is input sanitized (SQL injection, XSS prevention)?
   - Is rate limiting implemented?

3. **Data Integrity:**
   - Does mapping.py cover all contract fields?
   - Are Odoo → DTO transformations correct?
   - Are relationships (e.g., card → board) validated?
   - Is the audit trail (mail.tracking.value) working?

4. **Error Handling:**
   - Are errors returned in consistent JSON format?
   - Are error codes meaningful?
   - Is error context sufficient for debugging?

**Verification commands:**
```bash
# Check sudo() usage (should be minimal)
rg "sudo\(" odoo-module/ipai_taskboard_api -n

# Check for direct JSON construction (should be zero)
rg "return.*{.*:.*}" odoo-module/ipai_taskboard_api/controllers -n

# Check for SQL injection risks
rg "execute\(f\"" odoo-module/ipai_taskboard_api -n
```

**Output:**
```markdown
## Backend Implementation Assessment

### API Completeness
- Endpoints implemented: X/Y
- Missing endpoints: [list]

### Security Posture
- Authentication: ✅/❌
- Authorization (RBAC): ✅/❌
- Record-level security: ✅/❌
- sudo() usage: ✅ Safe / ❌ Unsafe
- Input validation: ✅/❌
- SQL injection protection: ✅/❌
- XSS prevention: ✅/❌

### Data Mapping
- Contract fields covered: X/Y
- Missing fields: [list]
- Type conversions correct: ✅/❌

### 🔧 Critical Fixes Required
- [List security vulnerabilities]
- [List missing implementations]
```

---

### Phase 4: Frontend Implementation Audit

**Files to inspect:**
- `/App.tsx` - Main routing
- `/components/AppSidebar.tsx` - Navigation
- `/components/views/*.tsx` - All 7 views
- `/components/board-views/*.tsx` - Board tab views
- `/lib/api-client.ts` - API integration

**Questions to answer:**
1. **View Completeness (7 views required):**
   - ✅ My Tasks (cross-board hub with Grid | Board toggle)
   - ✅ My Day (today-focused view)
   - ✅ My Plans (board index)
   - ✅ Board → Board tab (Kanban)
   - ✅ Board → Grid tab (table)
   - ✅ Board → Schedule tab (calendar)
   - ✅ Board → Charts tab (analytics)

2. **Production Readiness:**
   - Are all views using real API calls or mock data?
   - Do all views have loading states?
   - Do all views have empty states?
   - Do all views have error states?
   - Is there proper error boundary implementation?

3. **User Experience:**
   - Is navigation intuitive?
   - Are interactions smooth (drag-drop, filters, search)?
   - Is the UI responsive (mobile, tablet, desktop)?
   - Are there accessibility issues (ARIA, keyboard nav)?

4. **Data Flow:**
   - Does the API client validate contract version?
   - Are optimistic updates implemented?
   - Is state management clean (no prop drilling)?
   - Are API errors surfaced to the user?

**Verification steps:**
```bash
# Check for mock data usage
rg "setTimeout|mockData" components/ -n

# Check for missing error states
rg "try.*catch|error" components/ -c

# Check for accessibility issues
rg "aria-|role=" components/ -c
```

**Output:**
```markdown
## Frontend Implementation Assessment

### View Completeness
1. My Tasks: ✅ Complete / ⚠️ Partial / ❌ Missing
2. My Day: ✅ Complete / ⚠️ Partial / ❌ Missing
3. My Plans: ✅ Complete / ⚠️ Partial / ❌ Missing
4. Board → Board: ✅ Complete / ⚠️ Partial / ❌ Missing
5. Board → Grid: ✅ Complete / ⚠️ Partial / ❌ Missing
6. Board → Schedule: ✅ Complete / ⚠️ Partial / ❌ Missing
7. Board → Charts: ✅ Complete / ⚠️ Partial / ❌ Missing

### Production States
- Loading states: ✅/⚠️/❌
- Empty states: ✅/⚠️/❌
- Error states: ✅/⚠️/❌
- Error boundaries: ✅/❌

### API Integration
- Mock data usage: X files still using mocks
- Real API integration: ✅/❌
- Contract version validation: ✅/❌
- Error handling: ✅/⚠️/❌

### UX Quality
- Navigation flow: ✅/⚠️/❌
- Responsive design: ✅/⚠️/❌
- Accessibility: ✅/⚠️/❌

### 🔧 Critical Fixes Required
- [List missing views or features]
- [List UX issues]
```

---

### Phase 5: Test Harness Evaluation

**Files to inspect:**
- `/ci/*.sh` - CI validation scripts
- `/infra/odoo-dev/docker-compose.yml` - Docker setup
- `/infra/odoo-dev/seed.py` - Test data seeding
- `/ci/fixtures/*.json` - Golden response fixtures
- `/.github/workflows/*.yml` - CI/CD pipeline

**Questions to answer:**
1. **Test Coverage:**
   - Does `make verify` run all tests?
   - Are contract validations automated?
   - Is live API validation working?
   - Are there golden response fixtures for all endpoints?

2. **Docker Environment:**
   - Does the dev environment start cleanly?
   - Is module installation idempotent?
   - Is seed data realistic?
   - Are there health checks?

3. **CI/CD Pipeline:**
   - Are all gates defined and working?
   - Is contract drift detection enabled?
   - Are security scans automated?
   - Is the deployment process documented?

**Verification steps:**
```bash
# Try to run the full test suite
cd /path/to/repo
make verify

# Check if fixtures are up to date
./ci/record-live-fixtures.sh
git diff ci/fixtures/
```

**Output:**
```markdown
## Test Harness Assessment

### Test Coverage
- Contract validation: ✅/❌
- Live API validation: ✅/❌
- Golden fixtures: ✅/⚠️/❌
- Integration tests: ✅/❌

### Docker Environment
- Clean startup: ✅/❌
- Module installation: ✅/❌
- Seed data: ✅/❌
- Health checks: ✅/❌

### CI/CD Pipeline
- Contract drift detection: ✅/❌
- Security scanning: ✅/❌
- Deployment automation: ✅/⚠️/❌

### 🔧 Critical Fixes Required
- [List test gaps]
- [List CI/CD issues]
```

---

### Phase 6: Security Hardening Audit

**Files to inspect:**
- `/PRODUCTION.md` - Security checklist
- `/odoo-module/ipai_taskboard_api/services/security.py` - Security middleware
- `/infra/odoo-dev/odoo.conf` - Odoo configuration

**Critical security checks:**
1. **Authentication:**
   - Is session auth implemented?
   - Is token auth (JWT) ready for production?
   - Is password hashing secure?

2. **Authorization:**
   - Are record-level permissions enforced?
   - Can users only access their own data?
   - Is privilege escalation prevented?

3. **Input Validation:**
   - Is all user input sanitized?
   - Are SQL injection attacks prevented?
   - Are XSS attacks prevented?
   - Is CSRF protection enabled?

4. **Network Security:**
   - Is HTTPS enforced?
   - Are CORS policies configured?
   - Is rate limiting implemented?
   - Are security headers set?

5. **Secrets Management:**
   - Are secrets in environment variables (not code)?
   - Is admin password strong?
   - Are API keys rotated?

**Output:**
```markdown
## Security Hardening Assessment

### Authentication
- Session auth: ✅/❌
- Token auth: ✅/⚠️/❌
- Password policy: ✅/❌

### Authorization
- RBAC: ✅/❌
- Record-level security: ✅/❌
- Privilege escalation prevention: ✅/❌

### Input Validation
- SQL injection prevention: ✅/❌
- XSS prevention: ✅/❌
- CSRF protection: ✅/❌

### Network Security
- HTTPS enforced: ✅/❌
- CORS configured: ✅/❌
- Rate limiting: ✅/❌
- Security headers: ✅/❌

### 🚨 Critical Vulnerabilities
- [List security issues by severity]

### 🔧 Hardening Required
- [List security improvements]
```

---

### Phase 7: Documentation Quality Audit

**Files to inspect:**
- `/README.md` - Main docs
- `/PRODUCTION.md` - Deployment guide
- `/VERIFICATION.md` - Testing guide
- `/odoo-module/README.md` - Module docs
- `/docs/api-endpoints.md` - API spec
- `/docs/odoo-field-mapping.md` - Field mappings

**Questions to answer:**
1. **Completeness:**
   - Can a new developer set up the project from README alone?
   - Are all API endpoints documented?
   - Are all Odoo field mappings clear?
   - Is the deployment process step-by-step?

2. **Accuracy:**
   - Are code examples up to date?
   - Do documented commands actually work?
   - Are version numbers consistent?

3. **Clarity:**
   - Is the architecture diagram clear?
   - Are data model relationships explained?
   - Is the security model documented?

**Output:**
```markdown
## Documentation Quality Assessment

### Completeness
- Setup guide: ✅/⚠️/❌
- API documentation: ✅/⚠️/❌
- Deployment guide: ✅/⚠️/❌
- Architecture overview: ✅/⚠️/❌

### Accuracy
- Code examples work: ✅/⚠️/❌
- Commands verified: ✅/⚠️/❌
- Versions consistent: ✅/❌

### Clarity
- Architecture diagram: ✅/⚠️/❌
- Data model explained: ✅/⚠️/❌
- Security model documented: ✅/⚠️/❌

### 🔧 Documentation Improvements
- [List gaps or inaccuracies]
```

---

### Phase 8: Production Deployment Readiness

**Final checklist (from `/PRODUCTION.md`):**

**Contract:**
- [ ] Version frozen at 1.0.0
- [ ] All CI gates passing
- [ ] No breaking changes pending

**Backend:**
- [ ] Odoo module tested in production-like environment
- [ ] All endpoints returning correct contract version
- [ ] Security hardening complete
- [ ] Backup and restore procedures tested

**Frontend:**
- [ ] All 7 views complete and tested
- [ ] API client using real endpoints (not mocks)
- [ ] Error handling production-ready
- [ ] Performance optimized (Lighthouse > 90)

**Infrastructure:**
- [ ] Docker Compose working for development
- [ ] Production deployment guide complete
- [ ] Monitoring and logging configured
- [ ] Health checks implemented

**Security:**
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] Input validation enabled
- [ ] HTTPS configured
- [ ] Rate limiting set up

**Output:**
```markdown
## Production Deployment Readiness

### Overall Score: X/100

### Ready for Production: ✅ YES / ⚠️ WITH FIXES / ❌ NO

### Blocking Issues (Must Fix Before Deploy)
1. [Critical issue 1]
2. [Critical issue 2]
...

### Recommended Improvements (Nice to Have)
1. [Enhancement 1]
2. [Enhancement 2]
...

### Deployment Risk Assessment
- **Risk Level:** 🟢 Low / 🟡 Medium / 🔴 High
- **Rationale:** [Explain risk assessment]
```

---

## Final Deliverable Format

Your assessment should be structured as a **comprehensive markdown report**:

```markdown
# End-to-End Project Assessment Report

**Project:** Notion-style Kanban on Odoo CE + OCA 18  
**Contract Version:** 1.0.0  
**Assessment Date:** [Date]  
**Assessed By:** [Your Name/ID]

---

## Executive Summary

[3-5 sentence overview of findings]

**Overall Grade:** A+ / A / B / C / D / F

**Production Ready:** ✅ YES / ⚠️ WITH FIXES / ❌ NO

---

## Detailed Findings

### 1. Repository Structure
[From Phase 1]

### 2. Contract Lock
[From Phase 2]

### 3. Backend Implementation
[From Phase 3]

### 4. Frontend Implementation
[From Phase 4]

### 5. Test Harness
[From Phase 5]

### 6. Security Hardening
[From Phase 6]

### 7. Documentation Quality
[From Phase 7]

### 8. Production Readiness
[From Phase 8]

---

## Critical Action Items

### Must Fix Before Production (P0)
1. [Issue 1]
2. [Issue 2]
...

### Should Fix Soon (P1)
1. [Issue 1]
2. [Issue 2]
...

### Nice to Have (P2)
1. [Enhancement 1]
2. [Enhancement 2]
...

---

## Strengths

- [List 3-5 strongest aspects]

---

## Weaknesses

- [List 3-5 areas needing improvement]

---

## Recommendations

### Short-term (1-2 weeks)
- [Action 1]
- [Action 2]

### Medium-term (1-2 months)
- [Action 1]
- [Action 2]

### Long-term (3+ months)
- [Action 1]
- [Action 2]

---

## Conclusion

[Final verdict on production readiness]
```

---

## Assessment Guidelines

### Severity Levels

- **🚨 Critical:** Blocks production deployment, security vulnerability
- **⚠️ High:** Significant issue, degrades user experience
- **🟡 Medium:** Minor issue, should be fixed soon
- **🟢 Low:** Nice to have, can defer

### Grading Rubric

- **A+ (95-100):** Exceptional quality, production-ready, best practices followed
- **A (90-94):** Excellent quality, minor improvements needed
- **B (80-89):** Good quality, some fixes required before production
- **C (70-79):** Acceptable quality, multiple issues to address
- **D (60-69):** Below standard, significant work needed
- **F (<60):** Not production-ready, major rework required

---

## Tools and Commands to Use

```bash
# Clone repository
git clone [repo-url]
cd [repo-dir]

# Check contract versions
grep -r "CONTRACT_VERSION" types/ odoo-module/

# Run full test suite
make verify

# Check for security issues
rg "sudo\(" odoo-module/ -n
rg "execute\(f\"" odoo-module/ -n

# Check for mock data in frontend
rg "setTimeout|mockData" components/ -n

# Validate JSON schemas
./ci/validate-contract.sh

# Check Docker environment
docker-compose -f infra/odoo-dev/docker-compose.yml up -d
docker-compose -f infra/odoo-dev/docker-compose.yml logs

# Check for TypeScript errors
npm run type-check

# Run accessibility audit
npm run audit:a11y

# Check bundle size
npm run build
```

---

## Success Criteria

Your assessment is complete when you can answer **YES** to all:

- [ ] I have reviewed every critical file
- [ ] I have verified contract version consistency
- [ ] I have tested the Docker development environment
- [ ] I have identified all security vulnerabilities
- [ ] I have checked all 7 frontend views
- [ ] I have reviewed all backend endpoints
- [ ] I have validated test coverage
- [ ] I have graded production readiness
- [ ] I have provided actionable recommendations
- [ ] I have structured findings clearly

---

## Begin Assessment Now

Start with **Phase 1: Repository Structure Audit** and work through each phase systematically. Be thorough, be critical, and be constructive. This is a real project that needs a real assessment.

**Good luck!**
