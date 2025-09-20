import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import "../globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/mode toggle";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  console.log("Session in Layout:", session);
  if (
    !session?.user ||
    (session.user as { role?: string }).role !== "ADMIN"
  ) {
    redirect("/")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <main className="w-full">{children}</main>
      <ModeToggle />
    </SidebarProvider>
  );
}
