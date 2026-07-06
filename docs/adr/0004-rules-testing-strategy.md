# 0004. Test Firestore + Storage rules against the emulator suite in CI

- **Status:** Accepted
- **Date:** 2026-06-28
- **Deciders:** SazWhatician

## Context
Firestore + Storage security rules are the second wall after backend tenant-scoping (the first wall, in Polaris, is that the Admin SDK paths are always `users/{uid}/...`). The rules must be testable — without them, every "users can only access their own data" claim is faith-based.

Options:

1. **Test against the real Firebase project** in a separate CI project. Slow, costs quota, leaves test artifacts.
2. **Test against the Firebase emulator suite** via `@firebase/rules-unit-testing`. Hermetic; runs in seconds; requires Java in the runner.
3. **Skip rules tests; rely on backend tenant scoping.** Cheapest; breaks defense-in-depth.

## Decision
Use the **Firebase emulator suite + `@firebase/rules-unit-testing`** in a dedicated CI job. The job installs `firebase-tools` and Temurin JDK 17, then runs `firebase emulators:exec --only firestore,storage "npm --prefix rules test"`.

## Alternatives Considered
- **Real Firebase project for tests** — quota cost, slower, non-deterministic.
- **Skip rules tests** — accepts that the rules document a hope, not a contract.

## Consequences
**Positive**
- Rules become a tested artifact. PRs that touch `firestore.rules` or `storage.rules` get blocked at CI if they break a contract.
- Each rule has a paired test that doubles as documentation ("alice cannot read bob's docs" reads literally in the test name).
- No external dependencies beyond what the Firebase CLI brings.

**Negative / tradeoffs accepted**
- CI now requires JDK 17 (~80 MB download) and `firebase-tools` (~50 MB). Cached by `actions/setup-java` and `actions/setup-node` so it's a one-time hit per cache key.
- Emulator startup is ~10 s; the whole rules job runs in ~30 s on `ubuntu-latest`.
- Rules tests are written in JS (Vitest) while the rest of the backend is Python. Acceptable: `@firebase/rules-unit-testing` is the canonical tool and there's no equivalent Python client.

**Revisit triggers**
- If `@firebase/rules-unit-testing` ever ships a Python SDK we'd consolidate.
- If CI minutes start to matter (we're on the free tier; 30 s per push is negligible).
