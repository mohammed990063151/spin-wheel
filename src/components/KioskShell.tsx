"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import KioskNav from "@/components/KioskNav";
import KioskQr from "@/components/KioskQr";
import LangSwitch from "@/components/LangSwitch";
import ScreenRotate from "@/components/ScreenRotate";
import { useLocale } from "@/components/LocaleProvider";

const STAND_PATHS = new Set(["/", "/place", "/enala", "/contact", "/sofa", "/join", "/media"]);
const KIOSK_ON = "spin-kiosk-on";
const KIOSK_PAUSE = "spin-kiosk-pause";
const ROT_SAVE = "spin-screen-rot-saved";
const STAFF_PIN = "0000";

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

function isKioskPaused() {
  return sessionStorage.getItem(KIOSK_PAUSE) === "1";
}

function isFullscreenNow() {
  return Boolean(
    document.fullscreenElement ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone,
  );
}

function isUnlockControl(target: EventTarget | null) {
  return Boolean((target as HTMLElement | null)?.closest(".kiosk-unlock-dot, .kiosk-pin"));
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

async function restoreNormalScreen() {
  sessionStorage.setItem(KIOSK_PAUSE, "1");
  sessionStorage.setItem(ROT_SAVE, document.documentElement.dataset.rot || "0");
  sessionStorage.removeItem("spin-desk");
  localStorage.setItem("spin-screen-rot", "0");
  document.documentElement.dataset.rot = "0";
  document.documentElement.classList.remove("is-rotated", "kiosk-mode");
  window.dispatchEvent(new Event("spin-unlock"));
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }
}

function resumeKioskScreen() {
  const saved = sessionStorage.getItem(ROT_SAVE);
  sessionStorage.removeItem(KIOSK_PAUSE);
  sessionStorage.removeItem(ROT_SAVE);
  if (saved && saved !== "0") {
    localStorage.setItem("spin-screen-rot", saved);
    window.dispatchEvent(new Event("spin-resume"));
  }
  sessionStorage.setItem(KIOSK_ON, "1");
  document.documentElement.classList.add("kiosk-mode");
}

export default function KioskShell({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname() || "/";
  const stand = isStandScreen(pathname);
  const showChrome = stand && pathname !== "/join";
  const pinRef = useRef<HTMLInputElement>(null);
  const [desk, setDesk] = useState(false);
  const [paused, setPaused] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const staffOff = desk || paused;

  const sync = useCallback(() => {
    const deskNow = isDeskMode();
    const pausedNow = isKioskPaused();
    setDesk(deskNow);
    setPaused(pausedNow);
    if (!stand || deskNow || pausedNow) {
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

  const openPin = useCallback(() => {
    setPin("");
    setPinError(false);
    setPinOpen(true);
    window.setTimeout(() => pinRef.current?.focus(), 40);
  }, []);

  const resumeKiosk = useCallback(() => {
    resumeKioskScreen();
    setPaused(false);
    setDesk(false);
    setLocked(false);
    void requestKioskFullscreen().then((ok) => {
      if (!ok) {
        sessionStorage.removeItem(KIOSK_ON);
        setLocked(wantsEnterOverlay(pathname));
      }
      sync();
    });
  }, [pathname, sync]);

  const unlock = useCallback(async () => {
    await restoreNormalScreen();
    setPinOpen(false);
    setPin("");
    setPinError(false);
    setPaused(true);
    setDesk(false);
    setLocked(false);
  }, []);

  const checkPin = useCallback(
    (event?: FormEvent) => {
      event?.preventDefault();
      if (pin.trim() !== STAFF_PIN) {
        setPinError(true);
        setPin("");
        pinRef.current?.focus();
        return;
      }
      void unlock();
    },
    [pin, unlock],
  );

  useEffect(() => {
    if (isDeskMode()) {
      sessionStorage.setItem("spin-desk", "1");
      setDesk(true);
      setPaused(false);
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

    const onPointerDown = (event: Event) => {
      if (isUnlockControl(event.target) || isDeskMode()) return;
      if (isKioskPaused()) {
        resumeKiosk();
        return;
      }
      if (isFullscreenNow() || pinOpen) return;
      if (!hasEnteredKiosk() && !wantsEnterOverlay(pathname)) return;
      void requestKioskFullscreen().then(sync);
    };
    window.addEventListener("pointerdown", onPointerDown, true);

    const preventMenu = (event: Event) => event.preventDefault();
    const preventKeys = (event: KeyboardEvent) => {
      if (isDeskMode() || isKioskPaused()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (pinOpen) {
          setPinOpen(false);
          setPin("");
          setPinError(false);
          return;
        }
        openPin();
        return;
      }
      const key = event.key.toLowerCase();
      const block =
        event.key === "F11" ||
        event.key === "F5" ||
        ((event.ctrlKey || event.metaKey) && ["t", "n", "w", "r", "l", "p"].includes(key)) ||
        (event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key));
      if (!block) return;
      event.preventDefault();
    };

    document.addEventListener("contextmenu", preventMenu);
    document.addEventListener("dragstart", preventMenu);
    window.addEventListener("keydown", preventKeys);

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("contextmenu", preventMenu);
      document.removeEventListener("dragstart", preventMenu);
      window.removeEventListener("keydown", preventKeys);
    };
  }, [stand, pathname, sync, pinOpen, openPin, resumeKiosk]);

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
      {!staffOff ? (
        <button type="button" className="kiosk-unlock-dot" aria-label={t("kiosk.unlock")} onClick={openPin} />
      ) : null}
      {pinOpen ? (
        <form className="kiosk-pin" onSubmit={checkPin}>
          <div className="kiosk-pin-card">
            <p>{t("kiosk.pin")}</p>
            <input
              ref={pinRef}
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              onChange={(event) => {
                setPin(event.target.value.replace(/\D/g, "").slice(0, 4));
                setPinError(false);
              }}
            />
            {pinError ? <span className="kiosk-pin-error">{t("kiosk.pinError")}</span> : null}
            <button type="submit">{t("kiosk.unlock")}</button>
          </div>
        </form>
      ) : null}
      {!staffOff && locked ? (
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
