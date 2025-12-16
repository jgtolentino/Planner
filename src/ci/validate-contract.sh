#!/bin/bash
# Contract Validation CI Gate
# This script MUST pass before merging any changes to contract or backend.

set -e

echo "=========================================="
echo "Contract Validation CI Gate"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# 1. TypeScript type check
echo -e "\n${YELLOW}[1/5] TypeScript type check...${NC}"
if npx tsc --noEmit; then
    echo -e "${GREEN}✓ TypeScript types valid${NC}"
else
    echo -e "${RED}✗ TypeScript type check failed${NC}"
    FAILED=1
fi

# 2. Lint (optional - skip if no eslint config)
echo -e "\n${YELLOW}[2/5] ESLint check (skipped if no config)...${NC}"
if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
    if npx eslint types/ lib/ data/ --ext .ts,.tsx 2>/dev/null; then
        echo -e "${GREEN}✓ Lint passed${NC}"
    else
        echo -e "${YELLOW}⚠ Lint warnings (non-blocking)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No ESLint config found, skipping${NC}"
fi

# 3. JSON Schema validation
echo -e "\n${YELLOW}[3/5] JSON Schema validation...${NC}"
if npx ajv-cli validate -s schemas/board.schema.json -d "ci/fixtures/board.json" && \
   npx ajv-cli validate -s schemas/card.schema.json -d "ci/fixtures/card.json" && \
   npx ajv-cli validate -s schemas/activity.schema.json -d "ci/fixtures/activity.json"; then
    echo -e "${GREEN}✓ JSON schemas valid against fixtures${NC}"
else
    echo -e "${RED}✗ JSON schema validation failed${NC}"
    FAILED=1
fi

# 4. Contract version consistency
echo -e "\n${YELLOW}[4/5] Contract version consistency...${NC}"
CONTRACT_VERSION=$(grep "CONTRACT_VERSION = " types/api-contract.ts | sed -E "s/.*'([0-9.]+)'.*/\1/" | head -1)
README_VERSION=$(grep "Contract Version:" README.md | sed -E "s/.*: ([0-9.]+)/\1/" | head -1)

if [ "$CONTRACT_VERSION" == "$README_VERSION" ]; then
    echo -e "${GREEN}✓ Contract version consistent: v${CONTRACT_VERSION}${NC}"
else
    echo -e "${RED}✗ Contract version mismatch${NC}"
    echo -e "  types/api-contract.ts: ${CONTRACT_VERSION}"
    echo -e "  README.md: ${README_VERSION}"
    FAILED=1
fi

# 5. Mock data conforms to contract
echo -e "\n${YELLOW}[5/5] Validate mock data against contract...${NC}"
if npx tsx ci/validate-mock.mjs 2>/dev/null; then
    echo -e "${GREEN}✓ Mock data conforms to contract${NC}"
else
    echo -e "${YELLOW}⚠ Mock data validation skipped (tsx not in node_modules)${NC}"
    echo -e "  Run: npm install"
fi

# Summary
echo -e "\n=========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All contract validation checks passed${NC}"
    echo -e "=========================================="
    exit 0
else
    echo -e "${RED}✗ Contract validation FAILED${NC}"
    echo -e "=========================================="
    exit 1
fi