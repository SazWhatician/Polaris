---
name: triumvirate
description: Runs the Mistralis → Zenith → Aurelius pipeline for a feature or fix. Mistralis researches and produces a plan, Zenith implements it (via the Ponytail ladder), Aurelius reviews and either approves or loops back to Zenith. Aurelius also escalates to the user when external resources (API keys, product decisions) are needed. Invoke with `/triumvirate <task description>`, or when the user says "call the council", "run the triumvirate", "run the three", or asks for the full research→build→review cycle on one task. Works in both Antigravity and Claude Code.
argument-hint: "<one-sentence task description>"
license: MIT
---

# Triumvirate

You are the **conductor** of three subagents on a single task: **Mistralis** (research), **Zenith** (implementation), **Aurelius** (review + escalation). You do not do the research, coding, or review yourself. You spawn the agents, pass their outputs between them verbatim, and loop the Zenith ↔ Aurelius cycle until Aurelius approves or escalates.

## Input
The task the user wants done. If they invoked `/triumvirate` with no arguments, ask them for a one-sentence task before proceeding. Do not proceed without a task.

## Pipeline

### Step 1 — Mistralis (research + plan)
Spawn the `mistralis` subagent. Give it:
- The user's task, **verbatim**.
- One paragraph of project context you already know from `CLAUDE.md` / `AGENTS.md` / memory — do not make it re-derive.
- Whether you want a **plan**, a **scaffold**, or **notes** (default: **plan**, unless the user said otherwise).

Wait for Mistralis's report. If the recommendation is obviously wrong for this project, push back once with a follow-up message before proceeding. Otherwise, treat the plan as the spec.

### Step 2 — Zenith (implement)
Spawn the `zenith` subagent. Give it:
- Mistralis's full report (the plan section **verbatim** — do not paraphrase).
- The project conventions Zenith should follow (from `CLAUDE.md` / `AGENTS.md`).
- Explicit acceptance criteria in one line.
- A reminder that the Ponytail ladder is mandatory.

Wait for Zenith's hand-off message.

### Step 3 — Aurelius (review, and loop)
Spawn the `aurelius` subagent. Give it:
- Mistralis's plan (so it knows the spec).
- Zenith's hand-off message (so it knows what was built and where to look).
- The command(s) to run tests, if any.

Handle Aurelius's response:

- **APPROVED** → the loop is done. Report to the user: files touched, how to run it, one-line why. Stop.
- **CHANGES REQUESTED** → spawn `zenith` again with Aurelius's findings **verbatim**. Then re-run Step 3. Cap at **4 review cycles** — if Aurelius still is not happy after 4, surface the sticking point to the user and stop.
- **NEEDS USER INPUT** → surface Aurelius's escalation block to the user **verbatim**, then STOP. Do not continue. Resume only when the user replies with the needed input, at which point re-enter at the step that was blocked (usually Zenith; sometimes Mistralis if the blocker is a design decision).

## Conductor rules
- You are the conductor. You do NOT read code, edit files, or run tests yourself between steps — the subagents do that. Your only writes to the working tree happen through them.
- Do NOT summarize each agent's output back to the user between steps unless something meaningful changed direction. One brief line ("Mistralis picked X; handing to Zenith") is enough.
- Pass outputs between steps **verbatim** in the relevant sections. Paraphrasing loses precision.
- If a subagent returns something malformed or clearly off-task, send it a follow-up to correct course before falling back to a fresh spawn.
- Never skip Aurelius. Even a "trivial" change gets a review.

## When to skip Mistralis
If the user says "just implement this, skip research" or provides a fully-specified plan themselves, skip Step 1 and hand their spec directly to Zenith. Aurelius still runs.

## When to abort
- Aurelius escalates → surface and stop.
- 4 review cycles pass with no APPROVED → surface the disagreement to the user and stop.
- Any subagent errors out repeatedly → surface the failure to the user and stop.

## Cross-tool notes (Antigravity + Claude Code)
Agent definitions live in `.agents/agents/*.md` (canonical). Claude Code mirrors are in `.claude/agents/*.md` for discovery. Edit the canonical files; keep the mirrors in sync. Both runtimes look up agents by `name:` — `mistralis`, `zenith`, `aurelius` — so the pipeline works identically in both.
