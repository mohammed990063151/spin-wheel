"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import SiteHeader from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";
import type { AffProduct, AffProductCategory } from "@/lib/aff";
import { isValidPhone, normalizePhone, toAsciiDigits } from "@/lib/phone";

type ClientType = "individuals" | "companies" | "";
type Entity = "ehg" | "place" | "treeline" | "";
type Region = "" | "central" | "eastern" | "western" | "southern" | "northern";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  region: "" as Region,
  clientType: "" as ClientType,
  entity: "" as Entity,
  notes: "",
};

export default function ContactDesk() {
  const { locale, t } = useLocale();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shake, setShake] = useState(false);
  const [joinQr, setJoinQr] = useState("");
  const [joinUrl, setJoinUrl] = useState("");

  const [catalogOpen, setCatalogOpen] = useState(false);
  const [products, setProducts] = useState<AffProduct[]>([]);
  const [categories, setCategories] = useState<AffProductCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AffProduct | null>(null);

  useEffect(() => {
    const origin =
      process.env.NEXT_PUBLIC_SHARE_ORIGIN?.replace(/\/$/, "") || window.location.origin;
    const url = `${origin}/join`;
    setJoinUrl(url);
    void QRCode.toDataURL(url, {
      width: 420,
      margin: 1,
      color: { dark: "#333333", light: "#f7f6f2" },
      errorCorrectionLevel: "M",
    }).then(setJoinQr);
  }, []);

  const patch = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    if (!name) return flashError(t("auth.nameRequired"));
    if (!isValidPhone(phone)) return flashError(t("auth.phoneInvalid"));
    if (!form.clientType) return flashError(t("contact.typeRequired"));
    if (!form.entity) return flashError(t("contact.entityRequired"));

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
          region: form.region,
          clientType: form.clientType,
          entity: form.entity,
          source: "desk",
          notes: form.notes.trim(),
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

  const loadCatalog = async () => {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const params = new URLSearchParams({ per_page: "48" });
      if (activeCategory) params.set("main_category", String(activeCategory));
      if (search.trim()) params.set("q", search.trim());

      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/products?${params}`),
        categories.length ? Promise.resolve(null) : fetch("/api/products?categories=1"),
      ]);

      const productsJson = (await productsRes.json()) as {
        ok?: boolean;
        data?: AffProduct[];
        meta?: { total: number };
      };
      if (!productsJson.ok) {
        setCatalogError(t("contact.catalogError"));
        setProducts([]);
        return;
      }
      setProducts(productsJson.data ?? []);
      setCatalogTotal(productsJson.meta?.total ?? productsJson.data?.length ?? 0);

      if (categoriesRes) {
        const categoriesJson = (await categoriesRes.json()) as {
          ok?: boolean;
          data?: AffProductCategory[];
        };
        if (categoriesJson.ok) setCategories(categoriesJson.data ?? []);
      }
    } catch {
      setCatalogError(t("contact.catalogError"));
      setProducts([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (!catalogOpen) return;
    const timeout = window.setTimeout(() => {
      void loadCatalog();
    }, 220);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, search, catalogOpen]);

  const productTitle = useMemo(
    () => (product: AffProduct) =>
      locale === "en" ? product.enname || product.arname : product.arname || product.enname,
    [locale],
  );

  return (
    <main className="studio-page contact-page">
      <div className="bg-atmosphere" aria-hidden>
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
        <div className="bg-grain" />
      </div>

      <SiteHeader active="contact" />

      <section className="contact-shell">
        <div className="contact-intro">
          <p className="studio-kicker">{t("contact.kicker")}</p>
          <h1>{t("contact.title")}</h1>
          <p className="studio-lead">{t("contact.lead")}</p>
          <div className="contact-intro-actions">
            <button type="button" className="cta-btn contact-catalog-launch" onClick={() => setCatalogOpen(true)}>
              {t("contact.catalogBtn")}
            </button>
            <a className="ghost-btn" href="/join">
              {t("contact.joinLink")}
            </a>
          </div>

          <div className="contact-qr-panel">
            <div>
              <p className="studio-kicker">{t("contact.qrTitle")}</p>
              <p className="contact-qr-lead">{t("contact.qrLead")}</p>
            </div>
            {joinQr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="contact-qr-image" src={joinQr} alt={t("contact.qrTitle")} />
            ) : (
              <div className="contact-qr-image is-empty" />
            )}
            <p className="contact-qr-url" dir="ltr">
              {joinUrl}
            </p>
          </div>
        </div>

        <form className={`form-panel contact-form ${shake ? "shake" : ""}`} onSubmit={submit}>
          <div className="contact-grid">
            <div className="form-field">
              <label htmlFor="contact-name">{t("contact.name")} *</label>
              <input
                id="contact-name"
                autoComplete="name"
                autoFocus
                placeholder={t("contact.namePlaceholder")}
                value={form.name}
                onChange={(e) => patch("name", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="contact-phone">{t("contact.phone")} *</label>
              <input
                id="contact-phone"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                placeholder="05xxxxxxxx"
                value={form.phone}
                onChange={(e) => patch("phone", toAsciiDigits(e.target.value))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="contact-email">{t("contact.email")}</label>
              <input
                id="contact-email"
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder={t("contact.emailPlaceholder")}
                value={form.email}
                onChange={(e) => patch("email", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="contact-region">{t("contact.region")}</label>
              <select
                id="contact-region"
                value={form.region}
                onChange={(e) => patch("region", e.target.value as Region)}
              >
                <option value="">{t("contact.regionSelect")}</option>
                <option value="central">{t("contact.regionCentral")}</option>
                <option value="eastern">{t("contact.regionEastern")}</option>
                <option value="western">{t("contact.regionWestern")}</option>
                <option value="southern">{t("contact.regionSouthern")}</option>
                <option value="northern">{t("contact.regionNorthern")}</option>
              </select>
            </div>
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

          <div className="form-field">
            <label htmlFor="contact-notes">{t("contact.notes")}</label>
            <textarea
              id="contact-notes"
              rows={3}
              placeholder={t("contact.notesPlaceholder")}
              value={form.notes}
              onChange={(e) => patch("notes", e.target.value)}
            />
          </div>

          {error && <p className="field-error">{error}</p>}
          {success && <p className="contact-success">{t("contact.success")}</p>}

          <div className="contact-actions">
            <button type="submit" className="cta-btn" disabled={saving}>
              {saving ? t("contact.saving") : t("contact.submit")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={saving}
              onClick={() => {
                setForm(emptyForm);
                setError("");
                setSuccess(false);
              }}
            >
              {t("contact.reset")}
            </button>
          </div>
        </form>
      </section>

      {catalogOpen && (
        <div className="catalog-overlay" role="dialog" aria-modal="true" aria-labelledby="catalog-title">
          <div className="catalog-stage">
            <header className="catalog-header">
              <div>
                <p className="studio-kicker">PLACE ATELIER</p>
                <h2 id="catalog-title">{t("contact.catalogTitle")}</h2>
                <p className="catalog-lead">{t("contact.catalogLead")}</p>
              </div>
              <button type="button" className="ghost-btn" onClick={() => setCatalogOpen(false)}>
                {t("contact.catalogClose")}
              </button>
            </header>

            <div className="catalog-toolbar">
              <input
                className="catalog-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("contact.catalogSearch")}
              />
              <span className="catalog-count">{t("contact.catalogCount", { n: catalogTotal })}</span>
            </div>

            <div className="catalog-filters">
              <button
                type="button"
                className={`catalog-filter ${activeCategory == null ? "is-on" : ""}`}
                onClick={() => setActiveCategory(null)}
              >
                {t("contact.catalogAll")}
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`catalog-filter ${activeCategory === category.id ? "is-on" : ""}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {locale === "en" ? category.enname || category.arname : category.arname || category.enname}
                </button>
              ))}
            </div>

            {catalogLoading ? (
              <p className="catalog-status">{t("contact.catalogLoading")}</p>
            ) : catalogError ? (
              <p className="field-error">{catalogError}</p>
            ) : products.length === 0 ? (
              <p className="catalog-status">{t("contact.catalogEmpty")}</p>
            ) : (
              <div className="catalog-masonry">
                {products.map((product, index) => {
                  const image = product.photo_url || product.photo_alt_url || product.gallery?.[0]?.url || "";
                  const featured = index % 7 === 0;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      className={`catalog-tile ${featured ? "is-featured" : ""}`}
                      style={{ animationDelay: `${Math.min(index, 16) * 55}ms` }}
                      onClick={() => setSelected(product)}
                    >
                      <div className="catalog-tile-media">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={productTitle(product)} loading="lazy" decoding="async" />
                        ) : (
                          <div className="catalog-card-fallback" />
                        )}
                        <div className="catalog-tile-shade" aria-hidden />
                        {product.new_arrivale ? (
                          <span className="catalog-badge">{t("contact.catalogNew")}</span>
                        ) : null}
                      </div>
                      <div className="catalog-tile-copy">
                        <h3>{productTitle(product)}</h3>
                        {product.price != null ? (
                          <strong>
                            {t("contact.catalogPrice", {
                              value: Number(product.price).toLocaleString(
                                locale === "ar" ? "ar-SA" : "en-US",
                              ),
                            })}
                          </strong>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div className="catalog-detail" role="dialog" aria-modal="true">
          <button
            type="button"
            className="catalog-detail-backdrop"
            aria-label="close"
            onClick={() => setSelected(null)}
          />
          <div className="catalog-detail-card catalog-detail-card-wide">
            <div className="catalog-detail-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.photo_url || selected.photo_alt_url || selected.gallery?.[0]?.url || ""}
                alt={productTitle(selected)}
              />
            </div>
            <div className="catalog-detail-copy">
              <p className="studio-kicker">PLACE</p>
              <h3>{productTitle(selected)}</h3>
              <p>
                {locale === "en"
                  ? selected.enshortdesc || selected.arshortdesc || ""
                  : selected.arshortdesc || selected.enshortdesc || ""}
              </p>
              {selected.price != null && (
                <strong className="catalog-detail-price">
                  {t("contact.catalogPrice", {
                    value: Number(selected.price).toLocaleString(locale === "ar" ? "ar-SA" : "en-US"),
                  })}
                </strong>
              )}
              <button type="button" className="ghost-btn" onClick={() => setSelected(null)}>
                {t("contact.catalogClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
