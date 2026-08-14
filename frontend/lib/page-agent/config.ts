/**
  PolarAssist Copilot Capabilities for Polaris
 */

export interface Capability {
  id: string;
  title: string;
  description: string;
  targetRoute: string;
  actionHint: string;
}

export const POLARIS_CAPABILITIES: Capability[] = [
  {
    id: "run_gap_analysis",
    title: "Run Syllabus Gap Analysis",
    description: "Assesses missing/weak topics in syllabus and orders study priorities",
    targetRoute: "/gaps",
    actionHint: "Navigates to /gaps and clicks 'Run Agent'",
  },
  {
    id: "check_twin_readiness",
    title: "Check Readiness to Learn Concept",
    description: "Verifies prerequisite graph coverage for a target concept",
    targetRoute: "/twin",
    actionHint: "Navigates to /twin, inputs concept, and triggers check",
  },
  {
    id: "career_pathfinder",
    title: "Analyze Career Skill-Gap",
    description: "Evaluates readiness for ML Engineer, Backend, Data Scientist, or SWE",
    targetRoute: "/pathfinder",
    actionHint: "Navigates to /pathfinder, selects career goal, and generates plan",
  },
  {
    id: "explore_knowledge_graph",
    title: "Explore Knowledge Graph",
    description: "Views concept nodes, clusters, and prerequisite relationships",
    targetRoute: "/graph",
    actionHint: "Navigates to /graph and re-extracts if needed",
  },
  {
    id: "generate_revision_plan",
    title: "Generate Day-by-Day Revision Plan",
    description: "Schedules study blocks up to target exam date",
    targetRoute: "/plan",
    actionHint: "Navigates to /plan and triggers schedule allocation",
  },
];
