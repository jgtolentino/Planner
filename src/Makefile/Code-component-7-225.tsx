.PHONY: help deps up down restart logs install-module seed test-contract test-live test-drift test-all record-fixtures clean status verify verify-idempotent

# Configuration
ODOO_URL := http://localhost:8069
ODOO_DB := odoo
ODOO_LOGIN := admin
ODOO_PASSWORD := admin
COMPOSE_FILE := infra/odoo-dev/docker-compose.yml

help: ## Show this help message
	@echo "=========================================="
	@echo "Odoo Taskboard API - Test Harness"
	@echo "=========================================="
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

deps: ## Install local dependencies (no global installs required)
	@echo "Installing local dependencies..."
	@npm install
	@echo "✓ Dependencies installed (ajv-cli, tsx, typescript)"

up: ## Start Odoo + Postgres
	@echo "Starting Odoo + Postgres..."
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "Waiting for services to be healthy..."
	@sleep 10
	@docker-compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "✓ Odoo running at: $(ODOO_URL)"
	@echo "  DB: $(ODOO_DB)"
	@echo "  Login: $(ODOO_LOGIN) / $(ODOO_PASSWORD)"

down: ## Stop and remove containers
	@echo "Stopping services..."
	docker-compose -f $(COMPOSE_FILE) down

restart: down up ## Restart all services

logs: ## Show Odoo logs
	docker-compose -f $(COMPOSE_FILE) logs -f odoo

status: ## Show service status
	@docker-compose -f $(COMPOSE_FILE) ps

install-module: ## Install ipai_taskboard_api module (idempotent)
	@echo "Installing module..."
	@chmod +x infra/odoo-dev/install-module.sh infra/odoo-dev/wait-odoo.sh
	@./infra/odoo-dev/install-module.sh

seed: ## Seed test data (idempotent via XML IDs)
	@echo "Seeding test data..."
	@chmod +x infra/odoo-dev/seed.sh
	@./infra/odoo-dev/seed.sh

test-contract: deps ## Run local contract validation
	@echo "Running contract validation..."
	@chmod +x ci/validate-contract.sh
	@./ci/validate-contract.sh

test-live: deps ## Run live API validation against Odoo
	@echo "Running live API validation..."
	@chmod +x ci/validate-live-api.sh
	@ODOO_DB=$(ODOO_DB) ODOO_LOGIN=$(ODOO_LOGIN) ODOO_PASSWORD=$(ODOO_PASSWORD) \
		./ci/validate-live-api.sh $(ODOO_URL)

test-drift: deps ## Check contract drift (live responses vs schemas)
	@echo "Checking contract drift..."
	@chmod +x ci/check-contract-drift.sh
	@ODOO_DB=$(ODOO_DB) ODOO_LOGIN=$(ODOO_LOGIN) ODOO_PASSWORD=$(ODOO_PASSWORD) \
		./ci/check-contract-drift.sh $(ODOO_URL)

test-all: test-contract test-live test-drift ## Run all tests

record-fixtures: deps ## Record live API responses as golden fixtures
	@echo "Recording live fixtures..."
	@chmod +x ci/record-live-fixtures.sh
	@ODOO_DB=$(ODOO_DB) ODOO_LOGIN=$(ODOO_LOGIN) ODOO_PASSWORD=$(ODOO_PASSWORD) \
		./ci/record-live-fixtures.sh $(ODOO_URL)

verify: up install-module seed test-all ## Full verification (up + install + seed + test)
	@echo ""
	@echo "=========================================="
	@echo "✓ VERIFICATION COMPLETE"
	@echo "=========================================="

verify-idempotent: verify ## Verify idempotency (run verify twice)
	@echo ""
	@echo "=========================================="
	@echo "Testing idempotency (running verify again)..."
	@echo "=========================================="
	@echo ""
	@$(MAKE) install-module
	@$(MAKE) seed
	@$(MAKE) test-all
	@echo ""
	@echo "=========================================="
	@echo "✓ IDEMPOTENCY VERIFIED"
	@echo "=========================================="

clean: down ## Clean all containers and volumes
	@echo "Removing volumes..."
	docker-compose -f $(COMPOSE_FILE) down -v
	@echo "✓ Cleanup complete"

# Development helpers
shell: ## Open Odoo shell
	docker exec -it odoo-app odoo shell -d $(ODOO_DB)

psql: ## Open PostgreSQL shell
	docker exec -it odoo-postgres psql -U odoo -d $(ODOO_DB)

rebuild: clean up install-module seed ## Full rebuild from scratch
	@echo ""
	@echo "✓ Rebuild complete"
