# 14. Firebase Authentication and Demo Fallback Architecture

Date: 2026-08-01

## Status

Accepted

## Context

Polaris requires user identity isolation for all backend entities (documents, Qdrant payload filters, learning gap reports, revision plans). To allow seamless developer onboarding and local testing without forcing developers to configure live Firebase credentials on day 1, the frontend and backend must support both production Firebase ID Token verification and a zero-config local Demo Mode fallback.

## Decision

We implement a dual-mode authentication layer across the client (Next.js) and API server (FastAPI):

1. **Client-Side Auth Context (`AuthContext`):**
   - Integrates `firebase/auth` with Google OAuth (`signInWithGoogle`) and Firebase Email/Password Auth.
   - Provides a `signInAsDemo` mode that stores a local demo user session in `localStorage` (`polaris_demo_user`).
   - Generates a valid Firebase JWT ID Token when Firebase is initialized, or returns a signed deterministic demo token (`demo-token-polaris-123`) in demo mode.

2. **Backend Bearer Token Verification (`get_current_user` Dependency):**
   - FastAPI intercepts all request headers via HTTP `Authorization: Bearer <token>`.
   - In production or emulator mode, tokens are validated via Firebase Admin SDK (`auth.verify_id_token`).
   - If the token equals `demo-token-polaris-123` or dev mode is active (`ALLOW_DEMO_AUTH=true`), the backend synthesizes a `demo-student-123` authenticated user context.

3. **Multi-Tenant Data Isolation:**
   - All Firestore documents are scoped by `uid`.
   - Qdrant vector payload filters strictly filter by `user_id == current_user.uid`.

## Consequences

### Positive
- Zero friction for new contributors: instant 1-click access without setting up GCP/Firebase keys.
- Production-grade security posture: real Firebase ID tokens are validated cryptographically when configured.
- Clean architectural boundary between client state and FastAPI dependency injection.

### Negative / Tradeoffs
- Demo mode must be disabled (`ALLOW_DEMO_AUTH=false`) in production deployments to prevent unauthenticated access.
