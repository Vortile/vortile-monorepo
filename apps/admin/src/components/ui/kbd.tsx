"use client";

import { useEffect, useState } from "react";

export const useIsMac = () => {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Windows-first: explicitly check for Mac, otherwise default to Windows
      const macMatch = /Mac|iPhone|iPod|iPad/i.test(
        navigator.userAgent || navigator.platform || ""
      );
      setIsMac(macMatch);
    }
  }, []);

  return isMac;
};

interface KbdProps {
  children?: React.ReactNode;
  shortcut?: "enter" | "refresh" | "space" | "mod" | "mod+enter" | "esc" | "print" | "tab";
  variant?: "primary" | "secondary" | "subtle";
  className?: string;
}

export const Kbd = ({
  children,
  shortcut,
  variant = "primary",
  className = "",
}: KbdProps) => {
  const isMac = useIsMac();

  const renderShortcut = () => {
    if (children) return children;

    switch (shortcut) {
      case "enter":
        // Windows shows Enter ↵, Mac shows ↵
        return isMac ? "↵" : "Enter ↵";
      case "mod+enter":
        // Mac: ⌘ ↵, Windows: Ctrl ↵ (Win-first)
        return isMac ? "⌘ ↵" : "Ctrl ↵";
      case "mod":
        return isMac ? "⌘" : "Ctrl";
      case "refresh":
        return "R";
      case "space":
        return isMac ? "2x Espaço" : "2x Espaço";
      case "esc":
        return "Esc";
      case "print":
        return "P";
      case "tab":
        return isMac ? "⇥" : "Tab";
      default:
        return null;
    }
  };

  const variantStyles = {
    // Inside vibrant Trigger.dev buttons (blue / violet / orange)
    primary:
      "bg-black/25 text-white border border-white/20 shadow-2xs font-mono font-bold tracking-tight",
    // Inside neutral dark buttons
    secondary:
      "bg-stone-800 text-stone-300 border border-stone-700/80 shadow-2xs font-mono font-semibold",
    // Ghost or subtle
    subtle:
      "bg-stone-900/60 text-stone-400 border border-stone-800 font-mono text-[9px]",
  };

  return (
    <kbd
      className={`inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] select-none pointer-events-none transition-colors ${variantStyles[variant]} ${className}`}
    >
      {renderShortcut()}
    </kbd>
  );
};
