# Listing Lift — Go Live
_Maintained by Claude. Reflects current project state._

## Status
Local

## What It Is
AI virtual staging SaaS for real estate agents. Agents upload empty room photos, choose a style, and download photorealistic staged images. Subscription-based ($49–$149/month).

## Active Services
_None yet — all mock. Update when provisioned._

| Service | Used for | Env var | Status |
|---|---|---|---|
| Stripe | Subscription billing + checkout | `VITE_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` | Pending |
| AI image generation | Actual room staging (OpenAI, Replicate, etc.) | `VITE_AI_API_KEY` or server-side | Pending |
| Auth provider | User login (Firebase Auth or Auth0 recommended) | `VITE_AUTH_*` | Pending |
| File storage | Storing original + staged images | TBD | Pending |

## Hosting
- Platform: Vercel (personal account)
- URL: not yet deployed
- GitHub repo: not yet created

## Database
- Needs a database: Yes
- What gets stored: user accounts, staging jobs (original URL, staged URL, room type, style, status), subscription records
- Access pattern: Only logged-in users can read/write their own data

## Login / Authentication
- Needs login: Yes
- How: Email + password or Google (Firebase Auth recommended for solo Vercel deployment)

## Stripe Integration Notes
- Subscription plans: Starter ($49/mo, 100 gen), Agent ($99/mo, 300 gen), Pro ($149/mo, 750 gen)
- Use Stripe Checkout for payment flow (already stubbed in Pricing.jsx)
- Use Stripe Webhooks to update subscription status after payment
- Customer portal for plan changes / cancellations

## AI Image Generation Notes
- The mock currently resolves with sample Unsplash images after a delay
- Real implementation: call AI API in `simulateStaging()` inside `src/api/base44Client.js`
- The `stageImage` backend function in `base44/functions/stageImage/entry.ts` has the original prompt logic
- Recommended: Replicate (Stable Diffusion) or OpenAI DALL-E 3 for inpainting

## Notes
- Personal project — owner manages all credentials and billing
- No team access needed at launch
