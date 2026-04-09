# Listing Lift — Claude Context

## What It Is
AI-powered virtual home staging web app. Real estate agents upload photos of empty (or cluttered) rooms, choose a decor style, and receive photorealistic staged images instantly.

## Tech Stack
- React + Vite + Tailwind CSS (JSX, not TSX)
- shadcn/ui components (Radix UI under the hood)
- react-router-dom v6
- framer-motion (available, use it for key animations)
- Fonts: Cormorant Garamond (serif headings), Inter (sans body)
- Colors: #FAF8F5 (bg), #2C2C2C (dark), #8B6F5C (warm brown accent), #E0D9D3 (border)

## Architecture
All pages import from `src/api/base44Client.js` — this is a mock drop-in for the real backend.
The mock uses localStorage to persist jobs and subscription data.
When going live, swap the mock internals in `base44Client.js` without touching pages.

## Mock Behavior
- Auth: always logged in as demo user
- Staging: jobs resolve with realistic room images after 8–15 second delay
- Subscription: Agent plan, 300 limit, 47 used (adjustable in base44Client.js)
- Images: original photos stored as blob URLs (lost on refresh — expected for local dev)

## Key Pages & Routes
- `/` — Landing (public)
- `/pricing` — Pricing (public)
- `/terms` — Terms (public)
- `/dashboard` — Main staging workflow (upload → assign → configure → process)
- `/history` — All past staging jobs
- `/account` — Subscription + profile
- `/jobs/:id` — Job detail with before/after view

## Personal Project
This is NOT a Life Church project. Owner handles hosting and billing personally.
Target hosting: Vercel (free tier, auto-deploy from GitHub).
Target payment: Stripe (personal account — set up keys when ready to go live).
Target AI: TBD (OpenAI, Replicate, or similar — add real API call to stageImage function).

## When Going Live Checklist
1. Replace mock in `src/api/base44Client.js` with real backend calls
2. Add real auth (Firebase Auth or Auth0 recommended for solo dev)
3. Wire up Stripe Checkout for subscription creation in Pricing.jsx
4. Add real AI image generation (replace simulateStaging in base44Client.js)
5. Set up Vercel project, add env vars
