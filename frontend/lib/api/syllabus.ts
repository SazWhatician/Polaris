import { api } from "./client";

export interface Topic {
  id: string;
  title: string;
  description: string | null;
  subtopics: Topic[];
}

export interface SyllabusResponse {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  tree: Topic[];
}

export interface SyllabusListResponse {
  items: SyllabusResponse[];
}

export interface TopicCoverage {
  topic_id: string;
  score: number;
  status: "good" | "partial" | "none";
  explanation: string;
  matched_chunks: Record<string, unknown>[];
}

export interface SyllabusCoverage {
  syllabus_id: string;
  overall_score: number;
  topics: Record<string, TopicCoverage>;
  updated_at: string;
}

export async function createSyllabus(
  name: string,
  syllabusText?: string,
  documentId?: string,
): Promise<SyllabusResponse> {
  return api<SyllabusResponse>("/api/syllabus", {
    method: "POST",
    body: JSON.stringify({
      name,
      syllabus_text: syllabusText || null,
      document_id: documentId || null,
    }),
  });
}

export async function listSyllabi(): Promise<SyllabusListResponse> {
  return api<SyllabusListResponse>("/api/syllabus", {
    method: "GET",
  });
}

export async function getSyllabus(syllabusId: string): Promise<SyllabusResponse> {
  return api<SyllabusResponse>(`/api/syllabus/${syllabusId}`, {
    method: "GET",
  });
}

export async function deleteSyllabus(syllabusId: string): Promise<void> {
  return api<void>(`/api/syllabus/${syllabusId}`, {
    method: "DELETE",
  });
}

export async function computeSyllabusCoverage(syllabusId: string): Promise<SyllabusCoverage> {
  return api<SyllabusCoverage>(`/api/syllabus/${syllabusId}/coverage`, {
    method: "POST",
  });
}

export async function getSyllabusCoverage(syllabusId: string): Promise<SyllabusCoverage> {
  return api<SyllabusCoverage>(`/api/syllabus/${syllabusId}/coverage`, {
    method: "GET",
  });
}
