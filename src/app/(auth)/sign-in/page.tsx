import { Navbar } from "@/components/user/navbar";
import { auth, signIn } from "@/lib/auth";
import { signInRedirect } from "@/utils/settings";
import { redirect } from "next/navigation";
import SignInClient from "./client";

export default async function SignIn({
  searchParams,
}: {
  searchParams?: Promise<{ redirectTo?: string }>;
}) {
  const session = await auth();
  const fromParam = (await searchParams)?.redirectTo;

  if (session) {
    redirect(fromParam || signInRedirect);
  }

  const handleSignIn = async () => {
    "use server";
    await signIn("google", { redirectTo: fromParam || signInRedirect });
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <Navbar />
      <SignInClient onSignIn={handleSignIn} />
    </div>
  );
}
