"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { deleteMedia, listMedia, saveMedia, type MediaItem } from "@/lib/media-store";

type Preview = MediaItem & { url: string };

function isVideo(mime: string) {
  return mime.startsWith("video/");
}

export default function MediaBoard() {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Preview[]>([]);
  const [active, setActive] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const rows = await listMedia();
    const next = rows.map((row) => ({ ...row, url: URL.createObjectURL(row.blob) }));
    setItems((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.url));
      return next;
    });
    setActive((current) => {
      if (!current) return null;
      return next.find((item) => item.id === current.id) ?? null;
    });
  }, []);

  useEffect(() => {
    void refresh();
    return () => {
      setItems((current) => {
        current.forEach((item) => URL.revokeObjectURL(item.url));
        return [];
      });
    };
  }, [refresh]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length || busy) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;
        await saveMedia({
          id: crypto.randomUUID(),
          name: file.name,
          mime: file.type,
          blob: file,
          createdAt: Date.now(),
        });
      }
      await refresh();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (item: Preview, event: MouseEvent) => {
    event.stopPropagation();
    await deleteMedia(item.id);
    if (active?.id === item.id) setActive(null);
    await refresh();
  };

  return (
    <main className="media-page">
      <header className="media-head">
        <p className="gate-kicker">{t("media.kicker")}</p>
        <h1>{t("media.title")}</h1>
        <p>{t("media.lead")}</p>
        <button type="button" className="media-upload" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? t("media.uploading") : t("media.upload")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(event) => void onFiles(event.target.files)}
        />
      </header>

      {items.length === 0 ? (
        <p className="media-empty">{t("media.empty")}</p>
      ) : (
        <ul className="media-grid">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="media-card" onClick={() => setActive(item)}>
                {isVideo(item.mime) ? (
                  <video src={item.url} muted playsInline preload="metadata" />
                ) : (
                  <img src={item.url} alt={item.name} />
                )}
                <span>{isVideo(item.mime) ? t("media.video") : t("media.image")}</span>
              </button>
              <button type="button" className="media-delete" onClick={(event) => void remove(item, event)}>
                {t("media.delete")}
              </button>
            </li>
          ))}
        </ul>
      )}

      {active ? (
        <div className="media-live">
          <button type="button" className="media-live-close" onClick={() => setActive(null)}>
            {t("media.close")}
          </button>
          {isVideo(active.mime) ? (
            <video src={active.url} autoPlay controls playsInline loop />
          ) : (
            <img src={active.url} alt={active.name} />
          )}
        </div>
      ) : null}
    </main>
  );
}
