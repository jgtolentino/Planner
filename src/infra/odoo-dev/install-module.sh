#!/bin/bash
# Install ipai_taskboard_api module in Odoo (idempotent)

set -e

ODOO_CONTAINER="odoo-app"
DB_NAME="odoo"
MODULE_NAME="ipai_taskboard_api"

echo "=========================================="
echo "Installing module: $MODULE_NAME"
echo "=========================================="

# Wait for Odoo to be ready
echo "Waiting for Odoo to be ready..."
chmod +x infra/odoo-dev/wait-odoo.sh
./infra/odoo-dev/wait-odoo.sh http://localhost:8069 30 2

# Check if module already installed
echo "Checking module state..."
MODULE_STATE=$(docker exec -i odoo-postgres psql -U odoo -d "$DB_NAME" -tAc \
    "SELECT state FROM ir_module_module WHERE name = '$MODULE_NAME';" 2>/dev/null || echo "")

if [ "$MODULE_STATE" = "installed" ]; then
    echo "✓ Module $MODULE_NAME already installed (state: installed)"
    echo "Skipping installation (idempotent)"
    exit 0
fi

if [ "$MODULE_STATE" = "to upgrade" ]; then
    echo "⚠ Module $MODULE_NAME needs upgrade (state: to upgrade)"
    echo "Running upgrade..."
    docker exec "$ODOO_CONTAINER" odoo --stop-after-init \
        -d "$DB_NAME" \
        -u "$MODULE_NAME"
    echo "✓ Module upgraded successfully"
    exit 0
fi

# Module not installed, proceed with installation
echo "Module state: ${MODULE_STATE:-not found}"
echo "Proceeding with installation..."

# Ensure database exists
DB_EXISTS=$(docker exec -i odoo-postgres psql -U odoo -lqt 2>/dev/null | cut -d \| -f 1 | grep -w odoo | wc -l)
if [ "$DB_EXISTS" -eq 0 ]; then
    echo "Database 'odoo' not found, initializing..."
    docker exec "$ODOO_CONTAINER" odoo --stop-after-init \
        -d "$DB_NAME" \
        --without-demo=all
fi

# Update module list
echo "Updating module list..."
docker exec "$ODOO_CONTAINER" odoo --stop-after-init \
    -d "$DB_NAME" \
    --update=all

# Install module
echo "Installing $MODULE_NAME..."
docker exec "$ODOO_CONTAINER" odoo --stop-after-init \
    -d "$DB_NAME" \
    -i "$MODULE_NAME"

# Verify installation
MODULE_STATE=$(docker exec -i odoo-postgres psql -U odoo -d "$DB_NAME" -tAc \
    "SELECT state FROM ir_module_module WHERE name = '$MODULE_NAME';")

if [ "$MODULE_STATE" = "installed" ]; then
    echo "✓ Module $MODULE_NAME installed successfully"
    exit 0
else
    echo "✗ Module installation failed. State: $MODULE_STATE"
    echo "Check logs: docker-compose -f infra/odoo-dev/docker-compose.yml logs odoo"
    exit 1
fi
