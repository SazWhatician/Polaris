"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useCommunityStore } from "@/lib/community-store";
import { CommunityFeed } from "@/components/community/community-feed";
import { FriendsDrawer } from "@/components/community/friends-drawer";
import { useGsapEntrance } from "@/lib/use-animation-system";

export default function CommunityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { friends } = useCommunityStore();

  const [friendsDrawerOpen, setFriendsDrawerOpen] = useState(false);

  const containerRef = useGsapEntrance(".gsap-comm", 0.04);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user) return null;

  const connectedFriendsCount = friends.filter((f) => f.status === "friends").length;

  return (
    <div className="relative min-h-screen text-foreground pb-32 pt-14 sm:pt-16 overflow-x-hidden selection:bg-primary/30 selection:text-foreground">
      {/* ── Ambient Fluid Liquid Caustic Spheres (iOS/visionOS Glass Glow) ── */}
      <div className="ambient-liquid-glow -top-24 -left-24 w-[500px] h-[500px] bg-indigo-500/20" />
      <div className="ambient-liquid-glow top-[35%] -right-32 w-[550px] h-[550px] bg-purple-500/15" />
      <div className="ambient-liquid-glow bottom-12 left-[20%] w-[600px] h-[600px] bg-emerald-500/12" />

      <SiteHeader />

      <main ref={containerRef} className="relative z-10 max-w-7xl mx-auto space-y-5 py-4 px-3 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="gsap-comm">
          <PageHeader
            category="PEER NETWORK // SCHOLAR HUBS"
            title="University Communities & Study Circles"
            description="Collaborate with classmates across your university, branch, and academic year. Share notes, discuss formulas, and build your study network."
            icon={Users}
            badgeText="Verified Circles"
            badgeVariant="indigo"
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFriendsDrawerOpen(true)}
                  className="gap-1.5 text-xs font-bold rounded-2xl border-white/20 bg-white/10 dark:bg-white/5 hover:bg-white/15 backdrop-blur-xl"
                >
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  <span>My Study Circle ({connectedFriendsCount})</span>
                </Button>
              </div>
            }
          />
        </div>

        {/* ── MAIN 3-COLUMN COMPACT BENTO COMMUNITY FEED ── */}
        <div className="gsap-comm">
          <CommunityFeed
            onOpenFriendsDrawer={() => setFriendsDrawerOpen(true)}
          />
        </div>

      </main>

      {/* Friends Drawer */}
      <FriendsDrawer
        open={friendsDrawerOpen}
        onOpenChange={setFriendsDrawerOpen}
      />
    </div>
  );
}
