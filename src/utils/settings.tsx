import {
  User as UserIcon,
  Settings,
  Lock,
  Inbox,
  Home,
  Users,
  LayoutDashboard,
} from "lucide-react";

export const appBrand = {
  logo: "/gwalk-icon.svg",
  name: "Gallery Walk",
};

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
  },
];

export const menuItemsAdmin = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: <LayoutDashboard />,
  },
  {
    title: "User Management",
    url: "/admin/usermanagement",
    icon: <Users />,
  },
];

export const navbarItems = [
  {
    url: "/dashboard",
    title: "Dashboard",
  },
  {
    url: "/event",
    title: "Event",
  },
  {
    url: "/users",
    title: "Users",
  },
];

export const signInRedirect = "/dashboard";

const isThai = typeof window !== "undefined" && localStorage.getItem("language") === "th";

export const timeFormat = isThai ? "th-TH" : "en-US";
export const dateFormat = isThai ? "th-TH" : "en-US";