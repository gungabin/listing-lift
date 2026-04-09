# Listing Lift

AI-powered virtual home staging for real estate agents. Upload photos of empty or cluttered rooms, choose a decor style, and get photorealistic staged images in minutes — at a fraction of traditional staging costs.

## Tech Stack

- React + Vite + Tailwind CSS
- shadcn/ui (Radix UI)
- react-router-dom v6
- framer-motion
- Fonts: Cormorant Garamond + Inter

## Local Development

```bash
npm install
npm run dev
```

No environment variables needed to run locally. The app uses a mock backend stored in `localStorage`.

## Project Structure

```
src/
  api/            # Mock backend client — swap internals here when going live
  components/     # Shared UI (layout, staging workflow, shadcn/ui)
  pages/          # Route-level pages (Landing, Dashboard, Pricing, etc.)
  lib/            # Auth context, utilities
```

## Routes

| Path | Page |
|---|---|
| `/` | Landing |
| `/pricing` | Pricing |
| `/dashboard` | Staging workflow |
| `/history` | Past jobs |
| `/account` | Subscription + profile |
| `/jobs/:id` | Job detail with before/after |
| `/terms` | Terms of service |

## Roadmap

- [ ] Real auth (Firebase Auth or Auth0)
- [ ] AI image generation (OpenAI / Replicate)
- [ ] Stripe subscription billing
- [ ] Deploy to Vercel
