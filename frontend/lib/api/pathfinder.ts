import { api } from "./client";

export interface RecommendedProject {
  title: string;
  description: string;
}

export interface CareerGoal {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  recommended_projects: RecommendedProject[];
  milestones: string[];
}

export interface SkillGap {
  skill: string;
  status: "ready" | "weak" | "missing";
}

export interface CareerPlan {
  career_goal: CareerGoal;
  skill_gaps: SkillGap[];
  ready_skills: string[];
  missing_skills: string[];
  readiness_score: number;
  recommended_projects: RecommendedProject[];
  learning_path: string[];
  summary: string;
}

export async function fetchCareerGoals(): Promise<CareerGoal[]> {
  return api<CareerGoal[]>("/api/pathfinder/goals");
}

export async function analyzeCareerPath(careerGoalId: string): Promise<CareerPlan> {
  return api<CareerPlan>("/api/pathfinder/analyze", {
    method: "POST",
    body: JSON.stringify({ career_goal_id: careerGoalId }),
  });
}
