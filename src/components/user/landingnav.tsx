"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "@/utils/types";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, Menu, X } from "lucide-react";
import Image from "next/image";
import { appBrand, menuItems } from "@/utils/settings";
import { signOut } from "next-auth/react";
import { getCurrentUser } from "@/utils/apiuser";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setTheme, theme } = useTheme();

  const fetchUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" }
  ];

  return (
    <nav className="border-b">
      <div className="container mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
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

          {/* Desktop Navigation Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="text-gray-700 hover:text-orange-500 transition-colors duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:block">
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            {user && (
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.image || ""} />
                <AvatarFallback>
                  {user.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-orange-500 transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {user ? (
                <div className="border-t pt-4 mt-4 space-y-2">
                  {menuItems
                    .filter((item) => {
                      if (item.role === "user") return true;
                      if (item.role === "admin" && user.role === "ADMIN") return true;
                      return false;
                    })
                    .map((item) => (
                      <Link key={item.href} href={item.href}>
                        <div className="flex items-center gap-2 py-2 text-gray-700 hover:text-orange-500">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    ))}
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex items-center gap-2 py-2 text-gray-700 hover:text-orange-500 w-full text-left"
                  >
                    <span className="relative flex h-[1.2rem] w-[1.2rem]">
                      <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </span>
                    <span>{theme === "dark" ? "Light" : "Dark"} mode</span>
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 py-2 text-red-600 hover:text-red-700 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="border-t pt-4 mt-4">
                  <Link href="/sign-in">
                    <Button size="lg" className="w-full">Log in</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}