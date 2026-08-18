# ==============================================================================
# Polaris Makefile
# Space-optimized Docker commands, testing, linting, and development workflows.
# ==============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Colors for terminal output
BLUE  := \033[1;34m
GREEN := \033[1;32m
YELLOW:= \033[1;33m
RED   := \033[1;31m
RESET := \033[0m

.PHONY: help
help: ## Display this help screen
	@echo -e "$(BLUE)Polaris Project Commands:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2}'

# ------------------------------------------------------------------------------
# Docker Stack Automation
# ------------------------------------------------------------------------------

.PHONY: build
build: ## Build all Docker containers with BuildKit optimization
	DOCKER_BUILDKIT=1 docker compose build

.PHONY: build-backend
build-backend: ## Build space-optimized backend image only
	DOCKER_BUILDKIT=1 docker build -t polaris-backend:latest -f backend/Dockerfile ./backend

.PHONY: up
up: ## Start the full Polaris stack in background
	docker compose up -d

.PHONY: down
down: ## Stop and remove all running containers and networks
	docker compose down

.PHONY: restart
restart: ## Restart containers (usage: make restart or make restart svc=api)
	docker compose restart $(svc)

.PHONY: logs
logs: ## Stream logs from all services (or specify svc=api)
	docker compose logs -f $(svc)

.PHONY: ps
ps: ## Check status of Polaris containers
	docker compose ps

.PHONY: shell
shell: ## Open an interactive bash shell in the running backend API container
	docker compose exec api /bin/bash

# ------------------------------------------------------------------------------
# Backend Local Dev & Quality Checks
# ------------------------------------------------------------------------------

.PHONY: be-install
be-install: ## Install backend Python dependencies locally
	cd backend && pip install -r requirements.txt

.PHONY: be-test
be-test: ## Run backend unit & integration test suite
	cd backend && pytest

.PHONY: be-lint
be-lint: ## Run ruff lint check on backend
	cd backend && ruff check app tests

.PHONY: be-fmt
be-fmt: ## Run ruff formatter on backend
	cd backend && ruff format app tests

.PHONY: be-type
be-type: ## Run mypy static type checking on backend
	cd backend && mypy app

.PHONY: be-check
be-check: be-fmt be-lint be-type be-test ## Run all backend format, lint, type, and test checks

.PHONY: be-dev
be-dev: ## Run backend locally with hot reload
	cd backend && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# ------------------------------------------------------------------------------
# Frontend Local Dev & Quality Checks
# ------------------------------------------------------------------------------

.PHONY: fe-install
fe-install: ## Install frontend npm dependencies
	cd frontend && npm install

.PHONY: fe-dev
fe-dev: ## Run frontend Next.js dev server
	cd frontend && npm run dev

.PHONY: fe-lint
fe-lint: ## Run frontend lint checks
	cd frontend && npm run lint

.PHONY: fe-type
fe-type: ## Run frontend TypeScript type checks
	cd frontend && npm run type-check

.PHONY: fe-build
fe-build: ## Build production frontend bundle
	cd frontend && npm run build

.PHONY: fe-check
fe-check: fe-lint fe-type fe-build ## Run all frontend quality checks

# ------------------------------------------------------------------------------
# Cross-Stack & Cleanup
# ------------------------------------------------------------------------------

.PHONY: check
check: be-check fe-check ## Run full repository verification (backend + frontend)
	@echo -e "$(GREEN)✓ All Polaris checks passed successfully.$(RESET)"

.PHONY: clean
clean: ## Clean Python caches, coverage artifacts, and dangling Docker images
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -f backend/.coverage backend/coverage.xml
	docker image prune -f --filter "dangling=true" 2>/dev/null || true
	@echo -e "$(GREEN)✓ Workspace cleaned.$(RESET)"
