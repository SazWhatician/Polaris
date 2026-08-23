<div align="center">
  <img src="frontend/public/polaris-monochrome.png" alt="Polaris Logo" width="560" />
  
  <h3>Haute Intelligence · Academic AI Navigator</h3>
  <p>Turn handwritten notes + a syllabus into a coverage map, learning-gap analysis, verified RAG citations, automated revision plans, interactive concept topologies, and career roadmaps.</p>
</div>

---

## 🌟 Overview & System Capabilities

Polaris is an end-to-end academic intelligence engine that synthesizes student course materials into structured knowledge:

- **⚡ Grounded RAG Search (`/chat`):** Ask questions cited directly from your indexed course notes & textbooks with page-level bounding box excerpts, thinking suppression, and instant token streaming.
- **📄 High-Speed OCR Pipeline (`/dashboard`):** Background document ingestion powered by PaddleOCR and Qdrant vector embeddings.
- **🕸️ Concept Topology Graph (`/graph`):** Interactive D3/WebGL force-directed knowledge graph extracting prerequisite relationships and community clusters from your syllabus.
- **🎯 Multimodal Gap Analysis (`/gaps`):** Detects prerequisite knowledge gaps and missing topics across uploaded course notes.
- **📚 Curated Resource Discovery (`/resources`):** Recommends tailored academic lectures, research papers, and open educational resources.
- **🗓️ Revision Planner Agent (`/plan`):** Generates optimized exam revision schedules with study block allocations and plan diff comparisons.
- **🧭 Pathfinder Career Agent (`/pathfinder`):** Analyzes student mastery against real-world engineering roles to produce project roadmaps and skill gap matrices.
- **🧬 Academic Digital Twin (`/twin`):** Tracks knowledge velocity, weekly study sparklines, and concept readiness.
- **🤖 In-Page AI Copilot (`AgentCopilot`):** Floating multi-modal copilot actuating in-page commands and managing student todos.
- **🌌 WebGL2 Shader System:** Real-time atmospheric aurora shader, Navier-Stokes fluid metal brand mark, and 3D PBR reactor footer with interactive 7-colorway chamber presets.

---

## 🛠️ Stack & Architecture

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router, Strict TS) · TailwindCSS · WebGL2 GLSL Shaders · Three.js · GSAP · Lucide |
| **Backend API** | FastAPI (Pydantic v2) · Python 3.11 · Redis Task Queue · Uvicorn |
| **AI / LLMs** | Groq (Llama 3.1 70B Versatile) · Google Gemini 1.5 Flash · NVIDIA NIM Embeddings |
| **Vector DB** | Qdrant Vector Database (Vector Dimension: 384, Cosine Distance) |
| **Database & Auth** | Supabase (PostgreSQL + Auth + Storage) & Firebase Firestore |
| **OCR Worker** | `arq` Async Worker + PaddleOCR Engine |
| **Observability** | OpenTelemetry Tracing · Structured JSON Logging · LangSmith |

---

## 🚀 Quickstart

### Prerequisites
* Docker Desktop (WSL2 on Windows / Linux / macOS)
* Node.js 20+
* Python 3.11

### 1. Clone Repository & Setup Environment
```bash
git clone https://github.com/SazWhatician/Polaris.git
cd Polaris

# Copy environment variables
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### 2. Launch Stack via Docker Compose
```bash
# Start backend API (Port 8010), Qdrant (Port 6333), Redis (Port 6379), and Jaeger (Port 16686)
docker-compose up -d
```

### 3. Start Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```

* **Frontend App:** [http://localhost:3000](http://localhost:3000)
* **Backend API Docs:** [http://localhost:8010/docs](http://localhost:8010/docs)
* **Qdrant Vector Dashboard:** [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

---

## 📋 Build Plan & Phase Delivery

| Phase | Milestone / Outcome | Status |
|---|---|---|
| **0** | Foundation, Docker Runtime, Logging & Observability Spine | ✅ Complete |
| **1** | User Authentication & Signed Document Storage Pipeline | ✅ Complete |
| **2** | Background Asynchronous PaddleOCR Processing Worker | ✅ Complete |
| **3** | Grounded RAG Chat Engine + Qdrant Vector Retrieval (**MVP**) | ✅ Complete |
| **4** | Syllabus Intelligence & Structural Unit Parsing | ✅ Complete |
| **5** | LangGraph Learning Gap Agent | ✅ Complete |
| **6** | Academic Resource Discovery Agent | ✅ Complete |
| **7** | Adaptive Revision Planner Agent & Schedule Diff Engine | ✅ Complete |
| **8** | Prerequisite Knowledge Graph & Interactive Topology Visualizer | ✅ Complete |
| **9** | Multi-Provider LLM Key Pool Rotation & NVIDIA Fallback | ✅ Complete |
| **10** | Academic Digital Twin & Pathfinder Career Recommender | ✅ Complete |
| **11** | In-Page AI Copilot & Ambient Study Sensor Extension | ✅ Complete |
| **12** | Haute Intelligence WebGL2 Shader System, RAG Polish & Codebase Optimization | ✅ Complete |

Detailed documentation for each phase is available in [`docs/phase-summaries/`](docs/phase-summaries/).

---

## 📖 Documentation Index

- [System Architecture & Sequence Flows](docs/architecture.md)
- [Architecture Decision Records (ADRs)](docs/adr/)
- [Phase-by-Phase Deliverables](docs/phase-summaries/)
- [Master Build Plan](docs/build-plan.md)

---

## 📄 License

MIT — see [LICENSE](LICENSE).
