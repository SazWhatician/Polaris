import { api } from "./client";

export interface ResourceItem {
  title: string;
  video_id: string;
  url: string;
  channel_title: string;
  thumbnail_url: string;
  duration: string;
  publication_date?: string;
  view_count?: number;
  description?: string;
  rank_score: number;
  why_recommended: string;
}

export interface ResourceDiscoveryResponse {
  topic_id: string;
  topic_title: string;
  resources: ResourceItem[];
  from_cache: boolean;
  updated_at: string;
}

export interface ResourceRunResponse {
  thread_id: string;
  status: "running" | "completed" | "failed";
}

export async function triggerResourceDiscovery(
  topicId: string,
  topicTitle: string,
): Promise<ResourceRunResponse> {
  return api<ResourceRunResponse>("/api/agents/resource/run", {
    method: "POST",
    body: JSON.stringify({
      topic_id: topicId,
      topic_title: topicTitle,
    }),
  });
}

export async function getResourceDiscoveryStatus(
  threadId: string,
): Promise<ResourceDiscoveryResponse> {
  return api<ResourceDiscoveryResponse>(`/api/agents/resource/runs/${threadId}`, {
    method: "GET",
  });
}

export async function getCachedTopicResources(
  topicTitle: string,
): Promise<ResourceDiscoveryResponse> {
  const encoded = encodeURIComponent(topicTitle);
  return api<ResourceDiscoveryResponse>(`/api/agents/resource/topic/${encoded}`, {
    method: "GET",
  });
}
