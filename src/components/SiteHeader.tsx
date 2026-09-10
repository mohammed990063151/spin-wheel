"use client";

import LangSwitch from "@/components/LangSwitch";
import { useLocale } from "@/components/LocaleProvider";

interface SiteHeaderProps {
  active?: "home" | "sofa" | "guess" | "contact";
}

export default function SiteHeader({ active = "home" }: SiteHeaderProps) {
  const { t } = useLocale();

  return (
    <header className="site-topbar">
      <a className="site-topbar-brand" href="/" lang="en">
        PLACE × ENALA
      </a>
      <nav className="site-topbar-nav" aria-label={t("header.nav")}>
        <a className={`site-topbar-btn ${active === "contact" ? "is-active" : ""}`} href="/contact">
          {t("header.contact")}
        </a>
        <a className={`site-topbar-btn ${active === "sofa" ? "is-active" : ""}`} href="/sofa">
          {t("header.sofa")}
        </a>
        <a className={`site-topbar-btn is-game ${active === "guess" ? "is-active" : ""}`} href="/guess">
          {t("header.guess")}
        </a>
        <LangSwitch />
      </nav>
    </header>
  );
}
