import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn } from "@/lib/auth";
import Image from "next/image";

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="m-8 w-full max-w-xl">
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
              await signIn("google", { redirectTo: "/test" });
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