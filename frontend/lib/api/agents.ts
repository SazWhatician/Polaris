import { api } from "./client";

export interface GapRecommendation {
  topic_id: string;
  title: string;
  status: "weak" | "missing";
  reason: string;
  actionable_steps: string[];
  estimated_hours: number;
}

export interface GapAnalysisResponse {
  syllabus_id: string;
  gaps: Record<string, "known" | "weak" | "missing">;
  prerequisites: Record<string, string[]>;
  recommendations: GapRecommendation[];
  updated_at: string;
}

export interface GapRunResponse {
  thread_id: string;
  status: "running" | "completed" | "failed" | "not_started";
}

export async function triggerGapAnalysis(syllabusId: string): Promise<GapRunResponse> {
  return api<GapRunResponse>("/api/agents/gap/run", {
    method: "POST",
    body: JSON.stringify({ syllabus_id: syllabusId }),
  });
}

export async function getGapAnalysisStatus(threadId: string): Promise<GapAnalysisResponse> {
  return api<GapAnalysisResponse>(`/api/agents/gap/runs/${threadId}`, {
    method: "GET",
  });
}

export async function updateGapRecommendations(
  threadId: string,
  recommendations: GapRecommendation[],
): Promise<GapAnalysisResponse> {
  return api<GapAnalysisResponse>(`/api/agents/gap/runs/${threadId}`, {
    method: "PUT",
    body: JSON.stringify({ recommendations }),
  });
}

