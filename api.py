"""
TaxBot API — FastAPI HTTP server for the Ghana Revenue Authority Tax Assistant.

Wraps the existing taxbot.py logic in a REST endpoint that the React
frontend consumes. All AI client logic lives in taxbot.py and is unchanged.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from openai import OpenAI
from pydantic import BaseModel, Field

from taxbot import SYSTEM_PROMPT, create_client, get_response, postprocess_response, retrieve_context

load_dotenv()

# ---------------------------------------------------------------------------
# Application lifespan — initialise the OpenAI/OpenRouter client once and
# reuse it across all requests rather than reconstructing it per call.
# ---------------------------------------------------------------------------

_client: OpenAI | None = None
_model: str | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _client, _model
    try:
        _client, _model = create_client()
    except ValueError as exc:
        # Surface configuration errors immediately on startup.
        raise RuntimeError(f"TaxBot API failed to initialise: {exc}") from exc
    yield
    _client = None
    _model = None


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="TaxBot API",
    description="Ghana Revenue Authority AI Tax Assistant — HTTP API",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the Vite dev server and any Vercel deployment to reach this API.
# In production, replace "*" with the exact Vercel domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:4173",   # Vite preview server
        "*",                       # Vercel / any deployed origin
    ],
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    """A single message in the conversation history."""

    role: Literal["user", "assistant"] = Field(
        ..., description="The role of the message author."
    )
    content: str = Field(..., min_length=1, description="Message text.")


class ChatRequest(BaseModel):
    """Payload sent by the frontend for each user turn."""

    message: str = Field(
        ..., min_length=1, max_length=500, description="The current user input."
    )
    history: list[ChatMessage] = Field(
        default_factory=list,
        description="Full conversation history (role + content only).",
    )


class ChatResponse(BaseModel):
    """Successful response returned to the frontend."""

    reply: str = Field(..., description="TaxBot's response text.")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Accept a user message and conversation history, call the AI model,
    and return TaxBot's reply.

    The system prompt is always prepended so the AI stays in character
    regardless of the history provided by the client.

    Raises:
        HTTPException 503: If the AI client is not initialised.
        HTTPException 502: If the upstream AI provider returns an error.
    """
    if _client is None or _model is None:
        raise HTTPException(
            status_code=503,
            detail="TaxBot is not ready yet. Please retry in a moment.",
        )

    # Build the messages list: system prompt first, then history, then the
    # current user message. The frontend sends history excluding the new
    # message so we append it here to keep the contract clean.
    messages: list[dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *[{"role": msg.role, "content": msg.content} for msg in request.history],
        {"role": "user", "content": request.message},
    ]

    # Retrieve relevant context from the RAG knowledge base
    rag_context = retrieve_context(request.message, n_results=3)

    try:
        reply = get_response(_client, _model, messages, rag_context=rag_context)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI provider error: {exc}",
        ) from exc

    return ChatResponse(reply=postprocess_response(reply))


@app.get("/health")
async def health() -> dict[str, str]:
    """Lightweight health check used by monitoring tools."""
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Static file serving — serve the built React frontend in production.
# ---------------------------------------------------------------------------

FRONTEND_DIR = Path(__file__).parent / "taxbot-frontend" / "dist"

if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Catch-all: serve index.html for all non-API routes (SPA fallback)."""
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIR / "index.html")
