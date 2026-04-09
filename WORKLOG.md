# Listing Lift — Worklog

## Current Tasks
- [ ] Phase 1: Full local rebuild — decouple from Base44, mock staging flow, fix all routes
- [ ] Improve Landing page — social proof, FAQ, stronger hero
- [ ] Add mobile nav to dashboard
- [ ] Make JobCard clickable → job detail page with before/after view
- [ ] Phase 2: Wire up real auth + Stripe + AI image generation

## Decisions
2026-04-09 | Personal project — Vercel for hosting, personal Stripe account for billing
2026-04-09 | Keeping React + Vite + Tailwind stack as-is, stripping Base44 SDK
2026-04-09 | Mock client is a drop-in replacement at src/api/base44Client.js so pages don't change
2026-04-09 | Auth is always "logged in" for local dev — no login flow until go-live
2026-04-09 | NewStaging.jsx is dead code (Dashboard handles that flow) — leave it, don't route it
2026-04-09 | AppShell.jsx used only by JobDetail/NewStaging — converting JobDetail to use AppNav instead

## Ideas / Parking Lot
- Watermark toggle on downloaded images (for demos/previews)
- Multiple staged variations per photo (pick your favorite)
- Email delivery of staged images
- Team/agency plan with multiple seats
- White-label option for brokerages

## Session Log
2026-04-09 | Initial project setup. Read full codebase. Planned rebuild strategy.
             Decoupling from Base44, building mock service layer, fixing routing,
             improving landing, adding mobile nav, making job cards clickable.
