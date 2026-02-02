import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { menuItemsAdmin } from "@/utils/settings";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gallery walk</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItemsAdmin.map((menuItemsAdmin) => (
                <SidebarMenuItem key={menuItemsAdmin.title}>
                  <SidebarMenuButton asChild>
                    <a href={menuItemsAdmin.url}>
                      {menuItemsAdmin.icon}
                      <span>{menuItemsAdmin.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
        <Separator />
      <SidebarFooter >
        <Link href="/home">
          <Button className="w-full">Go to Home</Button>
        </Link>

      </SidebarFooter>
    </Sidebar>
  );
}
