import { User as UserIcon, Settings, Lock } from "lucide-react";

export const menuItems = [
  {
    label: "Profile",
    href: "/profile",
    icon: <UserIcon className="w-4 h-4" />,
    role: "user",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="w-4 h-4" />,
    role: "user",
  },
  {
    label: "Admin Panel",
    href: "/admin",
    icon: <Lock className="w-4 h-4" />,
    role: "admin",
  }
];

export const signInRedirect = "/dashboard";