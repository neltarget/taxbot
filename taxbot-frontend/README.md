# TaxBot Frontend — Ghana Revenue Authority

A production-ready React chat interface for **TaxBot**, the AI-powered Tax Assistant of the Ghana Revenue Authority (GRA).

---

## Local Development

### Prerequisites
- Node.js ≥ 18
- Yarn (`yarn --version` to verify)
- Python ≥ 3.12 (for the backend)

### Setup

```bash
git clone <repo-url>
cd taxbot-frontend
yarn install
cp .env.example .env
# Edit .env: set VITE_API_URL to your running Python backend (e.g. http://localhost:8000)
yarn dev
```

The app is available at **http://localhost:5173**.

### Backend Requirement

The Python backend must be running and accessible at `VITE_API_URL`.

```bash
# From the tax_bot root directory:
uv run uvicorn api:app --reload --port 8000
```

The backend must accept `POST /api/chat` and have CORS configured for:
- `http://localhost:5173` (Vite dev server)
- Your Vercel deployment domain (production)

### CORS Configuration

**FastAPI** (`api.py` already configured):
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-vercel-domain.vercel.app"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)
```

**Flask** (if migrating):
```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:5173",
    "https://your-vercel-domain.vercel.app"
]}})
```

---

## Available Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start dev server at http://localhost:5173 |
| `yarn build` | Production build → `/dist` |
| `yarn preview` | Preview production build locally |
| `yarn lint` | ESLint check |

---

## Deployment to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import repo
3. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `taxbot-frontend`
   - **Build Command**: `yarn build`
   - **Output Directory**: `dist`
   - **Install Command**: `yarn install`
4. Add environment variables in the Vercel dashboard:
   - `VITE_API_URL` = `https://your-python-backend.onrender.com` (or Railway, etc.)
   - `PYTHON_BACKEND_URL` = same value (used in `vercel.json` rewrite)
5. Click **Deploy**

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the Python backend API | `https://taxbot-api.onrender.com` |

> **Never commit `.env`** — only `.env.example` is tracked. `.env` is in `.gitignore`.

---

## Project Structure

```
src/
├── components/
│   ├── Header.jsx          # GRA branding + status badge + clear chat
│   ├── ChatWindow.jsx      # Scrollable message list, auto-scroll
│   ├── MessageBubble.jsx   # User / bot / error bubble variants
│   ├── TypingIndicator.jsx # Animated "TaxBot is thinking..." dots
│   ├── InputBar.jsx        # Auto-resize textarea + send button
│   └── WelcomeBanner.jsx   # Shown before first message, suggestion chips
├── hooks/
│   └── useChat.js          # All chat state + API communication
├── utils/
│   └── api.js              # Axios instance + sendChatMessage wrapper
├── App.jsx
├── main.jsx
└── index.css
```
