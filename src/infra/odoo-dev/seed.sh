#!/bin/bash
# Seed test data via Odoo shell

set -e

ODOO_CONTAINER="odoo-app"
DB_NAME="odoo"

echo "=========================================="
echo "Seeding test data"
echo "=========================================="

# Run seed script
docker exec -i "$ODOO_CONTAINER" odoo shell -d "$DB_NAME" < infra/odoo-dev/seed.py

echo ""
echo "✓ Seed complete"
