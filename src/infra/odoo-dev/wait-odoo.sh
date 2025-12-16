#!/bin/bash
# Wait for Odoo to be fully ready (not just healthy)

set -e

ODOO_URL="${1:-http://localhost:8069}"
MAX_ATTEMPTS="${2:-30}"
SLEEP_INTERVAL="${3:-2}"

echo "Waiting for Odoo to be ready at $ODOO_URL..."

attempt=0
while [ $attempt -lt $MAX_ATTEMPTS ]; do
    attempt=$((attempt + 1))
    
    # Check 1: Postgres must be accepting connections
    if ! docker exec odoo-postgres pg_isready -U odoo > /dev/null 2>&1; then
        echo "  [$attempt/$MAX_ATTEMPTS] Postgres not ready..."
        sleep $SLEEP_INTERVAL
        continue
    fi
    
    # Check 2: Odoo container must be running
    if ! docker ps | grep odoo-app | grep -q "Up"; then
        echo "  [$attempt/$MAX_ATTEMPTS] Odoo container not running..."
        sleep $SLEEP_INTERVAL
        continue
    fi
    
    # Check 3: Odoo HTTP endpoint must respond
    if ! curl -sf "$ODOO_URL/web/login" > /dev/null 2>&1; then
        echo "  [$attempt/$MAX_ATTEMPTS] Odoo HTTP not responding..."
        sleep $SLEEP_INTERVAL
        continue
    fi
    
    # Check 4: Odoo database must be initialized
    DB_EXISTS=$(docker exec -i odoo-postgres psql -U odoo -lqt 2>/dev/null | cut -d \| -f 1 | grep -w odoo | wc -l)
    if [ "$DB_EXISTS" -eq 0 ]; then
        echo "  [$attempt/$MAX_ATTEMPTS] Odoo database not initialized..."
        sleep $SLEEP_INTERVAL
        continue
    fi
    
    # All checks passed
    echo "✓ Odoo is ready!"
    exit 0
done

echo "✗ Timeout waiting for Odoo to be ready after $MAX_ATTEMPTS attempts"
exit 1
