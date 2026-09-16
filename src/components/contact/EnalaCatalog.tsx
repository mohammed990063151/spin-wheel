"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import type { EnalaCatalogItem, EnalaKind } from "@/lib/enala";

const KINDS: { key: EnalaKind | ""; label: "contact.catalogAll" | "contact.enalaHotels" | "contact.enalaResorts" | "contact.enalaHalls" }[] = [
  { key: "", label: "contact.catalogAll" },
  { key: "hotel", label: "contact.enalaHotels" },
  { key: "resort", label: "contact.enalaResorts" },
  { key: "hall", label: "contact.enalaHalls" },
];

export default function EnalaCatalog({
  open,
  qr,
  onClose,
}: {
  open: boolean;
  qr: string;
  onClose: () => void;
}) {
  const { locale, t } = useLocale();
  const [items, setItems] = useState<EnalaCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<EnalaKind | "">("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<EnalaCatalogItem | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ group: "1", per_page: "200" });
      if (kind) params.set("kind", kind);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/enala/catalog?${params}`);
      const json = (await res.json()) as { ok?: boolean; items?: EnalaCatalogItem[] };
      if (!json.ok) {
        setError(t("contact.enalaCatalogError"));
        setItems([]);
        return;
      }
      setItems(json.items ?? []);
    } catch {
      setError(t("contact.enalaCatalogError"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind, search]);

  const titleOf = useMemo(
    () => (item: EnalaCatalogItem) =>
      locale === "en" ? item.enname || item.arname : item.arname || item.enname,
    [locale],
  );

  const groups = useMemo(() => {
    const order: EnalaKind[] = kind ? [kind] : ["hotel", "resort", "hall"];
    return order
      .map((key) => ({
        key,
        items: items.filter((item) => item.kind === key),
      }))
      .filter((group) => group.items.length > 0);
  }, [items, kind]);

  const openItem = (item: EnalaCatalogItem) => {
    setSelected(item);
    setActiveImage(0);
  };

  if (!open) return null;

  return (
    <>
      <div className="catalog-overlay" role="dialog" aria-modal="true" aria-labelledby="enala-catalog-title">
        <div className="catalog-stage">
          <header className="catalog-header">
            <div>
              <p className="studio-kicker">ENALA</p>
              <h2 id="enala-catalog-title">{t("contact.enalaCatalogTitle")}</h2>
              <p className="catalog-lead">{t("contact.enalaCatalogLead")}</p>
            </div>
            <button type="button" className="ghost-btn" onClick={onClose}>
              {t("contact.catalogClose")}
            </button>
          </header>

          <div className="catalog-toolbar">
            <input
              className="catalog-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("contact.enalaCatalogSearch")}
            />
            <span className="catalog-count">{t("contact.catalogCount", { n: items.length })}</span>
          </div>

          <div className="catalog-filters">
            {KINDS.map((entry) => (
              <button
                key={entry.label}
                type="button"
                className={`catalog-filter ${kind === entry.key ? "is-on" : ""}`}
                onClick={() => setKind(entry.key)}
              >
                {t(entry.label)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="catalog-masonry" aria-busy="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={`catalog-tile catalog-skeleton ${index === 0 ? "is-featured" : ""}`}
                  style={{ animationDelay: `${index * 70}ms` }}
                />
              ))}
            </div>
          ) : error ? (
            <p className="field-error">{error}</p>
          ) : items.length === 0 ? (
            <p className="catalog-status">{t("contact.enalaCatalogEmpty")}</p>
          ) : (
            groups.map((group) => (
              <section key={group.key} className="catalog-group">
                <h3 className="catalog-group-title">
                  {t(
                    group.key === "hotel"
                      ? "contact.enalaHotels"
                      : group.key === "resort"
                        ? "contact.enalaResorts"
                        : "contact.enalaHalls",
                  )}
                </h3>
                <div className="catalog-masonry">
                  {group.items.map((item, index) => {
                    const image = item.banner_url || item.images?.[0]?.url || "";
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`catalog-tile ${index % 7 === 0 ? "is-featured" : ""}`}
                        style={{ animationDelay: `${Math.min(index, 16) * 55}ms` }}
                        onClick={() => openItem(item)}
                      >
                        <div className="catalog-tile-media">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt={titleOf(item)} loading="lazy" decoding="async" />
                          ) : (
                            <div className="catalog-card-fallback" />
                          )}
                          <span className="catalog-tile-shine" aria-hidden />
                          <div className="catalog-tile-shade" aria-hidden />
                          <span className="catalog-badge">
                            {item.image_count || item.images?.length || 0}
                          </span>
                        </div>
                        <div className="catalog-tile-copy">
                          <h3>{titleOf(item)}</h3>
                          <strong>
                            {locale === "en"
                              ? item.location?.enname || item.type?.enname || ""
                              : item.location?.arname || item.type?.arname || ""}
                          </strong>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
        {qr ? (
          <aside className="catalog-qr" aria-label={t("contact.catalogQr")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={t("contact.catalogQr")} />
          </aside>
        ) : null}
      </div>

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
                src={selected.images?.[activeImage]?.url || selected.banner_url || ""}
                alt={titleOf(selected)}
              />
              {(selected.images?.length || 0) > 1 ? (
                <div className="catalog-detail-thumbs">
                  {selected.images.map((image, index) => (
                    <button
                      key={`${image.id}-${index}`}
                      type="button"
                      className={index === activeImage ? "is-on" : ""}
                      onClick={() => setActiveImage(index)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt="" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="catalog-detail-copy">
              <p className="studio-kicker">ENALA</p>
              <h3>{titleOf(selected)}</h3>
              <p>
                {[
                  locale === "en" ? selected.type?.enname : selected.type?.arname,
                  locale === "en" ? selected.location?.enname : selected.location?.arname,
                  locale === "en" ? selected.enaddress : selected.araddress,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p>{t("contact.enalaImageCount", { n: selected.images?.length || 0 })}</p>
              <button type="button" className="ghost-btn" onClick={() => setSelected(null)}>
                {t("contact.catalogClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
