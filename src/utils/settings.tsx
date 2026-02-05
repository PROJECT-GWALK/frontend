import {
  User as UserIcon,
  Settings,
  Lock,
  Users,
  LayoutDashboard,
} from "lucide-react";

export const appBrand = {
  logo: "/gwalk-icon.svg",
  name: "Gallery Walk",
};

export const menuItems = [
  {
    labelKey: "navbar.profile",
    href: "/profile",
    icon: <UserIcon className="w-4 h-4" />,
    role: "user",
  },
  {
    labelKey: "navbar.settings",
    href: "/settings",
    icon: <Settings className="w-4 h-4" />,
    role: "user",
  },
  {
    labelKey: "navbar.adminPanel",
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
    url: "/home",
    titleKey: "navbar.home",
  },
  {
    url: "/event",
    titleKey: "navbar.events",
  },
  {
    url: "/users",
    titleKey: "navbar.users",
  },
];

export const signInRedirect = "/home";

const isThai = typeof window !== "undefined" && localStorage.getItem("language") === "th";

export const timeFormat = isThai ? "th-TH" : "en-US";
export const dateFormat = isThai ? "th-TH" : "en-US";
