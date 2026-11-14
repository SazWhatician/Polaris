"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?mode=signup");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-mono text-xs text-muted-foreground">
      FORWARDING TO SCHOLAR REGISTRATION...
    </div>
  );
}
