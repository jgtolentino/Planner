#!/bin/bash
# Contract Drift Detection
# Validates live API responses match both fixtures AND schemas

set -e

ODOO_URL="${1:-http://localhost:8069}"
API_BASE="$ODOO_URL/api/v1"

echo "=========================================="
echo "Contract Drift Detection"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0

# Authenticate
if [ -z "$ODOO_SESSION" ]; then
    if [ -z "$ODOO_DB" ] || [ -z "$ODOO_LOGIN" ] || [ -z "$ODOO_PASSWORD" ]; then
        echo -e "${YELLOW}No auth provided, using defaults...${NC}"
        ODOO_DB="${ODOO_DB:-odoo}"
        ODOO_LOGIN="${ODOO_LOGIN:-admin}"
        ODOO_PASSWORD="${ODOO_PASSWORD:-admin}"
    fi
    
    AUTH_RESPONSE=$(curl -s -c /tmp/odoo_cookies.txt -X POST "$ODOO_URL/web/session/authenticate" \
        -H "Content-Type: application/json" \
        -d "{
            \"jsonrpc\": \"2.0\",
            \"params\": {
                \"db\": \"$ODOO_DB\",
                \"login\": \"$ODOO_LOGIN\",
                \"password\": \"$ODOO_PASSWORD\"
            }
        }")
    
    ODOO_SESSION=$(grep session_id /tmp/odoo_cookies.txt 2>/dev/null | awk '{print $7}')
fi

if [ -z "$ODOO_SESSION" ]; then
    echo -e "${RED}✗ Authentication failed${NC}"
    exit 1
fi

COOKIE="session_id=$ODOO_SESSION"

# Fetch live responses
echo -e "\n${YELLOW}Fetching live API responses...${NC}"

# Board
LIVE_BOARD=$(curl -s -X GET "$API_BASE/boards" \
    -H "Content-Type: application/json" \
    -H "Cookie: $COOKIE" | jq '.boards[0]' 2>/dev/null)

if [ "$LIVE_BOARD" != "null" ] && [ "$LIVE_BOARD" != "{}" ]; then
    echo "$LIVE_BOARD" > /tmp/live_board.json
    echo -e "${GREEN}✓ Fetched live board${NC}"
else
    echo -e "${YELLOW}⚠ No boards found in live API${NC}"
fi

# Card
BOARD_ID=$(echo "$LIVE_BOARD" | jq -r '.board_id' 2>/dev/null)
if [ "$BOARD_ID" != "" ] && [ "$BOARD_ID" != "null" ]; then
    LIVE_CARD=$(curl -s -X GET "$API_BASE/boards/$BOARD_ID/cards" \
        -H "Content-Type: application/json" \
        -H "Cookie: $COOKIE" | jq '.cards[0]' 2>/dev/null)
    
    if [ "$LIVE_CARD" != "null" ] && [ "$LIVE_CARD" != "{}" ]; then
        echo "$LIVE_CARD" > /tmp/live_card.json
        echo -e "${GREEN}✓ Fetched live card${NC}"
    fi
fi

# Validate against schemas
echo -e "\n${YELLOW}Validating live responses against schemas...${NC}"

if [ -f /tmp/live_board.json ]; then
    if npx ajv-cli validate -s schemas/board.schema.json -d /tmp/live_board.json 2>/dev/null; then
        echo -e "${GREEN}✓ Live board conforms to schema${NC}"
    else
        echo -e "${RED}✗ DRIFT DETECTED: Live board does not conform to schema${NC}"
        echo "Live response:"
        cat /tmp/live_board.json | jq
        echo ""
        echo "Expected schema: schemas/board.schema.json"
        FAILED=1
    fi
fi

if [ -f /tmp/live_card.json ]; then
    if npx ajv-cli validate -s schemas/card.schema.json -d /tmp/live_card.json 2>/dev/null; then
        echo -e "${GREEN}✓ Live card conforms to schema${NC}"
    else
        echo -e "${RED}✗ DRIFT DETECTED: Live card does not conform to schema${NC}"
        echo "Live response:"
        cat /tmp/live_card.json | jq
        echo ""
        echo "Expected schema: schemas/card.schema.json"
        
        # Show diff with fixture
        echo ""
        echo "Diff with fixture:"
        diff -u <(jq -S . ci/fixtures/card.json) <(jq -S . /tmp/live_card.json) || true
        
        FAILED=1
    fi
fi

# Field-level comparison
echo -e "\n${YELLOW}Field-level comparison...${NC}"

if [ -f /tmp/live_board.json ]; then
    FIXTURE_FIELDS=$(jq -r 'keys | .[]' ci/fixtures/board.json | sort)
    LIVE_FIELDS=$(jq -r 'keys | .[]' /tmp/live_board.json | sort)
    
    MISSING=$(comm -13 <(echo "$LIVE_FIELDS") <(echo "$FIXTURE_FIELDS"))
    EXTRA=$(comm -23 <(echo "$LIVE_FIELDS") <(echo "$FIXTURE_FIELDS"))
    
    if [ -n "$MISSING" ]; then
        echo -e "${RED}✗ DRIFT: Missing fields in live response:${NC}"
        echo "$MISSING" | sed 's/^/  - /'
        FAILED=1
    fi
    
    if [ -n "$EXTRA" ]; then
        echo -e "${YELLOW}⚠ Extra fields in live response (may be OK):${NC}"
        echo "$EXTRA" | sed 's/^/  - /'
    fi
    
    if [ -z "$MISSING" ] && [ -z "$EXTRA" ]; then
        echo -e "${GREEN}✓ All fields match${NC}"
    fi
fi

# Cleanup
rm -f /tmp/odoo_cookies.txt /tmp/live_board.json /tmp/live_card.json

# Summary
echo -e "\n=========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ No contract drift detected${NC}"
    echo -e "=========================================="
    exit 0
else
    echo -e "${RED}✗ CONTRACT DRIFT DETECTED${NC}"
    echo -e "=========================================="
    echo ""
    echo "Action required:"
    echo "1. If backend is correct: Update frontend contract + schemas"
    echo "2. If frontend is correct: Fix backend mapping layer"
    echo "3. Never change both at once without version bump"
    exit 1
fi