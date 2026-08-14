# Design System: TaxBot — Ink & Brass

## 1. Visual Theme & Atmosphere

A restrained, dark-mode-only interface with confident asymmetric layouts and fluid spring-physics motion. The atmosphere is authoritative yet approachable — like a well-lit revenue office at dusk. Deep blue-black canvas with warm brass accents evokes financial trust without corporate sterility. Glassmorphism panels float over layered radial gradients with a fine grain texture overlay. Density is balanced (5/10): enough breathing room for chat readability, dense enough for information-rich tax content.

- **Density:** Daily App Balanced (5/10)
- **Variance:** Offset Asymmetric (7/10)
- **Motion:** Fluid CSS (6/10)

## 2. Color Palette & Roles

- **Obsidian Base** (#12171F / `220 25% 9%`) — Primary page background. Deep blue-black, never pure black.
- **Slate Surface** (#1A2030 / `220 20% 13%`) — Card and glass panel fill. Warm undertone, not cold gray.
- **Slate Raised** (#212A3A / `220 18% 16%`) — Input fields, secondary surfaces, raised elements.
- **Slate Hover** (#283244 / `220 16% 19%`) — Hover states, active history items, interactive feedback.
- **Ink Text** (#E2E8F0 / `210 40% 96%`) — Primary text. High contrast on dark surfaces.
- **Muted Steel** (#94A3B8 / `215 20% 65%`) — Secondary text, descriptions, metadata, timestamps.
- **Whisper Border** (#2D3A4D / `220 15% 20%`) — Structural borders, 1px dividers, card outlines.
- **Brass Accent** (#C4922A / `38 65% 55%`) — Single accent for CTAs, focus rings, active states, links. Saturation 65% (under 80% limit).
- **Brass Glow** (`rgba(196,146,42,0.15)`) — Subtle accent backgrounds, hover tints, focus ring overlays.
- **Brass Dim** (#7A6230 / `38 30% 35%`) — Muted accent for disabled states, secondary accent needs.
- **Error Red** (#DC2626 / `0 65% 50%`) — Destructive actions, error states.
- **Error Surface** (#3D1111 / `0 50% 15%`) — Error bubble background.
- **Error Text** (#F87171 / `0 84% 80%`) — Error message text.

### Gradient Palette (Background Layers)
- **Gradient Deep** (`220 25% 9%`) — Base gradient stop.
- **Gradient Mid** (`220 18% 14%`) — Mid-layer gradient.
- **Gradient Surface** (`220 15% 17%`) — Surface gradient.
- **Gradient Warm** (`38 40% 18%`) — Brass-tinted warm glow in background layers.
- **Gradient Ember** (`30 35% 14%`) — Deep warm secondary glow.

## 3. Typography Rules

- **Display:** Geist — Track-tight, controlled scale. Hierarchy through weight (500/600/700) and color opacity, not just size. Display sizes: `clamp(1.125rem, 2vw, 1.25rem)`.
- **Body:** Geist — Relaxed leading (1.5-1.65), max 65ch width, neutral muted-steel secondary color. Base size: `14px` minimum, body text `13px` in chat bubbles.
- **Mono:** Geist Mono — For timestamps, TIN numbers, tax codes, code blocks, dense numerical data. Used in tabular-nums contexts.
- **Banned:** Inter (generic, overused). Generic serif fonts (Times New Roman, Georgia, Garamond, Palatino). System fonts for primary rendering.
- **Text Scale:**
  - Headings: `clamp(1.125rem, 2vw, 1.25rem)` — weight 600-700
  - Body: `13px` (chat), `14px` (general) — weight 400
  - Caption/Metadata: `11px` — weight 400
  - Micro: `10px` — weight 400, for timestamps, badges
  - Code/Mono: `12px` — weight 400

## 4. Component Stylings

- **Buttons (Ghost):** Transparent fill, no border. Text uses `white/55` default, `white/80` on hover. Background `white/[0.04]` on hover. No outer glow. Tactile -1px translateY on active.
- **Buttons (Primary/Send):** Solid brass gradient fill. Brass accent (#C4922A) base. No neon outer glow. Warm shadow `0 2px 12px rgba(196,146,42,0.2)`. Disabled: `opacity-25` with neutral background.
- **Buttons (Outline/Chips):** `bg-white/[0.04]`, `border-white/[0.08]`, `text-white/65`. Hover: `bg-white/[0.07]`, `text-white/80`, `border-white/[0.12]`. Pill-shaped (`rounded-full`).
- **Cards/Bubbles:** `rounded-2xl` (16px radius). Generously padded (`px-4 py-2.5`). Text `13px` with `leading-relaxed`. Max-width `80%` mobile, `70%` desktop. User bubbles: `bg-white/[0.07]`. Bot bubbles: `bg-white/[0.03]`. Error bubbles: `bg-red-500/[0.08]`.
- **Inputs:** Label above, error below. Focus ring in brass accent. No floating labels. `bg-white/[0.04]`, `border-white/[0.06]`. Error state: `border-red-400/40`.
- **Avatar (Bot):** 24x24px (`w-6 h-6`), `rounded-md`, brass gradient fill `bg-gradient-to-br from-amber-500/60 to-yellow-600/60`. Contains "GRA" text at 9px.
- **Logo Mark:** 28x28px (`w-7 h-7`), `rounded-md`, brass gradient `bg-gradient-to-br from-amber-500/80 to-yellow-600/80`. Warm glow shadow.
- **Status Dot:** Online: brass solid. Thinking: amber with pulse animation. 1.5x1.5px circle.
- **Typing Dots:** Three bouncing dots, brass accent color `amber-500/50`. Staggered 150ms delay.
- **Scrollbar:** 6px width, transparent track, `white/10` thumb (hover: `white/20`). Rounded.
- **Grain Overlay:** Fixed SVG fractal noise at 3.5% opacity, 200x200px tile, pointer-events-none.

## 5. Layout Principles

- **Architecture:** Single-page chat application. No routing. Glass-panel main container centered on desktop, full-width on mobile.
- **Grid:** CSS Grid for main layout (sidebar + chat column). Flexbox for internal component layouts only.
- **Containment:** Max-width `1400px` centered via Tailwind container. Chat input constrained to `max-w-2xl`.
- **Spacing:** `px-4`/`py-3` for containers. `gap-2` to `gap-3` for element spacing. `mb-1.5` to `mb-8` for section separation.
- **Full-height:** Use `min-h-[100dvh]` — never `h-screen` (iOS Safari fix).
- **No overlapping:** Every element occupies its own clear spatial zone. No absolute-positioned content stacking.
- **Mobile-First:** All multi-column layouts collapse to single column below 768px. No horizontal scroll.

## 6. Motion & Interaction

- **Spring Physics:** Default `stiffness: 100, damping: 20` for interactive elements. No linear easing.
- **Message Entry:** `bubble-in` — slide up 8px + fade in, 0.3s ease-out, forwards fill.
- **Fade In:** `fade-in` — opacity 0 to 1, 0.3s ease-out, forwards fill.
- **Typing Dots:** `dot-bounce` — translateY -6px bounce, 1.4s infinite, staggered 150ms per dot.
- **Grain Drift:** `grain-drift` — subtle 5% translate drift, 8s infinite ease-in-out.
- **Loading Pulse:** `animate-pulse` on status dot.
- **Staggered Orchestration:** Never mount lists instantly — use cascade delays for waterfall reveals.
- **Performance:** Animate exclusively via `transform` and `opacity`. Never animate `top`, `left`, `width`, `height`.
- **Reduced Motion:** Respect `prefers-reduced-motion: reduce` — disable all animations.

## 7. Anti-Patterns (BANNED)

- No emojis anywhere in the UI
- No `Inter` font — use Geist exclusively
- No generic serif fonts (Times New Roman, Georgia, Garamond, Palatino)
- No pure black (`#000000`) — use Obsidian Base (#12171F) or darker shades
- No neon or outer glow shadows — warm subtle shadows only
- No oversaturated accents — brass at 65% saturation max
- No purple/blue neon aesthetic — no purple button glows, no neon gradients
- No dual-accent gradients (cyan-to-emerald pattern eliminated)
- No excessive gradient text on large headers
- No custom mouse cursors
- No overlapping elements — clean spatial separation always
- No 3-column equal card layouts — use asymmetric or 2-column patterns
- No generic placeholder names ("John Doe", "Acme", "Nexus")
- No fake round numbers (`99.99%`, `50%`)
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen")
- No filler UI text: "Scroll to explore", "Swipe down", scroll arrows, bouncing chevrons
- No broken Unsplash links — use `picsum.photos` or SVG avatars
- No centered Hero sections for high-variance contexts
- No inline hardcoded colors when CSS custom properties exist — always use tokens
