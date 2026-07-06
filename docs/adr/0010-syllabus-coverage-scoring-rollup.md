# 0010. Syllabus Coverage Scoring and Recursive Rollup

- **Status:** Accepted
- **Date:** 2026-07-06
- **Deciders:** Antigravity, USER

## Context
In Phase 4 (Syllabus Intelligence), we need to assess the user's study notes against their course syllabus. This produces a "Coverage Map" highlighting learning gaps. The syllabus has a hierarchical tree structure: parent topics (e.g. "Web Security") branch into subtopics (e.g. "Cross-Site Scripting", "SQL Injection").

We need to decide:
1. How to grade coverage for a leaf topic (an individual subtopic without further branches).
2. How to propagate coverage grades up to parent topics in a robust, mathematically sound way.

## Decision
We will employ a two-level evaluation approach:

1. **Leaf Topic Grading (Hybrid Scoring)**:
   - For each leaf topic, we perform a vector similarity search across the student's indexed notes to find relevant chunks.
   - We construct a hybrid score using:
     - **Retrieval Score** ($S_{ret}$): $100 \times \min(N_{matches} / \text{threshold\_count}, 1.0)$ where we look at the count of retrieved chunks above a similarity threshold.
     - **LLM Grade** ($S_{llm}$): An LLM-as-a-judge score (0-100) obtained by presenting the retrieved context and topic description to the LLM.
     - **Leaf Score** ($S_{leaf}$): Weighted average: $W_{ret} \times S_{ret} + W_{llm} \times S_{llm}$.
   - Status mapping: Good ($\ge 80$), Partial ($50-79$), Poor ($< 50$).

2. **Parent Topic Propagation (Recursive Rollup)**:
   - Parent topics have no direct matched chunks or direct LLM grades. Instead, they roll up subtopic progress.
   - The score of a parent topic is the **simple average** of all its immediate children's scores:
     $$S_{parent} = \frac{1}{|C|} \sum_{c \in C} S_c$$
     where $C$ is the set of child subtopics.
   - This formula is applied recursively from leaf nodes up to the root level.
   - Status mapping for parent nodes uses the same thresholds.

## Alternatives Considered
- **Vector-Only Evaluation** — Purely counting relevant notes chunks. While fast and cheap, it fails to evaluate the actual quality or correctness of the notes content.
- **LLM-Only Evaluation on the Whole Notes Set** — Passing the entire notebook/document to the LLM. This is cost-prohibitive and suffers from context-window limitations.
- **Rollup via Max Score** — Defining parent score as the maximum of its children. This falsely indicates that an entire unit is "covered" when only one subtopic is known.
- **Rollup via Min Score** — Defining parent score as the minimum of its children. This is overly pessimistic and does not represent partial progress.

## Consequences
- **Positive**:
  - Leverages local embeddings for fast candidate retrieval before calling the LLM, reducing latency and cost.
  - Combines quantity (retrieval match count) with quality (LLM-as-a-judge reasoning).
  - Simple average rollup represents balanced progress across syllabus modules.
- **Negative / tradeoffs accepted**:
  - If a topic has deep hierarchies, a parent's score is a nested average, which may mask total leaf-level failures if some subtopics have high scores.
  - LLM calls for each leaf topic introduce latency during coverage computation.
