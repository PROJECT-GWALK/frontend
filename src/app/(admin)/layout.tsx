import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import "../globals.css";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { AppSidebar } from "@/components/user/app-sidebar";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as { role?: string }).role !== "ADMIN"
  ) {
    redirect("/")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="flex items-center justify-between p-4">
          <SidebarTrigger />
          <ModeToggle />
        </div>
        <div className="p-4">{children}</div>
      </main>
    </SidebarProvider>
  );
}