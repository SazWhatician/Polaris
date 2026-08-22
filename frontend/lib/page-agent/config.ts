/**
 * PolarAssist Copilot Capabilities for Polaris
 */

export interface Capability {
  id: string;
  title: string;
  description: string;
  targetRoute: string;
  actionHint: string;
  domSelector?: string;
}

export const POLARIS_CAPABILITIES: Capability[] = [
  {
    id: "run_gap_analysis",
    title: "Run Syllabus Gap Analysis",
    description: "Assesses missing/weak topics in syllabus and orders study priorities",
    targetRoute: "/gaps",
    domSelector: '[data-agent-target="run-gap-agent-btn"]',
    actionHint: "Navigates to /gaps and triggers 'Run Agent'",
  },
  {
    id: "check_twin_readiness",
    title: "Check Readiness to Learn Concept",
    description: "Verifies prerequisite graph coverage for a target concept",
    targetRoute: "/twin",
    domSelector: '[data-agent-target="readiness-check-btn"]',
    actionHint: "Navigates to /twin, inputs concept, and triggers check",
  },
  {
    id: "career_pathfinder",
    title: "Analyze Career Skill-Gap",
    description: "Evaluates readiness for ML Engineer, Backend, Data Scientist, or SWE",
    targetRoute: "/pathfinder",
    domSelector: '[data-agent-target="analyze-career-btn"]',
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
    domSelector: '[data-agent-target="generate-plan-btn"]',
    actionHint: "Navigates to /plan and triggers schedule allocation",
  },
];
