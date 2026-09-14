"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import QRCode from "qrcode";
import { useLocale } from "@/components/LocaleProvider";

export default function KioskQr() {
  const { t } = useLocale();
  const pathname = usePathname() || "/";
  const [src, setSrc] = useState("");

  useEffect(() => {
    const origin =
      process.env.NEXT_PUBLIC_SHARE_ORIGIN?.replace(/\/$/, "") || window.location.origin;
    const url = `${origin}${pathname}`;
    void QRCode.toDataURL(url, {
      width: 160,
      margin: 1,
      color: { dark: "#2a2418", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setSrc);
  }, [pathname]);

  if (!src) return null;

  return (
    <aside className="kiosk-qr" aria-label={t("kiosk.qr")}>
      <img src={src} alt={t("kiosk.qr")} />
    </aside>
  );
}
