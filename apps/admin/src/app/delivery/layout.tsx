import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";

export const viewport: Viewport = {
  themeColor: "#EA580C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Vorti Marmitex & Grelhados | Cardápio Digital & Delivery",
  description: "Peça sua marmitex quentinha e grelhados no capricho. Entrega rápida, montagem personalizada e pagamento facilitado via PIX ou cartão.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vorti Delivery",
  },
  icons: {
    icon: "/vortile-icon.svg",
    apple: "/vortile-icon.svg",
  },
};

const DeliveryLayout = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export default DeliveryLayout;
