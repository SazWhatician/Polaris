# ADR 0015 — Knowledge Graph Representation & In-Memory Graph Caching

- **Status:** Accepted
- **Date:** 2026-08-02
- **Deciders:** Engineering / Core Architecture Team

## Context & Problem Statement

Polaris requires a **Knowledge Graph Engine** to model academic concepts, prerequisite dependencies, and community clusters across student notes and syllabus topics. We needed a representation strategy that allows fast traversal, community detection, and instant visual graph queries without the operational overhead of managing a dedicated graph database service (such as Neo4j) on free cloud tiers.

## Decision Drivers

1. **Low Latency & High Throughput:** Instant neighborhood traversal and community clustering queries for front-end rendering.
2. **Minimal Operational Overhead:** Avoiding external graph DB infrastructure costs/limits on free-tier hosting.
3. **Multi-Tenant Isolation:** Clean scoping of knowledge graphs by `user_id`.
4. **Interactive Front-End Responsiveness:** 2D force-directed canvas layout with zero-delay node selection.

## Considered Options

1. **Option 1:** External Graph Database (Neo4j / Memgraph cloud).
2. **Option 2:** Denormalized Firestore persistence (`users/{uid}/knowledge_graph/{graph_id}`) + in-memory adjacency list caching in Python API.

## Decision Outcome

Chosen **Option 2** (Firestore persistence + in-memory adjacency caching in Python).

### Positive Consequences
- **Zero Additional Infrastructure Cost:** Operates fully within existing Firestore free tier.
- **Fast Graph Queries:** Neighborhood traversals and community cluster detection execute in-memory in `< 5ms`.
- **Clean Component Scoping:** Graph nodes and edges map directly to Pydantic domain models (`ConceptNode`, `ConceptRelationship`, `ConceptCluster`).

### Negative Consequences / Mitigations
- **In-Memory Volatility:** Server restarts clear the API graph cache.
  - *Mitigation:* The `GraphRepository` automatically hydrates graph data from Firestore whenever a cache miss occurs.
