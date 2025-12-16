.PHONY: help up down restart logs install-module seed test-contract test-live test-all clean status

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

install-module: ## Install ipai_taskboard_api module
	@echo "Installing module..."
	@chmod +x infra/odoo-dev/install-module.sh
	@./infra/odoo-dev/install-module.sh

seed: ## Seed test data (board, stages, users, tasks)
	@echo "Seeding test data..."
	@chmod +x infra/odoo-dev/seed.sh
	@./infra/odoo-dev/seed.sh

test-contract: ## Run local contract validation
	@echo "Running contract validation..."
	@chmod +x ci/validate-contract.sh
	@./ci/validate-contract.sh

test-live: ## Run live API validation against Odoo
	@echo "Running live API validation..."
	@chmod +x ci/validate-live-api.sh
	@ODOO_DB=$(ODOO_DB) ODOO_LOGIN=$(ODOO_LOGIN) ODOO_PASSWORD=$(ODOO_PASSWORD) \
		./ci/validate-live-api.sh $(ODOO_URL)

test-all: test-contract test-live ## Run all tests

verify: up install-module seed test-all ## Full verification (up + install + seed + test)
	@echo ""
	@echo "=========================================="
	@echo "✓ VERIFICATION COMPLETE"
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
