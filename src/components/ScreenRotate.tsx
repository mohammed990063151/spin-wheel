"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

const STORAGE = "spin-screen-rot";
const ANGLES = [0, 90, 180, 270] as const;
type Angle = (typeof ANGLES)[number];

function readAngle(): Angle {
  if (typeof window === "undefined") return 0;
  const fromQuery = Number(new URLSearchParams(window.location.search).get("rot"));
  if (ANGLES.includes(fromQuery as Angle)) return fromQuery as Angle;
  const stored = Number(localStorage.getItem(STORAGE));
  return ANGLES.includes(stored as Angle) ? (stored as Angle) : 0;
}

function applyAngle(angle: Angle) {
  const root = document.documentElement;
  root.dataset.rot = String(angle);
  root.classList.toggle("is-rotated", angle !== 0);
}

export default function ScreenRotate() {
  const { t } = useLocale();
  const [angle, setAngle] = useState<Angle>(0);

  useLayoutEffect(() => {
    const next = readAngle();
    setAngle(next);
    applyAngle(next);
    return () => {
      delete document.documentElement.dataset.rot;
      document.documentElement.classList.remove("is-rotated");
    };
  }, []);

  const cycle = useCallback(() => {
    setAngle((current) => {
      const next = ANGLES[(ANGLES.indexOf(current) + 1) % ANGLES.length];
      localStorage.setItem(STORAGE, String(next));
      applyAngle(next);
      return next;
    });
  }, []);

  return (
    <div className="kiosk-tools">
      <button
        type="button"
        className="kiosk-rotate"
        onClick={cycle}
        aria-label={t("kiosk.rotate")}
        title={t("kiosk.rotate")}
      >
        <span aria-hidden>⟳</span>
        <strong>{angle}°</strong>
      </button>
    </div>
  );
}
