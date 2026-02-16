"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home as HomeIcon } from "lucide-react";
import { appBrand, menuItemsAdmin } from "@/utils/settings";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="h-12">
              <Link href="/admin" className="flex items-center gap-3">
                <Image
                  src={appBrand.logo}
                  alt={appBrand.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
                <div className="flex min-w-0 flex-col leading-none">
                  <span className="truncate text-sm font-semibold">{appBrand.name}</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItemsAdmin.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/admin" && pathname.startsWith(item.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url}>
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />
      <SidebarFooter>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="flex-1 justify-center" />
          <ModeToggle />
        </div>
        <Link href="/home">
          <Button variant="outline" className="w-full justify-start gap-2">
            <HomeIcon className="h-4 w-4" />
            Go to Home
          </Button>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
