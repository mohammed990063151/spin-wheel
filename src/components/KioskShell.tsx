"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import KioskNav from "@/components/KioskNav";
import KioskQr from "@/components/KioskQr";
import LangSwitch from "@/components/LangSwitch";
import ScreenRotate from "@/components/ScreenRotate";
import { useLocale } from "@/components/LocaleProvider";

const STAND_PATHS = new Set(["/", "/place", "/enala", "/contact", "/sofa", "/join", "/media"]);
const KIOSK_ON = "spin-kiosk-on";

function isStandScreen(pathname: string) {
  return STAND_PATHS.has(pathname);
}

function wantsEnterOverlay(pathname: string) {
  if (!isStandScreen(pathname)) return false;
  if (pathname === "/join" && typeof window !== "undefined") {
    return window.matchMedia("(min-width: 900px)").matches;
  }
  return pathname !== "/join";
}

function isDeskMode() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("kiosk") === "1") {
    sessionStorage.removeItem("spin-desk");
    return false;
  }
  if (params.get("desk") === "1" || params.get("kiosk") === "0") return true;
  return sessionStorage.getItem("spin-desk") === "1";
}

function hasEnteredKiosk() {
  return sessionStorage.getItem(KIOSK_ON) === "1";
}

function isFullscreenNow() {
  return Boolean(
    document.fullscreenElement ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone,
  );
}

async function requestKioskFullscreen() {
  const root = document.documentElement;
  if (document.fullscreenElement) {
    sessionStorage.setItem(KIOSK_ON, "1");
    return true;
  }
  try {
    await root.requestFullscreen({ navigationUI: "hide" });
    sessionStorage.setItem(KIOSK_ON, "1");
    return true;
  } catch {
    try {
      await root.requestFullscreen();
      sessionStorage.setItem(KIOSK_ON, "1");
      return true;
    } catch {
      return false;
    }
  }
}

export default function KioskShell({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname() || "/";
  const stand = isStandScreen(pathname);
  const showChrome = stand && pathname !== "/join";
  const [desk, setDesk] = useState(false);
  const [locked, setLocked] = useState(false);

  const sync = useCallback(() => {
    if (!stand || isDeskMode()) {
      setDesk(isDeskMode());
      setLocked(false);
      document.documentElement.classList.remove("kiosk-mode");
      document.documentElement.classList.toggle("has-kiosk-nav", stand && pathname !== "/join");
      return;
    }
    document.documentElement.classList.toggle("has-kiosk-nav", stand && pathname !== "/join");
    document.documentElement.classList.add("kiosk-mode");
    const needOverlay = wantsEnterOverlay(pathname) && !isFullscreenNow() && !hasEnteredKiosk();
    setLocked(needOverlay);
  }, [stand, pathname]);

  useEffect(() => {
    if (isDeskMode()) {
      sessionStorage.setItem("spin-desk", "1");
      setDesk(true);
      setLocked(false);
      document.documentElement.classList.remove("kiosk-mode");
      document.documentElement.classList.toggle("has-kiosk-nav", stand && pathname !== "/join");
      return;
    }
    if (!stand) {
      setLocked(false);
      document.documentElement.classList.remove("kiosk-mode");
      document.documentElement.classList.remove("has-kiosk-nav");
      return;
    }

    sync();

    const onChange = () => sync();
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("resize", onChange);

    const restoreFullscreen = () => {
      if (isDeskMode() || isFullscreenNow()) return;
      if (!hasEnteredKiosk() && !wantsEnterOverlay(pathname)) return;
      void requestKioskFullscreen().then(sync);
    };
    window.addEventListener("pointerdown", restoreFullscreen, true);

    const preventMenu = (event: Event) => event.preventDefault();
    const preventKeys = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const block =
        event.key === "F11" ||
        event.key === "F5" ||
        event.key === "Escape" ||
        ((event.ctrlKey || event.metaKey) && ["t", "n", "w", "r", "l", "p"].includes(key)) ||
        (event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key));
      if (!block) return;
      event.preventDefault();
      if (event.key === "Escape") void requestKioskFullscreen().then(sync);
    };

    document.addEventListener("contextmenu", preventMenu);
    document.addEventListener("dragstart", preventMenu);
    window.addEventListener("keydown", preventKeys);

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("pointerdown", restoreFullscreen, true);
      document.removeEventListener("contextmenu", preventMenu);
      document.removeEventListener("dragstart", preventMenu);
      window.removeEventListener("keydown", preventKeys);
    };
  }, [stand, pathname, sync]);

  if (!stand) return <>{children}</>;

  return (
    <div className="kiosk-stage">
      {children}
      <ScreenRotate />
      {showChrome ? (
        <>
          <div className="kiosk-lang">
            <LangSwitch />
          </div>
          <KioskQr />
          <KioskNav />
        </>
      ) : null}
      {!desk && locked ? (
        <button
          type="button"
          className="kiosk-enter"
          onClick={() =>
            void requestKioskFullscreen().then((ok) => {
              if (!ok) setLocked(false);
              else sync();
            })
          }
        >
          <span>{t("kiosk.enter")}</span>
        </button>
      ) : null}
    </div>
  );
}
