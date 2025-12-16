#!/bin/bash
# Record live API responses as golden fixtures
# Usage: ./ci/record-live-fixtures.sh http://localhost:8069

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <odoo_base_url>"
    echo "Example: $0 http://localhost:8069"
    exit 1
fi

ODOO_URL="$1"
API_BASE="$ODOO_URL/api/v1"
FIXTURES_DIR="ci/fixtures/live"

echo "=========================================="
echo "Recording Live API Responses"
echo "Odoo URL: $ODOO_URL"
echo "=========================================="

# Create fixtures directory
mkdir -p "$FIXTURES_DIR"

# Authenticate
if [ -z "$ODOO_SESSION" ]; then
    if [ -z "$ODOO_DB" ] || [ -z "$ODOO_LOGIN" ] || [ -z "$ODOO_PASSWORD" ]; then
        echo "Error: No authentication provided"
        echo "Set: ODOO_DB, ODOO_LOGIN, ODOO_PASSWORD"
        exit 1
    fi
    
    echo "Authenticating..."
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
    
    if [ -z "$ODOO_SESSION" ]; then
        echo "Authentication failed"
        exit 1
    fi
    
    echo "✓ Authenticated"
fi

COOKIE="session_id=$ODOO_SESSION"

# Record responses
echo ""
echo "Recording responses..."

# 1. GET /boards
echo "  [1/6] GET /boards"
curl -s -D "$FIXTURES_DIR/boards.headers" \
    -X GET "$API_BASE/boards" \
    -H "Content-Type: application/json" \
    -H "Cookie: $COOKIE" \
    -o "$FIXTURES_DIR/boards.json"

# Extract first board ID
BOARD_ID=$(jq -r '.boards[0].board_id' "$FIXTURES_DIR/boards.json" 2>/dev/null)

if [ "$BOARD_ID" != "null" ] && [ -n "$BOARD_ID" ]; then
    # 2. GET /boards/{id}
    echo "  [2/6] GET /boards/$BOARD_ID"
    curl -s -D "$FIXTURES_DIR/board.headers" \
        -X GET "$API_BASE/boards/$BOARD_ID" \
        -H "Content-Type: application/json" \
        -H "Cookie: $COOKIE" \
        -o "$FIXTURES_DIR/board.json"
    
    # 3. GET /boards/{id}/cards
    echo "  [3/6] GET /boards/$BOARD_ID/cards"
    curl -s -D "$FIXTURES_DIR/cards.headers" \
        -X GET "$API_BASE/boards/$BOARD_ID/cards" \
        -H "Content-Type: application/json" \
        -H "Cookie: $COOKIE" \
        -o "$FIXTURES_DIR/cards.json"
    
    # Extract first card ID
    CARD_ID=$(jq -r '.cards[0].card_id' "$FIXTURES_DIR/cards.json" 2>/dev/null)
    
    if [ "$CARD_ID" != "null" ] && [ -n "$CARD_ID" ]; then
        # 4. GET /cards/{id}/activity
        echo "  [4/6] GET /cards/$CARD_ID/activity"
        curl -s -D "$FIXTURES_DIR/activity.headers" \
            -X GET "$API_BASE/cards/$CARD_ID/activity" \
            -H "Content-Type: application/json" \
            -H "Cookie: $COOKIE" \
            -o "$FIXTURES_DIR/activity.json"
    fi
    
    # Get first stage for write operations
    STAGE_ID=$(jq -r '.board.stages[0].stage_id' "$FIXTURES_DIR/board.json" 2>/dev/null)
    
    if [ "$STAGE_ID" != "null" ] && [ -n "$STAGE_ID" ]; then
        # 5. POST /cards (create test card)
        echo "  [5/6] POST /cards"
        curl -s -D "$FIXTURES_DIR/create_card.headers" \
            -X POST "$API_BASE/cards" \
            -H "Content-Type: application/json" \
            -H "Cookie: $COOKIE" \
            -d "{
                \"board_id\": \"$BOARD_ID\",
                \"stage_id\": \"$STAGE_ID\",
                \"title\": \"Recorded Test Card\",
                \"description_md\": \"Created by record-live-fixtures.sh\",
                \"priority\": \"1\"
            }" \
            -o "$FIXTURES_DIR/create_card.json"
        
        # Extract created card ID
        CREATED_CARD_ID=$(jq -r '.card.card_id' "$FIXTURES_DIR/create_card.json" 2>/dev/null)
        
        if [ "$CREATED_CARD_ID" != "null" ] && [ -n "$CREATED_CARD_ID" ]; then
            # 6. PATCH /cards/{id}
            echo "  [6/6] PATCH /cards/$CREATED_CARD_ID"
            curl -s -D "$FIXTURES_DIR/update_card.headers" \
                -X PATCH "$API_BASE/cards/$CREATED_CARD_ID" \
                -H "Content-Type: application/json" \
                -H "Cookie: $COOKIE" \
                -d "{
                    \"title\": \"Recorded Test Card - Updated\",
                    \"priority\": \"2\"
                }" \
                -o "$FIXTURES_DIR/update_card.json"
        fi
    fi
fi

# Extract contract version from headers
echo ""
echo "Extracting metadata..."
for header_file in "$FIXTURES_DIR"/*.headers; do
    if [ -f "$header_file" ]; then
        VERSION=$(grep -i "x-contract-version" "$header_file" | cut -d: -f2 | tr -d ' \r\n' || echo "missing")
        echo "  $(basename "$header_file"): contract-version=$VERSION"
    fi
done

# Pretty-print JSON files
echo ""
echo "Formatting JSON..."
for json_file in "$FIXTURES_DIR"/*.json; do
    if [ -f "$json_file" ]; then
        jq '.' "$json_file" > "$json_file.tmp" && mv "$json_file.tmp" "$json_file"
        echo "  ✓ $(basename "$json_file")"
    fi
done

# Cleanup
rm -f /tmp/odoo_cookies.txt

# Summary
echo ""
echo "=========================================="
echo "✓ Live fixtures recorded to: $FIXTURES_DIR/"
echo "=========================================="
echo ""
echo "Files created:"
ls -lh "$FIXTURES_DIR" | tail -n +2 | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "Next steps:"
echo "  1. Review fixtures for sensitive data"
echo "  2. Use for contract drift detection"
echo "  3. Commit as golden test fixtures"
