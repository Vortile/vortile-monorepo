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
  "/caixa": "Abertura & Fechamento de Caixa",
  "/usuarios": "Gestão de Usuários & Cargos",
  "/ifood": "Hub de Integração iFood",
  "/configuracoes": "Configurações do Restaurante",
  "/delivery": "Cardápio Web do Cliente (PWA)",
};

export const SiteHeader = () => {
  const pathname = usePathname();
  const label = pageLabels[pathname] ?? "Painel";
  const isHome = pathname === "/";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#1F232B] bg-[#0C0D0E]/80 backdrop-blur-md px-4 transition-[width,height] ease-linear">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-stone-400 hover:text-white" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4 bg-[#1F232B]"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {!isHome && (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/" className="text-stone-400 hover:text-white text-xs">Cozinha</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block text-stone-600" />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-white text-xs md:text-sm">
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
          className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-300 hover:text-white bg-[#14161E] hover:bg-[#1A1D27] border border-[#232734] transition-all"
        >
          <span>Cardápio Web</span>
          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/40 border border-white/10 text-stone-400">
            ↗
          </span>
        </Link>
      </div>
    </header>
  );
};
