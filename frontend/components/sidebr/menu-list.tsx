// @ts-nocheck
import { BarChart3, BookOpen, Building2, Calendar, CreditCard, Home, Inbox, Package, Settings, TrendingUp, User, Users } from "lucide-react";

export function getMenuList(role) {
  const ROLES = {
    SUPERADMIN: "superadmin",
    ADMIN: "admin",
    MANAGER: "manager",
    STAFF: "staff",
  };

  const isVisibleForRole = (roles) => roles.includes(role);

  const menuList = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      menues: [],
      visible: isVisibleForRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Organisation",
      url: "/organisation",
      icon: Building2,
      menues: [],
      visible: isVisibleForRole([ROLES.ADMIN]),
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Users",
      url: "/users",
      icon: Users,
      visible: isVisibleForRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER]),
      isBeta: false,
      isComingsoon: false,
      menues: [
        { name: "Office Users", path: "/users", icon: Users },
        { name: "Supplisers", path: "/suppliers", icon: User },
        { name: "Customers", path: "/customers", icon: User },
      ],
    },
    {
      title: "Stock",
      url: "#",
      icon: BookOpen,
      menues: [
        // wherehouse , category and stock menus will be there 
        { name: "Warehouses", path: "/warehouse", icon: Home },
        { name: "Categories", path: "/categories", icon: BookOpen },
        { name: "All Stock", path: "/stock", icon: Inbox },
      ],
      visible: isVisibleForRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER]),
      isBeta: false,
      isComingsoon: false,
    },
    // {
    //   title: "Suppliers",
    //   url: "/suppliers",
    //   icon: User,
    //   menues: [],
    //   visible: isVisibleForRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER]),
    //   isBeta: false,
    //   isComingsoon: false,
    // },
    // {
    //   title: "Customers",
    //   url: "/customers",
    //   icon: User,
    //   menues: [],
    //   visible: isVisibleForRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
    //   isBeta: false,
    //   isComingsoon: false,
    // },
    {
      title: "Sales",
      url: "#",
      icon: BarChart3,
      menues: [
        { name: "New Sale", path: "/sales/new", icon: BarChart3 },
        { name: "All Sales", path: "/sales/all", icon: Inbox },
      ],
      visible: isVisibleForRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Orders",
      url: "#",
      icon: Package,
      menues: [
        { name: "View orders", path: "/purchase-orders", icon: CreditCard },
        { name: "Create Order", path: "/create-order", icon: Inbox },
      ],
      visible: isVisibleForRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF]),
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: Calendar,
      menues: [],
      // visible: isVisibleForRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER]),
      visible: false,
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: TrendingUp,
      menues: [],
      visible: isVisibleForRole([ROLES.SUPERADMIN, ROLES.ADMIN]),
      isBeta: true,
      isComingsoon: false,
    },
    {
      title: "Membserships",
      url: "/memberships",
      icon: CreditCard,
      menues: [
      //   { name: "Plans", path: "/memberships/pricing", icon: CreditCard },
      //   { name: "My Plan", path: "/memberships/my-plan", icon: Inbox },
      ],
      visible: isVisibleForRole([ROLES.SUPERADMIN]),
      isComingsoon: false,
    },
    {
      title: "Pricing",
      url: "/pricing",
      icon: CreditCard,
      menues: [],
      visible: isVisibleForRole([ROLES.ADMIN]),
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      menues: [],
      visible: isVisibleForRole([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.MANAGER]),
      isBeta: false,
      isComingsoon: false,
    },
  ];

  return menuList.filter((item) => item.visible);
}
