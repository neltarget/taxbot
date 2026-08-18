# AGENTS.md

## What This Repo Is

GRA TaxBot — an AI tax assistant for Ghana's Revenue Authority. Python FastAPI backend with Groq LLM + ChromaDB RAG, React (Vite + Tailwind) frontend. Single service on Render or split across Render + Vercel.

## Architecture

- **`taxbot.py`** — Core module. System prompt, Groq client creation, RAG context retrieval, response post-processing. Everything else imports from here.
- **`api.py`** — FastAPI app. Single `POST /api/chat` endpoint. Serves built frontend from `taxbot-frontend/dist/` in production.
- **`main.py`** — CLI REPL for direct interaction (not used in production).
- **RAG pipeline** (run in order): `data_cleaning.py` → `text_chunking.py` → `generate_embeddings.py` → `chromadb_setup.py`
- **`taxbot-frontend/`** — React SPA. Vite, Tailwind CSS, Axios, React 19. Uses **yarn** exclusively.

## Running The Backend

```bash
# From repo root, with .env configured (GROQ_API_KEY required)
uv sync --no-dev
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

No test suite. No linter or typechecker configured for Python.

## Running The Frontend

```bash
cd taxbot-frontend
yarn install
yarn dev        # http://localhost:5173
yarn lint       # ESLint
yarn build      # Production build → dist/
```

Frontend expects `VITE_API_URL` in `.env` (defaults to `http://localhost:8000`). For local dev, set it. For Render single-service deployment, leave empty.

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `GROQ_API_KEY` | Backend `.env` | Required. Groq API key for LLM |
| `GROQ_MODEL` | Backend `.env` | Optional. Default: `openai/gpt-oss-120b` |
| `GROQ_BASE_URL` | Backend `.env` | Optional. Default: `https://api.groq.com/openai/v1` |
| `ALLOWED_ORIGINS` | Backend `.env` | Optional. Comma-separated CORS origins for production |
| `VITE_API_URL` | Frontend `.env` | API base URL. Leave empty on Render for same-origin |

## Deployment (Render)

`render.yaml` defines a single web service. Build step installs `uv`, syncs deps, builds frontend with `npm install && npm run build` (note: Render uses npm, not yarn, for the build). Start command: `uvicorn api:app`.

## Key Gotchas

- The Groq client uses the **OpenAI Python SDK** pointed at Groq's base URL — it is not OpenAI.
- ChromaDB is lazy-loaded in `taxbot.py`. If `chromadb` isn't installed or the DB is empty, it degrades gracefully to no-RAG mode.
- `retrieve_context` returns different shapes in `main.py` vs `api.py` — main gets a string, api gets a tuple of (string, sources). Check the call site.
- The frontend Prompt spec in `frontend_prompt.md` says "no markdown rendering" but the current system prompt in `taxbot.py` does allow bold and numbered lists. The two prompts are **not aligned** — `taxbot.py` is the source of truth for live behavior.
- No Python tests, no CI pipeline, no pre-commit hooks.
- `AGENT.md` in root is a generic engineering style guide, not specific to this codebase.
