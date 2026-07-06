# Polaris dev tasks. Run `just` for the menu.

set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

default:
    @just --list

# --- Stack ---
up:
    docker-compose up -d --build

down:
    docker-compose down

logs:
    docker-compose logs -f

ps:
    docker-compose ps

restart svc="":
    docker-compose restart {{svc}}

# --- Backend ---
be-shell:
    docker-compose exec api /bin/bash

be-install:
    cd backend && python -m pip install -r requirements.txt

be-test:
    cd backend && pytest

be-lint:
    cd backend && ruff check app tests

be-fmt:
    cd backend && ruff format app tests

be-type:
    cd backend && mypy app

be-check: be-fmt be-lint be-type be-test

# --- Frontend ---
fe-install:
    cd frontend && npm install

fe-dev:
    cd frontend && npm run dev

fe-lint:
    cd frontend && npm run lint

fe-type:
    cd frontend && npm run type-check

fe-build:
    cd frontend && npm run build

fe-check: fe-lint fe-type fe-build

# --- Cross-stack ---
gen-api:
    cd backend && python -m scripts.dump_openapi openapi.json
    cd frontend && npm run gen-api

eval:
    python -m evals.runners.run_eval

check: be-check fe-check
    @echo "All checks passed."
