.PHONY: help setup dev seed run-demo test lint clean docker-up docker-down

PYTHON ?= .venv/Scripts/python.exe
NPM ?= npm

help:
	@echo "Available commands:"
	@echo "  make setup      - Setup Python virtual environment & install dependencies"
	@echo "  make seed       - Ingest raw and sample data for Vizag"
	@echo "  make run-demo   - Run complete gap analysis pipeline on Vizag"
	@echo "  make dev-api    - Start FastAPI backend"
	@echo "  make dev-web    - Start Next.js frontend"
	@echo "  make test       - Run backend pytest suite"
	@echo "  make lint       - Run ruff linter & type checks"
	@echo "  make docker-up  - Start services via docker-compose"
	@echo "  make docker-down- Stop docker services"

setup:
	python -m venv .venv
	$(PYTHON) -m pip install -r requirements.txt
	cd apps/web && $(NPM) install

seed:
	$(PYTHON) -m pipelines.ingest_chargers --city vizag
	$(PYTHON) -m pipelines.ingest_vahan --city vizag
	$(PYTHON) -m pipelines.ingest_population --city vizag

run-demo:
	$(PYTHON) -m pipelines.run --city vizag

dev-api:
	$(PYTHON) -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload

dev-web:
	cd apps/web && $(NPM) run dev

test:
	$(PYTHON) -m pytest apps/api/tests -v

lint:
	$(PYTHON) -m ruff check apps/api pipelines

docker-up:
	docker compose -f infra/docker-compose.yml up -d

docker-down:
	docker compose -f infra/docker-compose.yml down
