"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

const ITEMS = [
  { href: "/", label: "nav.home" },
  { href: "/enala", label: "nav.enala" },
  { href: "/place", label: "nav.place" },
  { href: "/sofa", label: "nav.sofa" },
  { href: "/media", label: "nav.media" },
  { href: "/contact", label: "nav.contact" },
] as const;

export default function KioskNav() {
  const { t } = useLocale();
  const pathname = usePathname() || "/";

  return (
    <nav className="kiosk-nav" aria-label={t("header.nav")}>
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname === item.href ? "is-on" : ""}
          scroll={false}
          prefetch
        >
          {t(item.label)}
        </Link>
      ))}
    </nav>
  );
}
