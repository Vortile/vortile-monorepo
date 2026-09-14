import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Boas-vindas à Vortile Delivery | Configuração Rápida",
  description: "Configure sua loja e aprenda como o Copilot com IA gerencia seus pedidos e cardápio.",
};

const OnboardingLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 selection:bg-orange-500 selection:text-white flex flex-col">
      {children}
    </div>
  );
};

export default OnboardingLayout;
