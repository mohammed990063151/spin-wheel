"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import type { SofaCanvasHandle } from "@/components/sofa/SofaCanvas";
import {
  estimateSofaPrice,
  formatSar,
  sofaStyleTag,
  sofaSummary,
  type SofaConfig,
} from "@/lib/sofa";

const SofaCanvas = dynamic(() => import("@/components/sofa/SofaCanvas"), {
  ssr: false,
  loading: () => <div className="sofa-canvas-fallback" />,
});

export default function SofaShareView({
  name,
  config,
}: {
  name: string;
  config: SofaConfig;
}) {
  const { locale, t } = useLocale();
  const canvasRef = useRef<SofaCanvasHandle | null>(null);
  const [busy, setBusy] = useState(false);
  const price = useMemo(() => estimateSofaPrice(config), [config]);
  const style = useMemo(() => sofaStyleTag(config, locale), [config, locale]);
  const summary = useMemo(() => sofaSummary(config, locale), [config, locale]);

  const saveImage = async () => {
    setBusy(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 160));
      const href = canvasRef.current?.capture() || "";
      if (!href) return;
      await downloadPng(href, `place-sofa-${name || "design"}.png`, t("sofa.shareTitle"));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    document.title = t("sofa.shareTitle");
  }, [t]);

  return (
    <main className="studio-page share-page">
      <div className="bg-atmosphere" aria-hidden>
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
        <div className="bg-grain" />
      </div>

      <section className="share-shell">
        <div className="studio-stage share-stage">
          <div className="studio-badge">{t("sofa.badge")}</div>
          <SofaCanvas
            config={config}
            autoRotate
            onReady={(handle) => {
              canvasRef.current = handle;
            }}
          />
          <div className="studio-price">
            <strong>{formatSar(price, locale)}</strong>
            <span>{style}</span>
          </div>
        </div>
        <div className="share-copy">
          <p className="studio-kicker">PLACE</p>
          <h1>{t("sofa.shareTitle")}</h1>
          <p className="studio-lead">{t("sofa.shareLead", { name })}</p>
          <p className="studio-summary">{summary}</p>
          <button type="button" className="cta-btn" disabled={busy} onClick={() => void saveImage()}>
            {busy ? t("sofa.savingImage") : t("sofa.saveImage")}
          </button>
        </div>
      </section>
    </main>
  );
}

async function downloadPng(href: string, filename: string, title: string) {
  const blob = await (await fetch(href)).blob();
  const file = new File([blob], filename, { type: "image/png" });
  const payload = { files: [file], title };
  if (typeof navigator.canShare === "function" && navigator.canShare(payload)) {
    await navigator.share(payload);
    return;
  }
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
}
