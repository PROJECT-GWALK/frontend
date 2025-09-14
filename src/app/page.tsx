"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Link href="/sign-in">
        <button className="w-full">Sign In</button>
      </Link>
    </div>
  );
}
