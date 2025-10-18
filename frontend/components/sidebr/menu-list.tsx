// @ts-nocheck
import { hasPermission } from "@/libs/utils/check-permission";
import { BarChart3, BookOpen, Building2, Calendar, CreditCard, Home, Inbox, Package, ScanFace, Settings, TrendingUp, User, Users } from "lucide-react";

// getMenuList now accepts optional permissions object to avoid calling hooks at module scope
export function getMenuList(role, permissions = null) {
  const ROLES = {
    SUPERADMIN: "superadmin",
    ADMIN: "admin",
    MANAGER: "manager",
    STAFF: "staff",
  };

  const isVisibleForRole = (roles) => roles.includes(role);
  const isSuper = role === ROLES.SUPERADMIN;

  const menuList = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      menues: [],
      visible: isSuper ,
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Organisation",
      url: "/organisation",
      icon: Building2,
      menues: [],
      visible: isSuper || hasPermission(permissions, 'organization', 'read'),
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Users",
      url: "/users",
      icon: Users,
      visible: isSuper || hasPermission(permissions, 'systemuser', 'read'),
      isBeta: false,
      isComingsoon: false,
      menues: [
        { name: "System Users", path: "/users", icon: Users, visible: isSuper || hasPermission(permissions, 'systemuser', 'read') },
        { name: "Supplisers", path: "/suppliers", icon: User, visible: isSuper || hasPermission(permissions, 'systemuser', 'read') },
        { name: "Customers", path: "/customers", icon: User, visible: isSuper || hasPermission(permissions, 'systemuser', 'read') },
      ],
    },
    {
      title: "Stock",
      url: "#",
      icon: BookOpen,
      menues: [
        // wherehouse , category and stock menus will be there 
        { name: "Warehouses", path: "/warehouse", icon: Home, visible: isSuper || hasPermission(permissions, 'stock', 'read') },
        { name: "Categories", path: "/categories", icon: BookOpen, visible: isSuper || hasPermission(permissions, 'stock', 'read') },
        { name: "All Stock", path: "/stock", icon: Inbox, visible: isSuper || hasPermission(permissions, 'stock', 'read') },
      ],
      visible: isSuper || hasPermission(permissions, 'stock', 'read'),
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Sales",
      url: "#",
      icon: BarChart3,
      menues: [
        { name: "New Sale", path: "/sales/new", icon: BarChart3, visible: isSuper || hasPermission(permissions, 'sales', 'read') },
        { name: "All Sales", path: "/sales/all", icon: Inbox, visible: isSuper || hasPermission(permissions, 'sales', 'read') },
      ],
      visible: isSuper || hasPermission(permissions, 'sales', 'read'),
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Orders",
      url: "#",
      icon: Package,
      menues: [
        { name: "View orders", path: "/purchase-orders", icon: CreditCard, visible: isSuper || hasPermission(permissions, 'purchases', 'read') },
        { name: "Create Order", path: "/create-order", icon: Inbox, visible: isSuper || hasPermission(permissions, 'purchases', 'read') },
      ],
      visible: isSuper || hasPermission(permissions, 'purchases', 'read'),
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: Calendar,
      menues: [],
      // visib,
      visible: isSuper || hasPermission(permissions, 'reports', 'read'),
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: TrendingUp,
      menues: [],
      visible: isSuper || hasPermission(permissions, 'reports', 'read'),
      isBeta: true,
      isComingsoon: false,
    },
    {
      title: "Membserships",
      url: "/memberships",
      icon: CreditCard,
      menues: [],
      visible: isSuper ,
      isComingsoon: false,
    },
    {
      title: "Pricing",
      url: "/pricing",
      icon: CreditCard,
      menues: [],
      visible: isSuper,
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Sessions",
      url: "/sessions",
      icon: ScanFace ,
      menues: [],
      visible: isSuper ||  hasPermission(permissions, 'sessions', 'read'),
      isBeta: false,
      isComingsoon: false,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      menues: [],
      visible: isSuper || hasPermission(permissions, 'settings', 'read'),
      isBeta: false,
      isComingsoon: false,
    },
  ];

  return menuList.filter((item) => item.visible);
}
