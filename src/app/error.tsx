"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function AuthErrorPage() {
  const params = useSearchParams();
  const code = params.get("error") ?? "UnknownError";

  const messageMap: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The sign-in link has expired or is invalid.",
    Default: "An unexpected error occurred during sign in.",
  };

  const message =
    messageMap[code as keyof typeof messageMap] ?? messageMap.Default;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-xl font-bold">Sign in error</CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {message} {code !== "UnknownError" ? `(code: ${code})` : null}
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}