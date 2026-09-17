"use client";

export const CATALOG_LIST_SIZES =
  "(max-width: 900px) 94vw, (max-width: 1400px) 46vw, 32vw";
export const CATALOG_DETAIL_SIZES = "(max-width: 900px) 94vw, min(980px, 70vw)";
export const CATALOG_THUMB_SIZES = "88px";

export function catalogMediaSrc(src: string) {
  const raw = String(src || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    url.pathname = url.pathname
      .split("/")
      .map((part) => {
        try {
          return encodeURIComponent(decodeURIComponent(part));
        } catch {
          return encodeURIComponent(part);
        }
      })
      .join("/");
    return url.toString();
  } catch {
    return raw.replace(/ /g, "%20");
  }
}

export default function CatalogImage({
  src,
  alt,
  priority = false,
  fit = "cover",
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  quality?: 65 | 75 | 82 | 90;
  fit?: "cover" | "contain";
}) {
  const href = catalogMediaSrc(src);
  if (!href) return <div className="catalog-card-fallback" />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={href}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
      style={{ objectFit: fit }}
    />
  );
}
