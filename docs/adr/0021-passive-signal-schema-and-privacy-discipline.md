# ADR 0021: Passive Signal Schema & Privacy Discipline

- **Status:** Accepted
- **Date:** 2026-08-14
- **Context:** Collecting ambient study signals from external sites (YouTube, ArXiv, docs) must follow strict privacy controls so user activity is neither leaked nor logged unnecessarily.

## Decision

1. **Anonymized Signal Schema:** Signals transmit URL hashes (`url_hash`), matched `topic_id`, similarity score, and engagement duration (`duration_s`) — never full page content or raw URLs.
2. **Opt-In Allowed Domains:** Extension monitoring defaults to an explicit allowlist (e.g., `youtube.com`, `wikipedia.org`, `arxiv.org`, `github.com`, `docs.python.org`).
3. **User Retention & Wiping:** Users can clear all recorded twin signals at any time via `GET /api/twin` profile settings.

## Consequences

- Full privacy protection and user control.
- Closes the loop between external study behavior and digital twin updates.
