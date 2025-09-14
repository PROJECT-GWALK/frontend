"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { User } from "@/utils/type";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function TestLoginPage() {
  const [data, setData] = useState<{ message: string; user?: User } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProtected = async () => {
      try {
        const res = await axios.get("/backend/api/protected", {
          withCredentials: true,
        });
        setData(res.data);
      } catch (err: any) {
        console.error("Error fetching protected route:", err);
        if (err.response) {
          setData(err.response.data);
        } else {
          setData({ message: "network-error" });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProtected();
  }, []);

  if (loading) return <p className="p-6 text-gray-600">Loading...</p>;

  const user = data?.user;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border rounded-xl shadow-lg bg-white">
      <h1 className="text-2xl font-bold mb-4">🔐 Test Protected Route</h1>

      {user ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            {user.image && (
              <img
                src={user.image}
                alt="profile"
                className="w-16 h-16 rounded-full border"
              />
            )}
            <div>
              <p className="font-semibold text-lg">{user.name || "No Name"}</p>
              <p className="text-gray-600 text-sm">{user.email}</p>
              <p className="text-sm text-blue-600">Role: {user.role}</p>
            </div>
          </div>

          <div>
            <h2 className="font-medium">Raw User Data:</h2>
            <pre className="p-3 bg-gray-100 rounded text-sm overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            🚪 Logout
          </button>
        </div>
      ) : (
        <div>
          <p className="text-red-600 font-medium">❌ Not logged in</p>
          <pre className="p-3 bg-gray-100 rounded text-sm overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
          <Link href="/sign-in">
            <button className="w-full">Sign In</button>
          </Link>
        </div>
      )}
    </div>
  );
}