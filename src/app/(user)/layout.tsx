import { Navbar } from "@/components/user/navbar";
import "../globals.css";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const session = await auth();
  if(session?.banned) {
    redirect("/banned")
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-6 py-8">{children}</main>
    </>
  );
}
