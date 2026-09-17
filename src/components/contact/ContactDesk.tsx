"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { useLocale } from "@/components/LocaleProvider";
import type { AffProduct, AffProductCategory } from "@/lib/aff";
import { isValidPhone, normalizePhone, toAsciiDigits } from "@/lib/phone";
import CitySearchField from "@/components/contact/CitySearchField";
import CatalogImage, { CATALOG_DETAIL_SIZES, CATALOG_LIST_SIZES } from "@/components/contact/CatalogImage";
import EnalaCatalog from "@/components/contact/EnalaCatalog";
import { prefetchEnalaCatalog } from "@/components/contact/enala-catalog-cache";
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

  const formRef = useRef<HTMLFormElement>(null);
  const [catalogQr, setCatalogQr] = useState("");
  const [enalaCatalogQr, setEnalaCatalogQr] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [enalaCatalogOpen, setEnalaCatalogOpen] = useState(false);

  useKeyboardSafeField(formRef);
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
    queueMicrotask(() => setJoinUrl(url));
    void QRCode.toDataURL(url, {
      width: 420,
      margin: 1,
      color: { dark: "#333333", light: "#f7f6f2" },
      errorCorrectionLevel: "M",
    }).then(setJoinQr);

    const catalogUrl = `${origin}/contact?catalog=1`;
    void QRCode.toDataURL(catalogUrl, {
      width: 160,
      margin: 1,
      color: { dark: "#2a2418", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setCatalogQr);

    const enalaUrl = `${origin}/contact?catalog=enala`;
    void QRCode.toDataURL(enalaUrl, {
      width: 160,
      margin: 1,
      color: { dark: "#2a2418", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setEnalaCatalogQr);

    const catalogParam = new URLSearchParams(window.location.search).get("catalog");
    queueMicrotask(() => {
      if (catalogParam === "enala") setEnalaCatalogOpen(true);
      else if (catalogParam === "1") setCatalogOpen(true);
    });
    prefetchEnalaCatalog();
  }, []);

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

      <section className="contact-shell">
        <div className="contact-intro">
          <p className="studio-kicker">{t("contact.kicker")}</p>
          <h1>{t("contact.title")}</h1>
          <p className="studio-lead">{t("contact.lead")}</p>
          <div className="contact-intro-actions">
            <button type="button" className="cta-btn contact-catalog-launch" onClick={() => setCatalogOpen(true)}>
              {t("contact.catalogBtn")}
            </button>
            <button
              type="button"
              className="ghost-btn contact-enala-launch"
              onClick={() => setEnalaCatalogOpen(true)}
            >
              {t("contact.enalaCatalogBtn")}
            </button>
            <Link className="ghost-btn" href="/join" prefetch>
              {t("contact.joinLink")}
            </Link>
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

        <form ref={formRef} className={`form-panel contact-form ${shake ? "shake" : ""}`} onSubmit={submit}>
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
              <label htmlFor="contact-city">{t("contact.city")} *</label>
              <CitySearchField id="contact-city" value={form.city} onChange={(city) => patch("city", city)} />
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
            {form.clientType === "companies" ? (
              <div className="form-field field-reveal" style={{ marginTop: "0.85rem" }}>
                <label htmlFor="contact-company">{t("contact.company")} *</label>
                <input
                  id="contact-company"
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

          <div className="form-field contact-notes-field">
            <label htmlFor="contact-notes">{t("contact.notes")}</label>
            <textarea
              id="contact-notes"
              rows={3}
              enterKeyHint="done"
              placeholder={t("contact.notesPlaceholder")}
              value={form.notes}
              onChange={(e) => patch("notes", e.target.value)}
              onFocus={(event) => {
                const field = event.currentTarget;
                window.setTimeout(() => {
                  field.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
                }, 280);
              }}
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
            <div className="catalog-chrome">
              <header className="catalog-header">
                <div>
                  <p className="studio-kicker">PLACE ATELIER</p>
                  <h2 id="catalog-title">{t("contact.catalogTitle")}</h2>
                  <p className="catalog-lead">{t("contact.catalogLead")}</p>
                </div>
                <button type="button" className="ghost-btn catalog-close" onClick={() => setCatalogOpen(false)}>
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
            </div>

            {catalogLoading ? (
              <div className="catalog-masonry" aria-busy="true">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="catalog-tile catalog-skeleton"
                    style={{ animationDelay: `${index * 60}ms` }}
                  />
                ))}
              </div>
            ) : catalogError ? (
              <p className="field-error">{catalogError}</p>
            ) : products.length === 0 ? (
              <p className="catalog-status">{t("contact.catalogEmpty")}</p>
            ) : (
              <div className="catalog-masonry">
                {products.map((product, index) => {
                  const image = product.photo_url || product.photo_alt_url || product.gallery?.[0]?.url || "";
                  return (
                    <button
                      key={product.id}
                      type="button"
                      className="catalog-tile"
                      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
                      onClick={() => setSelected(product)}
                    >
                      <div className="catalog-tile-media">
                        {image ? (
                          <CatalogImage
                            src={image}
                            alt={productTitle(product)}
                            sizes={CATALOG_LIST_SIZES}
                            priority={index < 4}
                            quality={82}
                          />
                        ) : (
                          <div className="catalog-card-fallback" />
                        )}
                        <span className="catalog-tile-shine" aria-hidden />
                        <div className="catalog-tile-shade" aria-hidden />
                        {product.new_arrivale ? (
                          <span className="catalog-badge">{t("contact.catalogNew")}</span>
                        ) : null}
                      </div>
                      <div className="catalog-tile-copy">
                        <h3>{productTitle(product)}</h3>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {catalogQr ? (
            <aside className="catalog-qr" aria-label={t("contact.catalogQr")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={catalogQr} alt={t("contact.catalogQr")} />
            </aside>
          ) : null}
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
              <div className="catalog-detail-photo">
                {selected.photo_url || selected.photo_alt_url || selected.gallery?.[0]?.url ? (
                  <CatalogImage
                    src={selected.photo_url || selected.photo_alt_url || selected.gallery?.[0]?.url || ""}
                    alt={productTitle(selected)}
                    sizes={CATALOG_DETAIL_SIZES}
                    priority
                    quality={90}
                    fit="contain"
                  />
                ) : (
                  <div className="catalog-card-fallback" />
                )}
              </div>
            </div>
            <div className="catalog-detail-copy">
              <p className="studio-kicker">PLACE</p>
              <h3>{productTitle(selected)}</h3>
              <p>
                {locale === "en"
                  ? selected.enshortdesc || selected.arshortdesc || ""
                  : selected.arshortdesc || selected.enshortdesc || ""}
              </p>
              <button type="button" className="ghost-btn" onClick={() => setSelected(null)}>
                {t("contact.catalogClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      <EnalaCatalog open={enalaCatalogOpen} qr={enalaCatalogQr} onClose={() => setEnalaCatalogOpen(false)} />
    </main>
  );
}
