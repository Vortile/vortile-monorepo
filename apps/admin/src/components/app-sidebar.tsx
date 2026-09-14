"use client";

import * as React from "react";
import {
  IconChefHat,
  IconToolsKitchen2,
  IconDeviceMobile,
  IconBrandWhatsapp,
  IconTruck,
  IconSettings,
  IconFlame,
  IconCash,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { title: "Esteira de Pedidos", url: "/", icon: IconChefHat },
    { title: "WhatsApp da Loja", url: "/whatsapp", icon: IconBrandWhatsapp, badge: "IA Gemini" },
    { title: "Gestão do Cardápio", url: "/cardapio", icon: IconToolsKitchen2 },
    { title: "Caixa do Turno", url: "/caixa", icon: IconCash, badge: "Aberto" },
    ...(isAdmin
      ? [
          { title: "Gestão de Usuários", url: "/usuarios", icon: IconUsers, badge: "Admin" },
          { title: "Integração iFood", url: "/ifood", icon: IconTruck, badge: "Hub" },
          { title: "Configurações", url: "/configuracoes", icon: IconSettings },
        ]
      : []),
    {
      title: "Cardápio Web (PWA)",
      url: process.env.NEXT_PUBLIC_DELIVERY_URL || "/delivery",
      icon: IconDeviceMobile,
      badge: "Abrir ↗",
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-3 border-b border-stone-200/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-100 transition-all"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20 shrink-0">
                <IconFlame className="size-5" />
              </div>
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-sm font-bold text-stone-900 tracking-tight truncate">
                  Vortile Delivery
                </span>
                <span className="text-[11px] font-medium text-stone-500 truncate">
                  {isAdmin ? "Modo Administrador" : "Modo Operador"}
                </span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-stone-200/60">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
