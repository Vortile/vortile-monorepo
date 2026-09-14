import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#EA580C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Vorti Delivery — Cardápio Web Online",
  description: "Peça seu prato favorito, marmitex caseiro e bebidas direto no cardápio web oficial com entrega rápida.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="pt-BR" className="bg-stone-50 text-stone-900 antialiased">
      <body className={inter.className}>
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
};

export default RootLayout;
