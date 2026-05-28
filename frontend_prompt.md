## PROJECT OVERVIEW
Build a production-ready frontend for TaxBot — an AI-powered Tax Assistant 
chatbot for the Ghana Revenue Authority (GRA). The chatbot logic already 
exists as a Python backend (FastAPI or Flask). This task covers the frontend 
interface and its seamless integration with the backend API.

The app should feel like a premium, government-grade product: minimal, 
elegant, and trustworthy. The chatbot is the sole hero feature — everything 
else exists to support it.

---

## TECH STACK
- Scaffolding: Vite (yarn create vite taxbot-frontend --template react)
- Framework: React.js (functional components + hooks only)
- Styling: Tailwind CSS (utility-first, no component libraries)
- HTTP Client: Axios (yarn add axios)
- Package Manager: Yarn — use exclusively throughout. Do NOT use npm 
  at any point. Commit yarn.lock. Never commit package-lock.json.
- Deployment Target: Vercel
- State Management: React useState / useReducer (no Redux, no Zustand)
- No third-party UI component libraries (no shadcn, MUI, Chakra, etc.)

---

## PROJECT STRUCTURE

taxbot-frontend/
├── public/
│   └── gra-logo.png                  # Placeholder for GRA official logo
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Header.jsx                # Top bar — GRA branding + status badge
│   │   ├── ChatWindow.jsx            # Scrollable message display area
│   │   ├── MessageBubble.jsx         # Individual message (user or bot)
│   │   ├── TypingIndicator.jsx       # Animated "TaxBot is thinking..."
│   │   ├── InputBar.jsx              # Auto-resize textarea + send button
│   │   └── WelcomeBanner.jsx         # Shown before first message
│   ├── hooks/
│   │   └── useChat.js                # All chat state logic + API calls
│   ├── utils/
│   │   └── api.js                    # Axios instance + /api/chat wrapper
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── vercel.json
├── tailwind.config.js
├── vite.config.js
├── package.json
└── README.md

---

## ENVIRONMENT VARIABLES

Create .env.example:
  VITE_API_URL=http://localhost:8000

Rules:
- All API base URLs must read from import.meta.env.VITE_API_URL
- Never hardcode any URL anywhere in the codebase
- Add .env to .gitignore — only .env.example is committed

---

## BACKEND INTEGRATION

### API Contract
The Python backend exposes a single endpoint:

  POST /api/chat
  Content-Type: application/json

  Request Body:
  {
    "message": "string",       ← current user input
    "history": [               ← full conversation so far
      { "role": "user",      "content": "string" },
      { "role": "assistant", "content": "string" }
    ]
  }

  Success Response (200):
  {
    "reply": "string"          ← TaxBot's response text
  }

  Error Response (4xx / 5xx):
  {
    "detail": "string"         ← error description (FastAPI default)
  }

### utils/api.js — Axios Instance
Configure a reusable Axios instance:

  import axios from 'axios';

  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 30000,                        // 30s timeout for AI responses
    headers: { 'Content-Type': 'application/json' }
  });

  export const sendChatMessage = async (message, history) => {
    const response = await apiClient.post('/api/chat', { message, history });
    return response.data.reply;
  };

  export default apiClient;

### CORS Note (include in README)
The Python backend MUST have CORS configured to allow the frontend origin.
For FastAPI:
  from fastapi.middleware.cors import CORSMiddleware
  app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-vercel-domain.vercel.app"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
  )
For Flask:
  from flask_cors import CORS
  CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173",
    "https://your-vercel-domain.vercel.app"]}})

---

## CHAT LOGIC — useChat.js Hook

This hook owns all chat state and API communication.

State:
  const [messages, setMessages]     = useState([])   
  // [{ id, role, content, timestamp }]
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState(null)

sendMessage(userInput):
  1. Trim input — reject empty strings silently
  2. Build userMessage object:
       { id: crypto.randomUUID(), role: 'user', content: userInput, 
         timestamp: new Date().toISOString() }
  3. Append userMessage to messages via functional setState
  4. Set isLoading = true, clear any previous error
  5. Build history array from current messages (role + content only, 
     no id/timestamp) — include the new user message
  6. Call sendChatMessage(userInput, history) from utils/api.js
  7. On success: build botMessage object and append to messages
  8. On error: append a fallback bot error message (see Error Handling)
  9. Set isLoading = false in a finally block

clearChat():
  - Reset messages to []
  - Reset error to null

Return: { messages, isLoading, error, sendMessage, clearChat }

### Error Handling Strategy
On any Axios error, append this bot message instead of crashing:

  {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: "⚠️ I'm having trouble connecting right now. Please try 
    again shortly or contact GRA directly at 0800-900-110 (toll-free) 
    or visit gra.gov.gh.",
    timestamp: new Date().toISOString(),
    isError: true
  }

Distinguish error types for better UX:
  - Network error (no response):   "Unable to reach the server. 
    Check your connection and try again."
  - Timeout (>30s):                "The request timed out. 
    TaxBot may be busy — please try again."
  - 4xx / 5xx server error:        Use response.data.detail if present, 
    else show the generic fallback above.

---

## DESIGN SYSTEM

### Color Palette
Use CSS custom properties in index.css and map to Tailwind in tailwind.config.js:

  :root {
    --color-primary:     #1B4332;   /* Deep GRA green */
    --color-accent:      #D4A017;   /* Gold */
    --color-bg:          #F9FAFB;   /* App background */
    --color-surface:     #FFFFFF;   /* Cards, header, input bar */
    --color-bot-bubble:  #F0FDF4;   /* Soft mint for bot messages */
    --color-user-bubble: #1B4332;   /* Deep green for user messages */
    --color-border:      #E5E7EB;
    --color-text-primary:#111827;
    --color-text-muted:  #6B7280;
    --color-error:       #FEF2F2;   /* Error bubble background */
    --color-error-text:  #991B1B;
  }

tailwind.config.js — extend theme:
  colors: {
    primary: 'var(--color-primary)',
    accent:  'var(--color-accent)',
    // ...map all tokens above
  }

### Typography
- Font: Inter — import from Google Fonts in index.html
- Set as default sans in tailwind.config.js:
    fontFamily: { sans: ['Inter', 'sans-serif'] }
- Heading: font-semibold tracking-tight
- Chat text: text-sm leading-relaxed
- Timestamps: text-xs text-[var(--color-text-muted)]

### Spacing & Shape
- Message bubbles: rounded-2xl px-4 py-3
- Send button: rounded-full
- Suggestion chips: rounded-full px-4 py-2 text-sm
- Chat window: max-w-2xl mx-auto
- Global background: bg-[var(--color-bg)]

---

## RESPONSIVE DESIGN — MOBILE FIRST

All components must be designed mobile-first and scale up gracefully.

### Breakpoints (Tailwind defaults)
- Mobile  (<640px):  Full-width chat, compact header, sm text
- Tablet  (≥768px):  Slightly inset layout, comfortable padding
- Desktop (≥1024px): max-w-2xl centered, breathing room on sides

### Layout Behaviour
- h-screen with flex flex-col — header + chat + input fill viewport exactly
- On mobile: no horizontal margins on chat window
- On desktop: mx-auto max-w-2xl with subtle side padding
- Input bar: always anchored to bottom, never overlaps keyboard on mobile
  (use padding-bottom: env(safe-area-inset-bottom) for iOS notch support)
- Chat window: overflow-y-auto flex-1 — grows to fill available space 
  between header and input bar at all screen sizes
- Avatar icons: hidden on screens < 400px (use hidden xs:flex) to 
  save horizontal space on very small devices

---

## COMPONENT SPECIFICATIONS

### App.jsx
- Single root component
- Calls useChat() hook and passes props down
- Layout: flex flex-col h-screen bg-[var(--color-bg)]
- Renders: <Header /> → <ChatWindow /> → <InputBar />
- ChatWindow receives messages, isLoading
- InputBar receives sendMessage, isLoading

---

### Header.jsx
- Fixed top bar: h-16 bg-white border-b border-[var(--color-border)]
- Left: GRA logo (32×32px) + text block:
    "TaxBot" (font-semibold text-primary) 
    "Ghana Revenue Authority" (text-xs text-muted)
- Right: status indicator:
    Green pulsing dot (animate-pulse) + "Online" in text-xs
    If isLoading: amber dot + "Responding..."
- Also include a subtle "Clear chat" icon button (trash icon, 
  top-right corner) that calls clearChat() with a confirmation 
  tooltip: "Start a new conversation"

Props: { isLoading, clearChat }

---

### WelcomeBanner.jsx
Shown only when messages.length === 0 and !isLoading.

Layout (centered in chat window):
  - GRA shield or flag emoji 🇬🇭 (large, 48px)
  - Heading: "Hello! I'm TaxBot" (text-xl font-semibold text-primary)
  - Subtext: "Your official Ghana Revenue Authority Tax Assistant. 
    Ask me anything about taxes in Ghana."
    (text-sm text-muted max-w-xs text-center)
  - Divider line: "Try asking..."
  - Three suggestion chips (clickable):
      • "How do I register for a TIN?"
      • "What is the VAT rate in Ghana?"
      • "When is the tax filing deadline?"

Chip behaviour:
  - onClick: calls sendMessage(chipText) directly
  - Styled: border border-primary text-primary rounded-full px-4 py-2 
    text-sm hover:bg-green-50 transition-colors cursor-pointer
  - Disabled while isLoading

Props: { onSuggestionClick, isLoading }

---

### ChatWindow.jsx
- flex-1 overflow-y-auto px-4 py-6
- useRef + useEffect: auto-scroll to bottom whenever messages 
  array changes or isLoading changes
  (scrollIntoView({ behavior: 'smooth' }) on a bottom anchor div)
- Renders WelcomeBanner when messages = []
- Renders a centered "Today" date chip as the first item when 
  messages.length > 0
- Maps messages → <MessageBubble key={msg.id} {...msg} />
- Renders <TypingIndicator /> when isLoading = true
- Invisible anchor div at bottom: ref={bottomRef}

Props: { messages, isLoading, onSuggestionClick }

---

### MessageBubble.jsx
Props: { role, content, timestamp, isError }

User bubble (role === 'user'):
  - Aligned right: flex justify-end
  - Background: bg-primary text-white
  - No avatar shown on the right to keep it clean

Bot bubble (role === 'assistant'):
  - Aligned left: flex justify-start items-end gap-2
  - Avatar: small circle (28px), gold background, white "GRA" 
    initials in text-[10px] font-bold
  - Background: bg-[var(--color-bot-bubble)] text-[var(--color-text-primary)]

Error bubble (isError === true):
  - Bot alignment (left)
  - Background: bg-[var(--color-error)] text-[var(--color-error-text)]
  - Border: border border-red-200

All bubbles:
  - rounded-2xl px-4 py-3 max-w-[80%] md:max-w-[70%]
  - text-sm leading-relaxed
  - Render line breaks: split content on \n, render with <br /> 
    between segments
  - Timestamp below bubble: text-xs text-muted mt-1
    Format: "10:45 AM" using toLocaleTimeString()
  - Mount animation: opacity-0 → opacity-100 + translateY(8px) → 0
    Use Tailwind's transition or a simple CSS class toggled on mount

---

### TypingIndicator.jsx
- Rendered as a bot-aligned bubble (same left layout as bot MessageBubble)
- Content: three dots in a row, each animate-bounce with staggered delay:
    dot 1: animation-delay: 0ms
    dot 2: animation-delay: 150ms
    dot 3: animation-delay: 300ms
- Dot style: w-2 h-2 rounded-full bg-primary inline-block mx-0.5
- Below dots: "TaxBot is thinking..." in text-xs text-muted italic
- Fade in smoothly when isLoading becomes true

---

### InputBar.jsx
Props: { onSend, isLoading }

Layout:
  - Fixed bottom bar: bg-white border-t border-[var(--color-border)]
  - Inner wrapper: max-w-2xl mx-auto px-4 py-3 flex items-end gap-3
  - Padding bottom: pb-[calc(0.75rem+env(safe-area-inset-bottom))]
    (handles iOS home bar overlap)

Textarea:
  - Auto-resizing: starts at 1 row, grows to max 4 rows
    Implement with onInput: 
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
  - Resets height after send
  - Placeholder: "Ask me anything about taxes in Ghana..."
  - Styling: flex-1 resize-none rounded-2xl border border-[var(--color-border)]
    px-4 py-2.5 text-sm focus:outline-none focus:ring-2 
    focus:ring-primary transition-all
  - Disabled + opacity-60 when isLoading

Send Button:
  - Circular: w-10 h-10 rounded-full bg-primary text-white 
    flex items-center justify-center
  - Icon: right-pointing arrow (SVG or inline)
  - Hover: hover:bg-green-900 transition-colors
  - Disabled + opacity-50 cursor-not-allowed when isLoading 
    OR textarea is empty
  - Loading state: replace arrow icon with a small spinner 
    (animate-spin, white border circle)

Keyboard behaviour:
  - Enter alone → call onSend(value), clear textarea
  - Shift+Enter → insert newline (default textarea behaviour)
  - Prevent send if value.trim() === '' or isLoading === true

Character counter:
  - Appears only when user has typed ≥ 1 character
  - Positioned inside textarea, bottom-right corner
  - Text: "42 / 500" in text-[10px] text-muted
  - Turns red when > 480 characters
  - Hard block send at 500 characters

---

## VERCEL CONFIGURATION

vercel.json:
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "REPLACE_WITH_PYTHON_BACKEND_URL/api/:path*"
    }
  ]
}

Note: Replace REPLACE_WITH_PYTHON_BACKEND_URL with the live 
Python backend URL in Vercel's environment settings — never 
hardcode it in vercel.json directly. Alternatively, use 
Vercel's environment variable:

{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "@PYTHON_BACKEND_URL/api/:path*"
    }
  ]
}

---

## ACCESSIBILITY
- role="log" aria-live="polite" aria-label="Chat messages" 
  on ChatWindow's scrollable div
- aria-label="Send message" on the send button
- aria-label="Type your tax question" on the textarea
- All suggestion chips: role="button" tabIndex={0} 
  with onKeyDown Enter/Space handler
- Focus ring on all interactive elements: 
  focus:ring-2 focus:ring-primary focus:ring-offset-2
- Color contrast must meet WCAG AA for all text/background pairs
- Smooth scrolling must respect prefers-reduced-motion:
  Use behavior: 'smooth' only if 
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

---

## PERFORMANCE
- Lazy load nothing — the app is a single page, keep it simple
- Memoize MessageBubble with React.memo to avoid re-rendering 
  the entire list on each new message
- Debounce textarea height recalculation (optional, low priority)
- Keep bundle lean — no unnecessary dependencies

---

## .gitignore
node_modules/
dist/
.env
.DS_Store
*.local

---

## README.md

# TaxBot Frontend — Ghana Revenue Authority

## Local Development

### Prerequisites
- Node.js ≥ 18
- Yarn (yarn --version to verify)

### Setup
  git clone <repo-url>
  cd taxbot-frontend
  yarn install
  cp .env.example .env
  # Edit .env: set VITE_API_URL to your running Python backend
  yarn dev

### Available Scripts
  yarn dev          # Start dev server (http://localhost:5173)
  yarn build        # Production build → /dist
  yarn preview      # Preview production build locally
  yarn lint         # ESLint check

## Backend Requirement
The Python backend must be running and accessible at VITE_API_URL.
It must accept POST /api/chat and have CORS configured 
for http://localhost:5173 (dev) and your Vercel domain (prod).

## Deployment to Vercel
1. Push this repo to GitHub
2. Go to vercel.com → Add New Project → Import repo
3. Configure project settings:
   - Framework Preset:  Vite
   - Build Command:     yarn build
   - Output Directory:  dist
   - Install Command:   yarn install
4. Add environment variables:
   - VITE_API_URL = https://your-python-backend.onrender.com (or Railway, etc.)
5. Click Deploy

## Environment Variables
| Variable       | Description                          | Example                          |
|----------------|--------------------------------------|----------------------------------|
| VITE_API_URL   | Base URL of the Python backend API   | https://taxbot-api.onrender.com  |

---

## FINAL CHECKLIST (Antigravity must verify before finishing)
- [ ] Project scaffolded with: yarn create vite taxbot-frontend --template react
- [ ] yarn.lock committed, no package-lock.json present
- [ ] App starts cleanly with: yarn dev (no console errors)
- [ ] yarn build completes without errors
- [ ] All API calls use VITE_API_URL — zero hardcoded URLs
- [ ] Axios instance configured with 30s timeout in utils/api.js
- [ ] Full conversation history sent with every API request
- [ ] WelcomeBanner visible on load, hidden after first message
- [ ] Suggestion chips pre-fill AND send message on click
- [ ] Auto-scroll to bottom on every new message and on typing indicator
- [ ] Typing indicator appears while isLoading = true, disappears after
- [ ] Enter sends message; Shift+Enter creates new line
- [ ] Textarea auto-resizes up to 4 rows then scrolls internally
- [ ] Send button disabled when input is empty or isLoading is true
- [ ] Send button shows spinner when isLoading is true
- [ ] Network errors show a graceful fallback bot message
- [ ] Timeout errors show a distinct message from server errors
- [ ] Clear chat button resets conversation to WelcomeBanner state
- [ ] App is fully usable on 375px (iPhone SE) — no overflow or clipping
- [ ] App is polished on 1440px desktop — centered, well-spaced
- [ ] Input bar does not overlap iOS home indicator
- [ ] No accessibility violations — aria labels on all interactive elements
- [ ] React.memo applied to MessageBubble
- [ ] vercel.json present with /api/* rewrite rule
- [ ] .env.example committed, .env in .gitignore
- [ ] README includes local setup + Vercel deployment steps