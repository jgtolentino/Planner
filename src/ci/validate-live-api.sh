#!/bin/bash
# Validate Live Odoo API Against Contract
# Usage: ./ci/validate-live-api.sh http://localhost:8069

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <odoo_base_url>"
    echo "Example: $0 http://localhost:8069"
    exit 1
fi

ODOO_URL="$1"
API_BASE="$ODOO_URL/api/v1"

echo "=========================================="
echo "Live API Contract Validation"
echo "Odoo URL: $ODOO_URL"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0

# ============================================================================
# Authentication
# ============================================================================

# Support multiple auth methods:
# 1. ODOO_SESSION (manual session ID)
# 2. ODOO_DB + ODOO_LOGIN + ODOO_PASSWORD (automatic session creation)

if [ -z "$ODOO_SESSION" ]; then
    if [ -z "$ODOO_DB" ] || [ -z "$ODOO_LOGIN" ] || [ -z "$ODOO_PASSWORD" ]; then
        echo -e "${YELLOW}Warning: No authentication provided.${NC}"
        echo "Set either:"
        echo "  ODOO_SESSION=<session_id>"
        echo "or:"
        echo "  ODOO_DB=<db> ODOO_LOGIN=<login> ODOO_PASSWORD=<password>"
        exit 0
    fi
    
    # Authenticate and get session
    echo -e "\n${YELLOW}Authenticating...${NC}"
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
    
    # Extract session from cookies
    if [ -f /tmp/odoo_cookies.txt ]; then
        ODOO_SESSION=$(grep session_id /tmp/odoo_cookies.txt | awk '{print $7}')
    fi
    
    if [ -z "$ODOO_SESSION" ]; then
        echo -e "${RED}✗ Authentication failed${NC}"
        echo "Response: $AUTH_RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Authenticated successfully${NC}"
fi

COOKIE="session_id=$ODOO_SESSION"

# ============================================================================
# Test 1: GET /boards
# ============================================================================

echo -e "\n${YELLOW}[1/5] Testing GET /boards...${NC}"
RESPONSE=$(curl -s -X GET "$API_BASE/boards" \
    -H "Content-Type: application/json" \
    -H "Cookie: $COOKIE")

if echo "$RESPONSE" | jq -e '.boards' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ GET /boards returned valid response${NC}"
    
    # Extract first board for detailed validation
    FIRST_BOARD=$(echo "$RESPONSE" | jq '.boards[0]' 2>/dev/null || echo "{}")
    
    if [ "$FIRST_BOARD" != "{}" ] && [ "$FIRST_BOARD" != "null" ]; then
        # Save to temp file
        echo "$FIRST_BOARD" > /tmp/board_response.json
        
        # Validate against schema
        if command -v ajv &> /dev/null; then
            if ajv validate -s schemas/board.schema.json -d /tmp/board_response.json 2>/dev/null; then
                echo -e "${GREEN}✓ Board response conforms to schema${NC}"
            else
                echo -e "${RED}✗ Board response does not conform to schema${NC}"
                echo "Response:"
                cat /tmp/board_response.json | jq
                FAILED=1
            fi
        else
            if npx ajv-cli validate -s schemas/board.schema.json -d /tmp/board_response.json 2>/dev/null; then
                echo -e "${GREEN}✓ Board response conforms to schema${NC}"
            else
                echo -e "${RED}✗ Board response does not conform to schema${NC}"
                echo "Response:"
                cat /tmp/board_response.json | jq
                FAILED=1
            fi
        fi
    fi
else
    echo -e "${RED}✗ GET /boards failed or returned invalid response${NC}"
    echo "$RESPONSE" | jq 2>/dev/null || echo "$RESPONSE"
    FAILED=1
fi

# ============================================================================
# Test 2: Contract version header
# ============================================================================

echo -e "\n${YELLOW}[2/5] Checking contract version header...${NC}"
HEADERS=$(curl -s -I -X GET "$API_BASE/boards" \
    -H "Content-Type: application/json" \
    -H "Cookie: $COOKIE")

CONTRACT_VERSION=$(echo "$HEADERS" | grep -i "x-contract-version" | cut -d: -f2 | tr -d ' \r\n' || echo "missing")
EXPECTED_VERSION=$(grep "CONTRACT_VERSION = " types/api-contract.ts | sed -E "s/.*'([0-9.]+)'.*/\1/" | head -1)

if [ "$CONTRACT_VERSION" == "$EXPECTED_VERSION" ]; then
    echo -e "${GREEN}✓ Contract version header matches: v${CONTRACT_VERSION}${NC}"
elif [ "$CONTRACT_VERSION" == "missing" ]; then
    echo -e "${YELLOW}⚠ Contract version header missing (check if Odoo is setting headers correctly)${NC}"
else
    echo -e "${RED}✗ Contract version mismatch${NC}"
    echo -e "  Expected: ${EXPECTED_VERSION}"
    echo -e "  Received: ${CONTRACT_VERSION}"
    FAILED=1
fi

# ============================================================================
# Test 3: GET /boards/{id}/cards
# ============================================================================

echo -e "\n${YELLOW}[3/5] Testing GET /boards/{id}/cards...${NC}"

if [ "$FIRST_BOARD" != "{}" ] && [ "$FIRST_BOARD" != "null" ]; then
    BOARD_ID=$(echo "$FIRST_BOARD" | jq -r '.board_id')
    
    CARDS_RESPONSE=$(curl -s -X GET "$API_BASE/boards/$BOARD_ID/cards" \
        -H "Content-Type: application/json" \
        -H "Cookie: $COOKIE")
    
    if echo "$CARDS_RESPONSE" | jq -e '.cards' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ GET /boards/{id}/cards returned valid response${NC}"
        
        # Validate first card against schema
        FIRST_CARD=$(echo "$CARDS_RESPONSE" | jq '.cards[0]' 2>/dev/null || echo "{}")
        
        if [ "$FIRST_CARD" != "{}" ] && [ "$FIRST_CARD" != "null" ]; then
            echo "$FIRST_CARD" > /tmp/card_response.json
            
            if command -v ajv &> /dev/null; then
                if ajv validate -s schemas/card.schema.json -d /tmp/card_response.json 2>/dev/null; then
                    echo -e "${GREEN}✓ Card response conforms to schema${NC}"
                else
                    echo -e "${RED}✗ Card response does not conform to schema${NC}"
                    echo "Response:"
                    cat /tmp/card_response.json | jq
                    FAILED=1
                fi
            fi
        fi
    else
        echo -e "${RED}✗ GET /boards/{id}/cards failed${NC}"
        echo "$CARDS_RESPONSE" | jq 2>/dev/null || echo "$CARDS_RESPONSE"
        FAILED=1
    fi
fi

# ============================================================================
# Test 4: POST /cards
# ============================================================================

echo -e "\n${YELLOW}[4/5] Testing POST /cards...${NC}"

if [ "$BOARD_ID" != "" ] && [ "$FIRST_BOARD" != "{}" ]; then
    # Get first stage
    FIRST_STAGE=$(echo "$FIRST_BOARD" | jq -r '.stages[0].stage_id')
    
    if [ "$FIRST_STAGE" != "" ] && [ "$FIRST_STAGE" != "null" ]; then
        CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/cards" \
            -H "Content-Type: application/json" \
            -H "Cookie: $COOKIE" \
            -d "{
                \"board_id\": \"$BOARD_ID\",
                \"stage_id\": \"$FIRST_STAGE\",
                \"title\": \"CI Test Card - $(date +%s)\",
                \"description_md\": \"Created by CI validation script\",
                \"priority\": \"1\"
            }")
        
        if echo "$CREATE_RESPONSE" | jq -e '.card' > /dev/null 2>&1; then
            echo -e "${GREEN}✓ POST /cards created card successfully${NC}"
            
            TEST_CARD_ID=$(echo "$CREATE_RESPONSE" | jq -r '.card.card_id')
            
            # ============================================================================
            # Test 5: PATCH /cards/{id}
            # ============================================================================
            
            echo -e "\n${YELLOW}[5/5] Testing PATCH /cards/{id}...${NC}"
            
            UPDATE_RESPONSE=$(curl -s -X PATCH "$API_BASE/cards/$TEST_CARD_ID" \
                -H "Content-Type: application/json" \
                -H "Cookie: $COOKIE" \
                -d "{
                    \"title\": \"CI Test Card - Updated\",
                    \"priority\": \"2\"
                }")
            
            if echo "$UPDATE_RESPONSE" | jq -e '.card' > /dev/null 2>&1; then
                echo -e "${GREEN}✓ PATCH /cards/{id} updated card successfully${NC}"
            else
                echo -e "${RED}✗ PATCH /cards/{id} failed${NC}"
                echo "$UPDATE_RESPONSE" | jq 2>/dev/null || echo "$UPDATE_RESPONSE"
                FAILED=1
            fi
        else
            echo -e "${RED}✗ POST /cards failed${NC}"
            echo "$CREATE_RESPONSE" | jq 2>/dev/null || echo "$CREATE_RESPONSE"
            FAILED=1
        fi
    fi
fi

# Cleanup
rm -f /tmp/odoo_cookies.txt /tmp/board_response.json /tmp/card_response.json

# Summary
echo -e "\n=========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All live API validation checks passed${NC}"
    echo -e "=========================================="
    exit 0
else
    echo -e "${RED}✗ Live API validation FAILED${NC}"
    echo -e "=========================================="
    exit 1
fi