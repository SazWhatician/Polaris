import { api } from "./client";

export interface VelocityPoint {
  week: string;
  concepts_learned: number;
}

export interface AcademicTwin {
  user_id: string;
  known_concepts: string[];
  weak_concepts: string[];
  missing_concepts: string[];
  velocity: VelocityPoint[];
  signals_count: number;
  last_updated: string;
}

export interface ReadinessResult {
  target_concept: string;
  ready: boolean;
  ready_prerequisites: { concept_id: string; name: string; status: string }[];
  missing_prerequisites: { concept_id: string; name: string; status: string }[];
  summary: string;
}

export async function fetchTwin(): Promise<AcademicTwin> {
  return api<AcademicTwin>("/api/twin");
}

export async function checkReadiness(concept: string): Promise<ReadinessResult> {
  return api<ReadinessResult>("/api/twin/readiness", {
    method: "POST",
    body: JSON.stringify({ concept }),
  });
}

export async function ingestSignal(signal: {
  source: string;
  concept_id?: string;
  topic_id?: string;
}): Promise<AcademicTwin> {
  return api<AcademicTwin>("/api/twin/signals", {
    method: "POST",
    body: JSON.stringify(signal),
  });
}
