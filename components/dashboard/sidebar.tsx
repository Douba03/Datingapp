"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Flag,
  FileText,
  DollarSign,
  ToggleLeft,
  FileCheck,
  Shield,
  Headphones,
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Reports", href: "/dashboard/reports", icon: Flag },
  { name: "Content", href: "/dashboard/content", icon: FileText },
  { name: "Support", href: "/dashboard/support", icon: Headphones },
  { name: "Revenue", href: "/dashboard/revenue", icon: DollarSign },
  { name: "Feature Flags", href: "/dashboard/flags", icon: ToggleLeft },
  { name: "Audit Log", href: "/dashboard/audit", icon: FileCheck },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Admin</h1>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Admin Dashboard v1.0
        </p>
      </div>
    </div>
  );
}

