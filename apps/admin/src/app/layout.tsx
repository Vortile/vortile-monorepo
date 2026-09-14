import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Vortile Delivery — Gestão & Operações",
  description: "Painel administrativo e esteira de pedidos da Vortile Delivery com integração WhatsApp Gemini MCP.",
};

const RootLayout = async ({ children }: Readonly<{ children: ReactNode }>) => (
  <html lang="pt-BR" className={cn("font-sans dark", geist.variable)}>
    <body className="bg-trigger-canvas text-foreground antialiased selection:bg-vortile selection:text-white">
      <Providers>
        {children}
        <Toaster theme="dark" />
      </Providers>
    </body>
  </html>
);

export default RootLayout;
