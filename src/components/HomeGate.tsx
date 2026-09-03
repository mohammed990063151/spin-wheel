"use client";

import SiteHeader from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";

export default function HomeGate() {
  const { t } = useLocale();

  return (
    <main className="gate">
      <div className="bg-atmosphere" aria-hidden>
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
        <div className="bg-grain" />
      </div>

      <SiteHeader active="home" />

      <section className="gate-intro">
        <p className="gate-kicker">{t("home.kicker")}</p>
        <h1>{t("home.title")}</h1>
        <p>{t("home.lead")}</p>
      </section>

      <section className="gate-cards">
        <a className="gate-banner is-enala" href="/enala">
          <span className="gate-banner-media" aria-hidden>
            <img
              src="/brands/enala-villa.jpg"
              alt=""
              className="gate-banner-photo"
            />
            <span className="gate-banner-shine" />
            <span className="gate-banner-glow" />
          </span>
          <span className="gate-banner-frame" aria-hidden />
          <span className="gate-banner-badge">{t("home.enala.badge")}</span>
          <span className="gate-banner-copy">
            <span className="gate-num">01</span>
            <strong lang="en">Enala</strong>
            <h2>{t("home.enala.title")}</h2>
            <p>{t("home.enala.prizes")}</p>
            <span className="gate-cta">{t("home.enala.cta")}</span>
          </span>
        </a>

        <a className="gate-banner is-place" href="/place">
          <span className="gate-banner-media" aria-hidden>
            <img
              src="/brands/place-lounge.jpg"
              alt=""
              className="gate-banner-photo"
            />
            <span className="gate-banner-shine" />
            <span className="gate-banner-glow" />
          </span>
          <span className="gate-banner-frame" aria-hidden />
          <span className="gate-banner-badge">{t("home.place.badge")}</span>
          <span className="gate-banner-copy">
            <span className="gate-num">02</span>
            <strong lang="en">Place</strong>
            <h2>{t("home.place.title")}</h2>
            <p>{t("home.place.prizes")}</p>
            <span className="gate-cta">{t("home.place.cta")}</span>
          </span>
        </a>
      </section>
    </main>
  );
}
