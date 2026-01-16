"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@/utils/types";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, Menu } from "lucide-react";
import Image from "next/image";
import { appBrand, menuItems, navbarItems } from "@/utils/settings";
import { signOut, useSession } from "next-auth/react";
import { getCurrentUser } from "@/utils/apiuser";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/utils/function";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const { setTheme, theme } = useTheme();
  const { t } = useLanguage();
  const { status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md shadow-sm supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center px-4 sm:px-8 mx-auto justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            {appBrand.logo && (
              <Image 
                src={appBrand.logo} 
                alt={appBrand.name} 
                width={0} 
                height={0} 
                sizes="100vw" 
                className="h-9 w-auto object-contain" 
              />
            )}
            <span className="font-bold text-xl tracking-tight">
              {appBrand.name}
            </span>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {navbarItems.map((link) => (
                <Link
                  key={link.url}
                  href={link.url}
                  className="px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-foreground/60 rounded-md"
                >
                  {t(link.title)}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <LanguageSwitcher />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="select-none hover:border-2">
                    <button className="rounded-full outline-none">
                      <UserAvatar user={user} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2">
                    <DropdownMenuLabel className="font-normal p-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">@{user.username}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="flex flex-col gap-1">
                      {menuItems
                        .filter((item) => {
                          if (item.role === "user") return true;
                          if (item.role === "admin" && user.role === "ADMIN") return true;
                          return false;
                        })
                        .map((item) => (
                          <DropdownMenuItem key={item.href} asChild className="cursor-pointer rounded-md">
                            <Link href={item.href} className="flex items-center gap-2 w-full">
                              {item.icon}
                              <span>{item.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="cursor-pointer rounded-md"
                    >
                      <span className="flex items-center gap-2 w-full">
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        <span>{theme === "dark" ? "Light" : "Dark"} mode</span>
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer rounded-md"
                      onClick={() => signOut()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t("navbar.logout")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/sign-in">
                <Button className="rounded-full px-6 shadow-sm hover:shadow-md transition-all">Log in</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu (Sheet) */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-muted/50">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 border-l-muted">
              <SheetHeader className="p-6 text-left border-b bg-muted/5">
                <SheetTitle className="flex items-center gap-3">
                  {appBrand.logo && (
                    <Image 
                      src={appBrand.logo} 
                      alt="Logo" 
                      width={0} 
                      height={0} 
                      sizes="100vw" 
                      className="h-8 w-auto object-contain" 
                    />
                  )}
                  <span className="font-bold text-xl">{appBrand.name}</span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto">
                {user ? (
                  <div className="flex flex-col py-2">
                    {/* User Profile Card */}
                    <div className="px-6 py-4">
                      <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-border/50">
                        <UserAvatar user={user} className="h-12 w-12 border-2 border-background shadow-sm" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">{user.name}</span>
                          <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="mb-4 opacity-50" />

                    {/* Navigation Links */}
                    <div className="px-3 flex flex-col gap-1">
                      <span className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Menu</span>
                      {navbarItems.map((link) => (
                        <Link
                          key={link.url}
                          href={link.url}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted/60 rounded-xl hover:pl-5 group"
                        >
                          <span className="group-hover:text-primary transition-colors">{t(link.title)}</span>
                        </Link>
                      ))}
                    </div>

                    {/* User Menu Items */}
                    <div className="mt-4 px-3 flex flex-col gap-1">
                      <span className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</span>
                      {menuItems
                        .filter((item) => {
                          if (item.role === "user") return true;
                          if (item.role === "admin" && user.role === "ADMIN") return true;
                          return false;
                        })
                        .map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-muted/60 rounded-xl transition-colors"
                          >
                            <span className="text-muted-foreground group-hover:text-foreground">{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        ))}
                    </div>

                    <Separator className="my-4 opacity-50" />

                    {/* Settings */}
                    <div className="px-3 flex flex-col gap-1">
                      <span className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Settings</span>
                      <div className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/60 rounded-xl transition-colors">
                        <span className="text-sm font-medium">Language</span>
                        <LanguageSwitcher />
                      </div>
                      
                      <div
                        className="flex items-center justify-between px-3 py-2.5 text-sm font-medium cursor-pointer hover:bg-muted/60 rounded-xl transition-colors"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      >
                        <span>Theme</span>
                        <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                          {theme === "dark" ? (
                            <>
                              <Moon className="h-3 w-3" />
                              <span className="text-xs">Dark</span>
                            </>
                          ) : (
                            <>
                              <Sun className="h-3 w-3" />
                              <span className="text-xs">Light</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col p-6 gap-6">
                     <div className="flex flex-col gap-4 p-6 bg-muted/30 rounded-2xl border border-border/50 text-center">
                        <div className="mx-auto bg-background p-3 rounded-full shadow-sm">
                          <UserAvatar user={null} className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold">Welcome to {appBrand.name}</h3>
                          <p className="text-sm text-muted-foreground">Sign in to access your account</p>
                        </div>
                        <Link href="/sign-in" onClick={() => setIsOpen(false)} className="w-full">
                          <Button className="w-full rounded-xl shadow-sm" size="lg">Log in / Sign up</Button>
                        </Link>
                     </div>
                     
                     <Separator />

                     <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-2 py-3 text-sm font-medium">
                          <span>Language</span>
                          <LanguageSwitcher />
                        </div>
                     </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              {user && (
                <div className="p-6 border-t bg-muted/5">
                  <Button
                    variant="destructive"
                    className="w-full gap-2 rounded-xl shadow-sm hover:bg-destructive/90"
                    size="lg"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("navbar.logout")}
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
