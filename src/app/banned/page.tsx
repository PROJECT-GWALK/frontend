import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import BannedClient from "@/components/user/bannedClient"

export default async function BannedPage() {
  const session = await auth()

  if (!session?.banned) {
    redirect("/dashboard")
  }

  return <BannedClient />
}
