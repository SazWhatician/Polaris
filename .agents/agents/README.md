# Sub-agents (canonical)

Canonical, tool-agnostic definitions for the Triumvirate sub-agents. Both **Antigravity** and **Claude Code** are wired to invoke them.

## Roster

| Agent | Role |
|-------|------|
| [mistralis](./mistralis.md) | Research + novel ideas. Produces a plan or scaffold. |
| [zenith](./zenith.md) | Implementation. Writes tight code using the [ponytail](../skills/ponytail/SKILL.md) ladder. |
| [aurelius](./aurelius.md) | Review + escalation. Loops with Zenith until clean, or asks the user for what's missing. |

## Single-prompt entry point

The [triumvirate](../skills/triumvirate/SKILL.md) skill runs the full pipeline:

```
/triumvirate <one-sentence task description>
```

Mistralis → Zenith → Aurelius, with an automatic Zenith↔Aurelius loop until APPROVED or NEEDS USER INPUT.

## Mirror to `.claude/`

Claude Code discovers agents from `.claude/agents/` and skills from `.claude/skills/`, not from `.agents/`. The files under `.claude/` are exact mirrors — **edit here first, then copy across:**

```powershell
Copy-Item .agents/agents/*.md .claude/agents/ -Force
Copy-Item .agents/skills/triumvirate/SKILL.md .claude/skills/triumvirate/SKILL.md -Force
```

Antigravity reads `.agents/` directly, so it always sees the canonical.
