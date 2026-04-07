.PHONY: help install dev build test lint format migrate seed reset docker-up docker-down clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run start:dev

build: ## Build for production
	npm run build

test: ## Run all tests
	npm run test

test-unit: ## Run unit tests
	npm run test:unit

test-integration: ## Run integration tests
	npm run test:integration

test-cov: ## Run tests with coverage
	npm run test:cov

lint: ## Run linter
	npm run lint

format: ## Format code
	npm run format

typecheck: ## Run TypeScript type check
	npm run typecheck

migrate: ## Run Prisma migrations (dev)
	npx prisma migrate dev

migrate-prod: ## Run Prisma migrations (production)
	npx prisma migrate deploy

seed: ## Seed the database
	npx prisma db seed

reset: ## Reset database (WARNING: destroys all data)
	npx prisma migrate reset

generate: ## Generate Prisma client
	npx prisma generate

studio: ## Open Prisma Studio
	npx prisma studio

docker-up: ## Start Docker services
	docker-compose up -d

docker-down: ## Stop Docker services
	docker-compose down

docker-logs: ## Show Docker logs
	docker-compose logs -f

clean: ## Clean build artifacts
	rm -rf dist/ coverage/ logs/ node_modules/.cache

setup: docker-up install generate migrate seed ## Full setup for first run
	@echo "\033[32mSetup complete! Run 'make dev' to start the server.\033[0m"
