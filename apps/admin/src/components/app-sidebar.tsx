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

const navMain = [
  { title: "Esteira de Pedidos", url: "/", icon: IconChefHat },
  { title: "WhatsApp da Loja", url: "/whatsapp", icon: IconBrandWhatsapp, badge: "IA Gemini" },
  { title: "Gestão do Cardápio", url: "/cardapio", icon: IconToolsKitchen2 },
  { title: "Integração iFood", url: "/ifood", icon: IconTruck, badge: "Hub" },
  { title: "Configurações", url: "/configuracoes", icon: IconSettings },
  { title: "Cardápio Web (PWA)", url: "/delivery", icon: IconDeviceMobile, badge: "Abrir ↗" },
];

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => (
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
                Vorti Cozinha
              </span>
              <span className="text-[11px] font-medium text-stone-500 truncate">
                Marmitex & Delivery
              </span>
            </div>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent className="p-2">
      <NavMain items={navMain} />
    </SidebarContent>

    <SidebarFooter className="p-2 border-t border-stone-200/60">
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
);
