"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const pageLabels: Record<string, string> = {
  "/": "Esteira de Pedidos em Tempo Real",
  "/whatsapp": "WhatsApp da Loja (Operacional & Atendimento IA)",
  "/assistente-ia": "WhatsApp da Loja",
  "/cardapio": "Gestão do Cardápio & Estoque",
  "/ifood": "Hub de Integração iFood",
  "/configuracoes": "Configurações do Restaurante",
  "/delivery": "Cardápio Web do Cliente (PWA)",
};

export const SiteHeader = () => {
  const pathname = usePathname();
  const label = pageLabels[pathname] ?? "Painel";
  const isHome = pathname === "/";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-stone-200/80 bg-white/80 backdrop-blur-md px-4 transition-[width,height] ease-linear">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {!isHome && (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Cozinha</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-stone-900 text-xs md:text-sm">
                {label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/delivery"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
        >
          <span>Abrir Cardápio Web (Cliente)</span>
          <span className="text-[10px]">↗</span>
        </Link>
      </div>
    </header>
  );
};
