import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth, signIn } from "@/lib/auth";
import { signInRedirect } from "@/utils/settings";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function SignIn() {
  const session = await auth();

  if (session) {
    redirect(signInRedirect);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex justify-center">
            <Image src="gwalk-icon.svg" alt="Logo" width={160} height={160} />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="text-4xl font-bold text-center">Sign in to your Account</div>
        </CardContent>
        <CardFooter >
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: signInRedirect });
            }}
            className="w-full"
          >
            <Button variant="outline" className="w-full" size="lg">
              <Image src="google-icon.svg" alt="Google Icon" width={16} height={16} /> Continue with Google
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}