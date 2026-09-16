"use client";

import { FormEvent, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { isValidPhone, normalizePhone, toAsciiDigits } from "@/lib/phone";
import CitySearchField from "@/components/contact/CitySearchField";
import { useKeyboardSafeField } from "@/lib/use-keyboard-safe-field";

type ClientType = "individuals" | "companies" | "";
type Entity = "ehg" | "place" | "treeline" | "";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  city: "",
  clientType: "" as ClientType,
  entity: "" as Entity,
  companyName: "",
};

export default function JoinDesk() {
  const { locale, t } = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shake, setShake] = useState(false);
  useKeyboardSafeField(formRef);

  const patch = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "clientType" && value !== "companies") next.companyName = "";
      return next;
    });
    setSuccess(false);
    if (error) setError("");
  };

  const flashError = (message: string) => {
    setError(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 420);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    const phone = normalizePhone(form.phone);
    const companyName = form.companyName.trim();
    if (!name) return flashError(t("auth.nameRequired"));
    if (!isValidPhone(phone)) return flashError(t("auth.phoneInvalid"));
    if (!form.clientType) return flashError(t("contact.typeRequired"));
    if (form.clientType === "companies" && !companyName) return flashError(t("contact.companyRequired"));
    if (!form.entity) return flashError(t("contact.entityRequired"));
    if (!form.city) return flashError(t("contact.cityRequired"));

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: form.email.trim(),
          city: form.city,
          clientType: form.clientType,
          companyName,
          entity: form.entity,
          source: "qr",
          locale,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!json.ok) {
        flashError(json.message || t("contact.saveFailed"));
        return;
      }
      setSuccess(true);
      setForm(emptyForm);
    } catch {
      flashError(t("contact.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="join-page">
      <div className="bg-atmosphere" aria-hidden>
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
        <div className="bg-grain" />
      </div>

      <section className="join-shell">
        <p className="studio-kicker">{t("join.kicker")}</p>
        <h1>{t("join.title")}</h1>
        <p className="studio-lead">{t("join.lead")}</p>

        {success ? (
          <div className="join-success form-panel">
            <p className="contact-success">{t("join.success")}</p>
            <button type="button" className="cta-btn" onClick={() => setSuccess(false)}>
              {t("join.again")}
            </button>
          </div>
        ) : (
          <form ref={formRef} className={`form-panel join-form ${shake ? "shake" : ""}`} onSubmit={submit}>
            <div className="form-field">
              <label htmlFor="join-name">{t("contact.name")} *</label>
              <input
                id="join-name"
                autoComplete="name"
                autoFocus
                placeholder={t("contact.namePlaceholder")}
                value={form.name}
                onChange={(e) => patch("name", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="join-phone">{t("contact.phone")} *</label>
              <input
                id="join-phone"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder="05xxxxxxxx"
                value={form.phone}
                onChange={(e) => patch("phone", toAsciiDigits(e.target.value))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="join-email">{t("contact.email")}</label>
              <input
                id="join-email"
                type="email"
                dir="ltr"
                placeholder={t("contact.emailPlaceholder")}
                value={form.email}
                onChange={(e) => patch("email", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="join-city">{t("contact.city")} *</label>
              <CitySearchField id="join-city" value={form.city} onChange={(city) => patch("city", city)} />
            </div>

            <fieldset className="contact-choice">
              <legend>{t("contact.type")} *</legend>
              <div className="contact-choice-row">
                <button
                  type="button"
                  className={`contact-choice-btn ${form.clientType === "individuals" ? "is-on" : ""}`}
                  onClick={() => patch("clientType", "individuals")}
                >
                  {t("contact.typeIndividuals")}
                </button>
                <button
                  type="button"
                  className={`contact-choice-btn ${form.clientType === "companies" ? "is-on" : ""}`}
                  onClick={() => patch("clientType", "companies")}
                >
                  {t("contact.typeCompanies")}
                </button>
              </div>
              {form.clientType === "companies" ? (
                <div className="form-field field-reveal" style={{ marginTop: "0.85rem" }}>
                  <label htmlFor="join-company">{t("contact.company")} *</label>
                  <input
                    id="join-company"
                    autoComplete="organization"
                    placeholder={t("contact.companyPlaceholder")}
                    value={form.companyName}
                    onChange={(e) => patch("companyName", e.target.value)}
                  />
                </div>
              ) : null}
            </fieldset>

            <fieldset className="contact-choice">
              <legend>{t("contact.entity")} *</legend>
              <div className="contact-choice-row is-triple">
                <button
                  type="button"
                  className={`contact-choice-btn ${form.entity === "ehg" ? "is-on" : ""}`}
                  onClick={() => patch("entity", "ehg")}
                >
                  {t("contact.entityEhg")}
                </button>
                <button
                  type="button"
                  className={`contact-choice-btn ${form.entity === "place" ? "is-on" : ""}`}
                  onClick={() => patch("entity", "place")}
                >
                  {t("contact.entityPlace")}
                </button>
                <button
                  type="button"
                  className={`contact-choice-btn ${form.entity === "treeline" ? "is-on" : ""}`}
                  onClick={() => patch("entity", "treeline")}
                >
                  {t("contact.entityTreeline")}
                </button>
              </div>
            </fieldset>

            {error && <p className="field-error">{error}</p>}

            <button type="submit" className="cta-btn" disabled={saving}>
              {saving ? t("contact.saving") : t("join.submit")}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
