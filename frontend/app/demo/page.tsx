"use client";

import { HeroWave } from "@/components/ui/ai-input-hero";
import { useRouter } from "next/navigation";

export default function DemoPage() {
  const router = useRouter();

  const handlePromptSubmit = (promptText: string) => {
    if (!promptText.trim()) return;
    router.push(`/chat?prompt=${encodeURIComponent(promptText)}` as Parameters<typeof router.push>[0]);
  };

  return (
    <main className="w-full min-h-screen bg-black overflow-hidden">
      <HeroWave
        title="Polaris AI Assistant."
        subtitle="Grounded RAG AI Assistant. Ask questions, analyze gaps, and build study plans."
        placeholder="Describe what you want to learn or ask..."
        buttonText="Ask Polaris"
        onPromptSubmit={handlePromptSubmit}
      />
    </main>
  );
}
