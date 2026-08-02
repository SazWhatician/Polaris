import { api } from "./client";

export interface ConceptNode {
  id: string;
  name: string;
  category: string;
  description: string;
  source_document_ids?: string[];
  source_pages?: number[];
  importance_score?: number;
}

export interface ConceptRelationship {
  id: string;
  source_concept_id: string;
  target_concept_id: string;
  relation_type: string;
  description: string;
  confidence_score?: number;
}

export interface ConceptCluster {
  cluster_id: string;
  name: string;
  node_ids: string[];
  color_hex: string;
}

export interface KnowledgeGraph {
  id: string;
  user_id: string;
  nodes: ConceptNode[];
  edges: ConceptRelationship[];
  clusters: ConceptCluster[];
  created_at: string;
  updated_at: string;
}

export interface NodeDetailResponse {
  node: ConceptNode;
  prerequisites: ConceptNode[];
  dependents: ConceptNode[];
}

export async function fetchLatestGraph(): Promise<KnowledgeGraph> {
  return api<KnowledgeGraph>("/api/graph/latest");
}

export async function fetchNodeDetail(nodeId: string): Promise<NodeDetailResponse> {
  return api<NodeDetailResponse>(`/api/graph/nodes/${encodeURIComponent(nodeId)}`);
}

export async function extractKnowledgeGraph(
  documentIds?: string[],
  syllabusId?: string
): Promise<{ success: boolean; graph_id: string; node_count: number; edge_count: number; cluster_count: number; message: string }> {
  return api("/api/graph/extract", {
    method: "POST",
    body: JSON.stringify({
      document_ids: documentIds,
      syllabus_id: syllabusId,
    }),
  });
}
