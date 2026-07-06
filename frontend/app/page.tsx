"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-8 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Polaris</h1>
        <p className="mt-2 text-muted-foreground">AI Academic Navigator</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your Google account. Notes and uploads stay private to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signIn} disabled={loading} className="w-full">
            {loading ? "Loading…" : "Sign in with Google"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
