.PHONY: help setup dev-backend dev-frontend seed run-analysis test lint docker-up docker-down

PYTHON ?= python
NPM ?= npm

help:
	@echo "EV Gap Analyser — Make commands:"
	@echo "  make setup         - Install backend and frontend dependencies"
	@echo "  make seed          - Seed database with Vizag pilot data"
	@echo "  make run-analysis  - Execute master analysis pipeline"
	@echo "  make dev-backend   - Start FastAPI server on port 8000"
	@echo "  make dev-frontend  - Start Next.js development server on port 3000"
	@echo "  make test          - Run pytest test suite"
	@echo "  make docker-up     - Start all services with Docker Compose"
	@echo "  make docker-down   - Stop Docker Compose services"

setup:
	$(PYTHON) -m pip install -r backend/requirements.txt
	cd frontend && $(NPM) install

seed:
	$(PYTHON) -m scripts.database.seed

run-analysis:
	$(PYTHON) -m scripts.pipelines.run_analysis

dev-backend:
	$(PYTHON) -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

dev-frontend:
	cd frontend && $(NPM) run dev

test:
	$(PYTHON) -m pytest backend/tests -v

docker-up:
	docker compose up -d

docker-down:
	docker compose down
