# TaxBot 🇬🇭

**A RAG chatbot for Ghana's tax system — built to augment the GRA, not replace it.**

Ask about income tax, VAT, TIN, filing or penalties in plain language and get answers grounded in tax reference documents — with the sources shown, and a polite "I can't verify that" when the retrieval store is empty.

🔗 **Live:** https://taxbot-1-m788.onrender.com/

## How it works (the RAG pipeline)

```
Tax reference docs
   ↓  data_cleaning.py        — normalize & clean source text
   ↓  text_chunking.py        — split into retrieval-sized chunks
   ↓  generate_embeddings.py  — embed chunks (Groq embeddings)
   ↓  chromadb_setup.py       — persist to ChromaDB (TaxBotVectorDB)

User question
   ↓  retrieve_context()      — top-3 chunks + source/category metadata
   ↓  grounded LLM call       — Groq (openai-compatible client)
   ↓  postprocess_response()  — format, citations, graceful fallback
Answer with sources
```

**Design choices that matter:**
- Retrieval failures **degrade gracefully** — no vector DB or empty collection → the bot returns a safe fallback instead of hallucinating statutes.
- Every retrieved chunk carries `source` + `category` metadata, which is surfaced to the user so answers are checkable.
- Serving is a **rate-limited FastAPI** app (`slowapi`) with CORS restricted to your deployed origins in production.

## Tech stack

| Layer | Choice |
|---|---|
| LLM | Groq (`openai/gpt-oss-120b`) via the OpenAI-compatible client |
| Vector store | ChromaDB |
| API | FastAPI + Pydantic + `slowapi` rate limiting |
| Frontend | React (see `taxbot-frontend/`) |
| Python | 3.12, managed with `uv` |
| Hosting | Render (`render.yaml`) |

## Repo layout

```
taxbot.py            # core brain: prompts, client, RAG retrieval, post-processing
api.py               # FastAPI server (what the React UI calls) + CLI mount
main.py              # terminal chat client
chromadb_setup.py    # TaxBotVectorDB — load/persist the Chroma collection
generate_embeddings.py
text_chunking.py
data_cleaning.py
taxbot-frontend/     # React chat UI
render.yaml          # production deploy spec
```

## Run it locally

```bash
git clone https://github.com/neltarget/taxbot && cd taxbot
cd taxbot-frontend   # build the UI once (served statically by the API)
npm install && npm run build
cd ..
uv venv && source .venv/bin/activate
uv sync
cp .env.example .env   # add your GROQ_API_KEY (console.groq.com)
uvicorn api:app --reload
```

Terminal play instead? `python main.py` with the same `.env`.

> **First run in RAG mode:** run the three pipeline scripts (`data_cleaning.py`,
> `text_chunking.py`, `generate_embeddings.py`) against your tax document set
> to populate ChromaDB — until then TaxBot runs in no-RAG fallback mode.

---

Built by **Nelson Ador** · [github.com/neltarget](https://github.com/neltarget)