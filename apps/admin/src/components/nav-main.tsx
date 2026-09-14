"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Icon } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon?: Icon;
  badge?: string;
}

export const NavMain = ({ items }: { items: NavItem[] }) => {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-1">
        Menu Principal
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-1">
        {items.map((item) => {
          const isActive =
            item.url === "/"
              ? pathname === "/"
              : pathname.startsWith(item.url);

          const isExternal = item.url.startsWith("http") || item.url === "/delivery";

          return (
            <SidebarMenuItem key={item.title}>
              <Link
                href={item.url}
                target={isExternal && item.url === "/delivery" ? "_blank" : undefined}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? "bg-orange-600 text-white shadow-sm shadow-orange-600/30"
                    : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon && (
                    <item.icon
                      className={`size-4 shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-stone-500 group-hover:text-stone-800"
                      }`}
                    />
                  )}
                  <span className="truncate">{item.title}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};
