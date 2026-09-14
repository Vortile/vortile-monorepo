"use client";

import { useEffect, useRef } from "react";

interface KeyboardShortcutHandlers {
  onEnter?: () => void;
  onRefresh?: () => void;
  onPrint?: () => void;
  onDoubleSpace?: () => void;
  onEscape?: () => void;
  onDigit1?: () => void;
  onDigit2?: () => void;
  onDigit3?: () => void;
  onToggleSound?: () => void;
}

export const useKeyboardShortcuts = ({
  onEnter,
  onRefresh,
  onPrint,
  onDoubleSpace,
  onEscape,
  onDigit1,
  onDigit2,
  onDigit3,
  onToggleSound,
}: KeyboardShortcutHandlers) => {
  const lastSpacePressRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Escape always works, even inside inputs
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // If user is typing in a form or input, don't trigger board shortcuts
      if (isInput) return;

      // 1. Enter: Advance task / continue action
      if (e.key === "Enter" && onEnter) {
        e.preventDefault();
        onEnter();
        return;
      }

      // 2. R: Refresh / retry task (Trigger.dev pattern)
      if ((e.key === "r" || e.key === "R") && onRefresh) {
        e.preventDefault();
        onRefresh();
        return;
      }

      // 3. P: Print receipt
      if ((e.key === "p" || e.key === "P") && onPrint) {
        e.preventDefault();
        onPrint();
        return;
      }

      // 4. S: Toggle sound
      if ((e.key === "s" || e.key === "S") && onToggleSound) {
        e.preventDefault();
        onToggleSound();
        return;
      }

      // 5. 1, 2, 3: Switch columns/tabs
      if (e.key === "1" && onDigit1) {
        e.preventDefault();
        onDigit1();
        return;
      }
      if (e.key === "2" && onDigit2) {
        e.preventDefault();
        onDigit2();
        return;
      }
      if (e.key === "3" && onDigit3) {
        e.preventDefault();
        onDigit3();
        return;
      }

      // 6. Double-tap Space (< 350ms): Kitchen Copilot Voice
      if (e.code === "Space" && onDoubleSpace) {
        const now = Date.now();
        if (now - lastSpacePressRef.current <= 350) {
          e.preventDefault();
          lastSpacePressRef.current = 0;
          onDoubleSpace();
        } else {
          lastSpacePressRef.current = now;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onEnter,
    onRefresh,
    onPrint,
    onDoubleSpace,
    onEscape,
    onDigit1,
    onDigit2,
    onDigit3,
    onToggleSound,
  ]);
};
