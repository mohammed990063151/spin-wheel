"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function LangSwitch() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="lang-switch" role="group" aria-label={t("header.language")}>
      <button
        type="button"
        className={locale === "ar" ? "is-on" : ""}
        lang="ar"
        aria-pressed={locale === "ar"}
        onClick={() => setLocale("ar")}
      >
        {t("header.ar")}
      </button>
      <button
        type="button"
        className={locale === "en" ? "is-on" : ""}
        lang="en"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        {t("header.en")}
      </button>
    </div>
  );
}
