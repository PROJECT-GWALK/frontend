"use client";


import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@/utils/types";
import { useTheme } from "next-themes";
import { Menu, LogOut, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { appBrand, menuItems } from "@/utils/settings";
import { signOut } from "next-auth/react";
import { getCurrentUser } from "@/utils/apiuser";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { navbarItems } from "@/utils/settings";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const { setTheme, theme } = useTheme();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    // ปิด Sheet อัตโนมัติเมื่อขนาดหน้าจอ ≥ md
    if (!isMobile && sheetOpen) {
      setSheetOpen(false);
    }
  }, [isMobile, sheetOpen]);

  const fetchUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  return (
    <nav className="border-b ">
      <div className="container mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 !w-[70vw] sm:!w-64">
                <SheetHeader className="p-4">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="p-2">
                  <div className="flex flex-col space-y-1">
                    {navbarItems.map((item) => (
                      <Link
                        key={item.url}
                        href={item.url}
                        className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div>
            <Link href="/" className="text-lg font-bold">
              <div className="flex items-center space-x-4">
                {appBrand.logo && (
                  <Image
                    src={appBrand.logo}
                    alt="GWALK"
                    width={32}
                    height={32}
                  />
                )}
                {appBrand.name && (
                  <div>{appBrand.name}</div>
                )}
              </div>
            </Link>
          </div>
          <div>
            {user ? (
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="select-none hover:border-2">
                    <Avatar>
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback>
                        {user.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {menuItems
                      .filter((item) => {
                        if (item.role === "user") return true;
                        if (item.role === "admin" && user.role === "ADMIN")
                          return true;
                        return false;
                      })
                      .map((item) => (
                        <Link key={item.href} href={item.href}>
                          <DropdownMenuItem className="flex items-center gap-2">
                            {item.icon}
                            <span>{item.label}</span>
                          </DropdownMenuItem>
                        </Link>
                      ))}
                    <DropdownMenuItem
                      onClick={() =>
                        setTheme(theme === "dark" ? "light" : "dark")
                      }
                      className="flex items-center gap-1"
                    >
                      <span className="relative flex h-[1.2rem] w-[1.2rem]">
                        <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </span>
                      <span>{theme === "dark" ? "Light" : "Dark"} mode</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => {signOut()}}>
                      <LogOut />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/sign-in">
                <Button size="lg">Log in</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
