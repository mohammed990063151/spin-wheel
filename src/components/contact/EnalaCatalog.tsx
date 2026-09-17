"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import CatalogImage, {
  CATALOG_DETAIL_SIZES,
  CATALOG_LIST_SIZES,
  CATALOG_THUMB_SIZES,
} from "@/components/contact/CatalogImage";
import { loadEnalaCatalog, loadEnalaCatalogItem, peekEnalaCatalog } from "@/components/contact/enala-catalog-cache";
import type { EnalaCatalogItem, EnalaKind } from "@/lib/enala";

const KINDS: {
  key: EnalaKind | "";
  label: "contact.catalogAll" | "contact.enalaHotels" | "contact.enalaResorts" | "contact.enalaHalls";
}[] = [
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
  const [items, setItems] = useState<EnalaCatalogItem[]>(() => peekEnalaCatalog() ?? []);
  const [loading, setLoading] = useState(() => !peekEnalaCatalog());
  const [error, setError] = useState("");
  const [kind, setKind] = useState<EnalaKind | "">("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<EnalaCatalogItem | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const cached = peekEnalaCatalog();
    if (!cached) setLoading(true);
    void loadEnalaCatalog()
      .then((next) => {
        if (cancelled) return;
        setItems(next);
        setError("");
      })
      .catch(() => {
        if (cancelled || peekEnalaCatalog()) return;
        setError(t("contact.enalaCatalogError"));
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, t]);

  const titleOf = useMemo(
    () => (item: EnalaCatalogItem) =>
      locale === "en" ? item.enname || item.arname : item.arname || item.enname,
    [locale],
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (kind && item.kind !== kind) return false;
      if (!needle) return true;
      return [
        item.arname,
        item.enname,
        item.araddress,
        item.enaddress,
        item.location?.arname,
        item.location?.enname,
        item.type?.arname,
        item.type?.enname,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(needle));
    });
  }, [items, kind, search]);

  const groups = useMemo(() => {
    const order: EnalaKind[] = kind ? [kind] : ["hotel", "resort", "hall"];
    return order
      .map((key) => ({
        key,
        items: visible.filter((item) => item.kind === key),
      }))
      .filter((group) => group.items.length > 0);
  }, [visible, kind]);

  const openItem = (item: EnalaCatalogItem) => {
    setSelected(item);
    setActiveImage(0);
    if ((item.image_count || 0) > (item.images?.length || 0) || (item.images?.length || 0) <= 1) {
      void loadEnalaCatalogItem(item.id).then((full) => {
        if (!full) return;
        setSelected((current) => (current?.id === full.id ? full : current));
      });
    }
  };

  const images = selected?.images?.length
    ? selected.images
    : selected?.banner_url
      ? [{ id: "banner", url: selected.banner_url }]
      : [];
  const active = images[activeImage] || images[0];

  const stepImage = (dir: 1 | -1) => {
    if (images.length < 2) return;
    setActiveImage((index) => (index + dir + images.length) % images.length);
  };

  if (!open) return null;

  return (
    <>
      <div className="catalog-overlay" role="dialog" aria-modal="true" aria-labelledby="enala-catalog-title">
        <div className="catalog-stage">
          <div className="catalog-chrome">
            <header className="catalog-header">
              <div>
                <p className="studio-kicker">ENALA</p>
                <h2 id="enala-catalog-title">{t("contact.enalaCatalogTitle")}</h2>
                <p className="catalog-lead">{t("contact.enalaCatalogLead")}</p>
              </div>
              <button type="button" className="ghost-btn catalog-close" onClick={onClose}>
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
              <span className="catalog-count">{t("contact.catalogCount", { n: visible.length })}</span>
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
          </div>

          {loading && items.length === 0 ? (
            <div className="catalog-masonry" aria-busy="true">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="catalog-tile catalog-skeleton"
                  style={{ animationDelay: `${index * 60}ms` }}
                />
              ))}
            </div>
          ) : error ? (
            <p className="field-error">{error}</p>
          ) : visible.length === 0 ? (
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
                        className="catalog-tile"
                        style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
                        onClick={() => openItem(item)}
                      >
                        <div className="catalog-tile-media">
                          {image ? (
                            <CatalogImage
                              src={image}
                              alt={titleOf(item)}
                              sizes={CATALOG_LIST_SIZES}
                              priority={index < 4}
                              quality={82}
                            />
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
            <div
              className="catalog-detail-media"
              onTouchStart={(event) => {
                touchStartX.current = event.changedTouches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                const start = touchStartX.current;
                touchStartX.current = null;
                if (start == null) return;
                const delta = (event.changedTouches[0]?.clientX ?? start) - start;
                if (Math.abs(delta) < 40) return;
                stepImage(delta > 0 ? -1 : 1);
              }}
            >
              <div className="catalog-detail-photo">
                {active?.url ? (
                  <CatalogImage
                    key={active.url}
                    src={active.url}
                    alt={titleOf(selected)}
                    sizes={CATALOG_DETAIL_SIZES}
                    priority
                    quality={90}
                    fit="contain"
                  />
                ) : (
                  <div className="catalog-card-fallback" />
                )}
              </div>
              {images.length > 1 ? (
                <>
                  <button type="button" className="catalog-detail-nav is-prev" onClick={() => stepImage(-1)}>
                    ‹
                  </button>
                  <button type="button" className="catalog-detail-nav is-next" onClick={() => stepImage(1)}>
                    ›
                  </button>
                  <div className="catalog-detail-thumbs">
                    {images.map((image, index) => (
                      <button
                        key={`${image.id}-${index}`}
                        type="button"
                        className={index === activeImage ? "is-on" : ""}
                        onClick={() => setActiveImage(index)}
                      >
                        <CatalogImage src={image.url} alt="" sizes={CATALOG_THUMB_SIZES} quality={65} />
                      </button>
                    ))}
                  </div>
                </>
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
              <p>{t("contact.enalaImageCount", { n: images.length || selected.image_count || 0 })}</p>
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
