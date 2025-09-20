import { User as UserIcon, Settings } from "lucide-react";

export const menuItems = [
  {
    label: "Profile",
    href: "/profile",
    icon: <UserIcon className="w-4 h-4" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="w-4 h-4" />,
  },
];