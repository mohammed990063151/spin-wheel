"use client";

import { type RefObject, useEffect } from "react";

export function useKeyboardSafeField<T extends HTMLElement>(containerRef: RefObject<T | null>) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || typeof window === "undefined") return;

    const setInset = (px: number) => {
      root.style.setProperty("--kb-inset", `${Math.max(0, Math.round(px))}px`);
      document.documentElement.style.setProperty("--kb-inset", `${Math.max(0, Math.round(px))}px`);
    };

    const keyboardInset = () => {
      const vv = window.visualViewport;
      if (!vv) return 0;
      return Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    };

    const reveal = (el: HTMLElement) => {
      const inset = keyboardInset();
      setInset(inset);
      window.requestAnimationFrame(() => {
        el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      });
    };

    const onFocus = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches("input, textarea, select")) return;
      window.setTimeout(() => reveal(target), 320);
    };

    const onViewport = () => {
      const inset = keyboardInset();
      setInset(inset);
      const active = document.activeElement;
      if (active instanceof HTMLElement && root.contains(active) && active.matches("input, textarea, select")) {
        active.scrollIntoView({ block: "center", inline: "nearest" });
      }
    };

    root.addEventListener("focusin", onFocus);
    window.visualViewport?.addEventListener("resize", onViewport);
    window.visualViewport?.addEventListener("scroll", onViewport);
    window.addEventListener("resize", onViewport);

    return () => {
      root.removeEventListener("focusin", onFocus);
      window.visualViewport?.removeEventListener("resize", onViewport);
      window.visualViewport?.removeEventListener("scroll", onViewport);
      window.removeEventListener("resize", onViewport);
      root.style.removeProperty("--kb-inset");
      document.documentElement.style.removeProperty("--kb-inset");
    };
  }, [containerRef]);
}
