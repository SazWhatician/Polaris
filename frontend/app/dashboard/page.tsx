"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DocumentList } from "@/components/document-list";
import { SiteHeader } from "@/components/site-header";
import { UploadCard } from "@/components/upload-card";
import { useAuth } from "@/lib/auth-context";
import { listDocuments, type DocumentResponse } from "@/lib/api/documents";

const POLL_INTERVAL_MS = 3000;
const IN_FLIGHT_STATES = new Set(["queued", "processing"]);

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [fetching, setFetching] = useState(true);
  const docsRef = useRef(docs);
  docsRef.current = docs;

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // Initial load.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const items = await listDocuments();
        if (!cancelled) setDocs(items);
      } catch (e) {
        toast.error("Failed to load documents", {
          description: e instanceof Error ? e.message : String(e),
        });
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Background poll: refresh while any doc is queued/processing.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const tick = async () => {
      const hasInFlight = docsRef.current.some((d) => IN_FLIGHT_STATES.has(d.status));
      if (!hasInFlight) return;
      try {
        const items = await listDocuments();
        if (!cancelled) setDocs(items);
      } catch {
        // Polling is best-effort; do not toast on transient errors.
      }
    };

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container max-w-3xl space-y-6 py-8">
        <UploadCard onUploaded={(d) => setDocs((prev) => [d, ...prev])} />
        {fetching ? (
          <p className="text-sm text-muted-foreground">Loading documents…</p>
        ) : (
          <DocumentList docs={docs} onChange={setDocs} />
        )}
      </main>
    </div>
  );
}
