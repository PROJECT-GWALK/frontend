import { Button } from "@/components/ui/button";
import Link from "next/link";

// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-gray-500 mb-6">This page could not be found.</p>
      <Link href="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
