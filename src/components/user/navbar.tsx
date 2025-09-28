"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@/utils/types";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, Menu, X } from "lucide-react";
import Image from "next/image";
import { appBrand, menuItems, navbarItems } from "@/utils/settings";
import { signOut, useSession } from "next-auth/react";
import { getCurrentUser } from "@/utils/apiuser";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../ui/navigation-menu";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setTheme, theme } = useTheme();

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") {
      // ไม่มี session → ไม่ต้อง fetch และเคลียร์ state
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const data = await getCurrentUser();
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      }
    };

    fetchUser();
  }, [status]);

  return (
    <nav className="border-b">
      <div className="container mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-lg font-bold">
              <div className="flex items-center space-x-4">
                {appBrand.logo && (
                  <Image
                    src={appBrand.logo}
                    alt={appBrand.name}
                    width={32}
                    height={32}
                  />
                )}
                {appBrand.name && <div>{appBrand.name}</div>}
              </div>
            </Link>
            {/* Desktop Navigation Menu */}
            {user && (
              <NavigationMenu className="hidden sm:flex">
                <NavigationMenuList className="items-center space-x-2">
                  {navbarItems.map((link) => (
                    <NavigationMenuItem key={link.url}>
                      <NavigationMenuLink asChild>
                        <Link href={link.url} className="font-medium">
                          {link.title}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden sm:block">
            {user ? (
              <div className="flex items-center space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    className="select-none hover:border-2"
                  >
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
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        signOut();
                      }}
                    >
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

          {/* Mobile Menu Button + Dropdown (w-full) */}
          <div className="sm:hidden flex items-center space-x-4">
            {user ? (
              <>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.image || ""} />
                  <AvatarFallback>
                    {user.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <DropdownMenu
                  open={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open menu">
                      {isMobileMenuOpen ? (
                        <X className="h-6 w-6" />
                      ) : (
                        <Menu className="h-6 w-6" />
                      )}
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    side="bottom"
                    align="start"
                    sideOffset={12}
                    className="w-[100vw]"
                  >
                    {user && <DropdownMenuLabel>{user.name}</DropdownMenuLabel>}
                    <DropdownMenuSeparator />
                    {/* Primary nav */}
                    {navbarItems.map((link) => (
                      <Link key={link.url} href={link.url}>
                        <DropdownMenuItem key={link.url}>
                          {link.title}
                        </DropdownMenuItem>
                      </Link>
                    ))}

                    <DropdownMenuSeparator />

                    {/* User actions */}
                    <div className="space-y-1">
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
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          signOut();
                        }}
                      >
                        <LogOut />
                        Logout
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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
