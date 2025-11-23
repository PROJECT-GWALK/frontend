import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardSignIn } from "@/components/ui/card";
import { Navbar } from "@/components/user/navbar";
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
    <div className="relative min-h-screen bg-background">
      {/* Overlay gradient for hero background */}

      <Navbar />

      <div className="flex items-center justify-center">
        <div className="flex items-center flex-1 py-36">
          <div className="w-full p-6 md:p-10">
            <div className="items-center max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap=8">
              <div className="items-center justify-center gap-y-6">
                <div className="flex flex-col gap-y-6">
                  <div className="flex justify-center">
                    <Image src="gwalk-icon.svg" alt="Logo" width={120} height={120} />
                  </div>
                  <div className="text-4xl font-semibold text-center ">Gallery Walk</div>
                  <p className="text-center md:text-lg">Create & Explore Interactive Event</p>
                </div>
              </div>
              <div className="w-full max-w-sm mx-auto mt-5 md:mt-0">
                <CardSignIn>
                  <CardContent className="items-center justify-center">
                    <div className="text-2xl font-medium text-center">
                      Please log in to continue
                    </div>
                    <p></p>
                  </CardContent>
                  <CardFooter>
                    <form
                      action={async () => {
                        "use server";
                        await signIn("google", { redirectTo: signInRedirect });
                      }}
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full" size="lg">
                        <Image src="google-icon.svg" alt="Google Icon" width={16} height={16} />{" "}
                        Continue with Google
                      </Button>
                    </form>
                  </CardFooter>
                </CardSignIn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
