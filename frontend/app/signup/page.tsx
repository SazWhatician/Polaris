"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?mode=signup");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-xs font-mono">
      FORWARDING TO SCHOLAR REGISTRATION...
    </div>
  );
}
