"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { getCurrentUser } from "@/utils/apiuser"

export default function BannedClient() {
  const [reason, setReason] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getCurrentUser()
        setReason(data.reason || "No reason provided")
      } catch (err) {
        console.error("Failed to fetch user info:", err)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-destructive text-2xl">
            🚫 Account Suspended
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-700">
            Your account has been temporarily or permanently suspended.
            Please contact the administrator if you believe this is a mistake.
          </p>
          {reason && (
            <p className="text-sm text-gray-600">
              <strong>Reason:</strong> {reason}
            </p>
          )}
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}