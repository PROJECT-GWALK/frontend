"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { User } from "@/utils/types";
import { getCurrentUser } from "@/utils/api";

export default function TestLoginPage() {
  const [data, setData] = useState<{ message: string; user?: User } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProtected = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setData({ message: "success", user });
        } else {
          setData({ message: "unauthorized" });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setData({ message: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchProtected();
  }, []);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 border rounded-xl shadow-lg bg-white text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const user = data?.user;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-xl shadow-lg bg-white">
      <h1 className="text-2xl font-bold mb-4">🔐 Test Protected Route</h1>

      {user ? (
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-lg">
              {user.username || user.name || user.email || "Anonymous"}
            </p>
            <p className="text-gray-600 text-sm">{user.email}</p>
            <p className="text-sm text-blue-600">Role: {user.role}</p>
          </div>

          <div>
            <h2 className="font-medium">Raw User Data:</h2>
            <pre className="p-3 bg-gray-100 rounded text-sm overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            🚪 Logout
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-red-600 font-medium">❌ Not logged in</p>
          <pre className="p-3 bg-gray-100 rounded text-sm overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
          <Link href="/sign-in">
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
              🔑 Sign In
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
