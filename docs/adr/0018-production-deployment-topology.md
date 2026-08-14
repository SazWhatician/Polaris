# ADR 0018: Production Deployment Topology & CI/CD Strategy

- **Status:** Accepted
- **Date:** 2026-08-14
- **Context:** To complete Phase 10 and deploy Polaris publicly as a portfolio-grade system, we must define the production deployment topology, build pipeline, and hosting providers.

## Decision

1. **Frontend:** Deploy Next.js 14 App Router to **Vercel** Hobby tier for zero-config Edge routing, Server Component streaming, and automated preview deployments.
2. **Backend API & Workers:** Deploy containerized FastAPI backend to **Render** Free Web Service / Worker tier. Use environment variables for secrets injection (`GROQ_API_KEY`, `GEMINI_API_KEY`, Firebase Service Account).
3. **Database & Storage:** Connect production build to **Firebase Auth + Firestore + Storage** (production project) and **Qdrant Cloud Free Tier** (1GB vector collection).
4. **CI/CD Pipeline:** Automate via GitHub Actions (`.github/workflows/deploy.yml`): lint -> typecheck -> test -> build Docker image -> trigger deploy on `main`.

## Consequences

- Zero hosting cost for portfolio demonstration.
- Cold-starts on Render free web service (~30s after 15m inactivity) are documented as acceptable portfolio tradeoffs.
- Environment variables isolate production secrets from version control.
