# ============================================================
# INFINEON Enterprise Platform — Makefile
# ============================================================

BINARY_NAME := infineon
BUILD_DIR := bin
GO_FLAGS := -ldflags="-s -w"
DB_NAME := infineon
DB_USER := infineon
DB_PASS := infineon_dev
PORT := 8080

# ============================================================
# DEVELOPMENT
# ============================================================

.PHONY: dev
dev: ## Run development server with hot reload
	@echo "Starting INFINEON dev server on :$(PORT)..."
	cd frontend && npm run dev -- --port 3000 &
	go run ./cmd/infineon/ serve --port $(PORT) --dev

.PHONY: dev-backend
dev-backend: ## Run only Go backend
	go run ./cmd/infineon/ serve --port $(PORT) --dev

.PHONY: dev-frontend
dev-frontend: ## Run only React frontend
	cd frontend && npm run dev

# ============================================================
# BUILD
# ============================================================

.PHONY: build
build: build-frontend build-backend ## Build everything

.PHONY: build-backend
build-backend: ## Build Go binary
	@echo "Building Go binary..."
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 go build $(GO_FLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) ./cmd/infineon/
	@echo "→ $(BUILD_DIR)/$(BINARY_NAME) built"

.PHONY: build-frontend
build-frontend: ## Build React frontend
	@echo "Building React frontend..."
	cd frontend && npm run build
	@echo "→ frontend/dist built"

.PHONY: build-docker
build-docker: ## Build Docker image
	docker build -t infineon/enterprise:latest .
	docker build -t infineon/enterprise:$(shell git describe --tags --always) .

# ============================================================
# DATABASE
# ============================================================

.PHONY: db-create
db-create: ## Create development database
	sudo -u postgres psql -c "CREATE USER $(DB_USER) WITH PASSWORD '$(DB_PASS)';" 2>/dev/null || true
	sudo -u postgres psql -c "CREATE DATABASE $(DB_NAME) OWNER $(DB_USER);" 2>/dev/null || true
	sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $(DB_NAME) TO $(DB_USER);" 2>/dev/null || true
	@echo "→ Database $(DB_NAME) ready"

.PHONY: db-drop
db-drop: ## Drop development database (DESTRUCTIVE)
	sudo -u postgres psql -c "DROP DATABASE IF EXISTS $(DB_NAME);"
	@echo "→ Database $(DB_NAME) dropped"

.PHONY: db-reset
db-reset: db-drop db-create migrate seed ## Reset database completely
	@echo "→ Database reset complete"

.PHONY: migrate
migrate: ## Run database migrations
	@echo "Running migrations..."
	@for f in migrations/*.up.sql; do \
		echo "  → $$f"; \
		sudo -u postgres psql -d $(DB_NAME) -f "$$f" 2>/dev/null; \
	done
	@echo "→ Migrations complete"

.PHONY: migrate-down
migrate-down: ## Rollback last migration (DESTRUCTIVE)
	@echo "⚠️  This will drop tables! Press Ctrl+C to cancel."
	@sleep 3
	@for f in migrations/*.down.sql; do \
		echo "  → $$f"; \
		sudo -u postgres psql -d $(DB_NAME) -f "$$f" 2>/dev/null; \
	done

.PHONY: seed
seed: ## Seed demo data
	@echo "Seeding demo data..."
	@for f in seeds/*.sql; do \
		echo "  → $$f"; \
		sudo -u postgres psql -d $(DB_NAME) -f "$$f" 2>/dev/null; \
	done
	@echo "→ Demo data seeded"

# ============================================================
# TEST
# ============================================================

.PHONY: test
test: ## Run all tests
	go test ./... -v -count=1

.PHONY: test-unit
test-unit: ## Run unit tests only
	go test ./internal/... -v -count=1 -run Unit

.PHONY: test-integration
test-integration: ## Run integration tests (requires database)
	go test ./... -v -count=1 -run Integration -tags=integration

.PHONY: test-frontend
test-frontend: ## Run frontend tests
	cd frontend && npm test

.PHONY: lint
lint: ## Run linting
	golangci-lint run ./... 2>/dev/null || go vet ./...
	cd frontend && npx eslint src/ --ext .ts,.tsx

.PHONY: fmt
fmt: ## Format code
	gofmt -s -w .
	cd frontend && npx prettier --write "src/**/*.{ts,tsx,css}"

.PHONY: typecheck
typecheck: ## TypeScript type checking
	cd frontend && npx tsc --noEmit

# ============================================================
# DOCKER
# ============================================================

.PHONY: docker-up
docker-up: ## Start all services with Docker
	cd infrastructure && docker compose up -d
	@echo "→ INFINEON running at http://localhost:$(PORT)"

.PHONY: docker-down
docker-down: ## Stop Docker services
	cd infrastructure && docker compose down

.PHONY: docker-logs
docker-logs: ## View Docker logs
	cd infrastructure && docker compose logs -f

.PHONY: docker-reset
docker-reset: ## Reset Docker (delete volumes)
	cd infrastructure && docker compose down -v
	@echo "→ Docker reset complete"

# ============================================================
# INSTALL / DEPLOY
# ============================================================

.PHONY: install
install: build ## Install binary to /usr/local/bin
	sudo cp $(BUILD_DIR)/$(BINARY_NAME) /usr/local/bin/
	sudo chmod +x /usr/local/bin/$(BINARY_NAME)
	@echo "→ Installed to /usr/local/bin/$(BINARY_NAME)"

.PHONY: uninstall
uninstall: ## Remove binary
	sudo rm -f /usr/local/bin/$(BINARY_NAME)
	@echo "→ Removed /usr/local/bin/$(BINARY_NAME)"

.PHONY: systemd-install
systemd-install: ## Install systemd service
	sudo cp infrastructure/infineon.service /etc/systemd/system/
	sudo systemctl daemon-reload
	sudo systemctl enable infineon
	sudo systemctl start infineon
	@echo "→ Service installed and started"

.PHONY: usb-package
usb-package: build build-frontend ## Package for USB deployment
	@mkdir -p dist/infineon
	cp $(BUILD_DIR)/$(BINARY_NAME) dist/infineon/
	cp scripts/install.sh dist/infineon/
	cp -r migrations dist/infineon/
	cp -r seeds dist/infineon/
	cp .env.example dist/infineon/
	cp infrastructure/docker-compose.yml dist/infineon/
	cd dist && tar -czf infineon-usb-$(shell git describe --tags --always 2>/dev/null || echo "dev").tar.gz infineon/
	@echo "→ USB package: dist/infineon-usb-*.tar.gz"

# ============================================================
# HELP
# ============================================================

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
