"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import AuthModal, { type AuthUser } from "@/components/AuthModal";
import SiteHeader from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";
import SofaSaveModal from "@/components/sofa/SofaSaveModal";
import {
  ARM_OPTIONS,
  DEFAULT_SOFA,
  FABRIC_COLORS,
  FABRIC_OPTIONS,
  LEG_OPTIONS,
  PILLOW_OPTIONS,
  SEAT_OPTIONS,
  estimateSofaPrice,
  formatSar,
  localizedLabel,
  sofaStyleTag,
  sofaSummary,
  type ArmStyle,
  type FabricType,
  type LegStyle,
  type PillowStyle,
  type SeatCount,
  type SofaConfig,
} from "@/lib/sofa";
import { loadPlaySession, savePlaySession } from "@/lib/session";

const SofaCanvas = dynamic(() => import("@/components/sofa/SofaCanvas"), {
  ssr: false,
  loading: () => <SofaCanvasFallback />,
});

function SofaCanvasFallback() {
  const { t } = useLocale();
  return <div className="sofa-canvas-fallback">{t("sofa.loading")}</div>;
}

function ChipGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset className="sofa-field">
      <legend>{label}</legend>
      <div className="sofa-chips">
        {options.map((option) => (
          <button
            key={String(option.id)}
            type="button"
            className={`sofa-chip ${value === option.id ? "is-on" : ""}`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function SofaStudio() {
  const { locale, t } = useLocale();
  const [config, setConfig] = useState<SofaConfig>(DEFAULT_SOFA);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    setUser(loadPlaySession("sofa"));
  }, []);

  const price = useMemo(() => estimateSofaPrice(config), [config]);
  const summary = useMemo(() => sofaSummary(config, locale), [config, locale]);
  const style = useMemo(() => sofaStyleTag(config, locale), [config, locale]);

  const patch = (partial: Partial<SofaConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  };

  const persist = async (player: AuthUser, next = config) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sofa/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: player.name,
          phone: player.phone,
          config: next,
          locale,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        sharePath?: string;
      };
      if (!json.ok || !json.sharePath) {
        setError(json.message || t("api.saveFailed"));
        return;
      }
      const origin =
        process.env.NEXT_PUBLIC_SHARE_ORIGIN?.replace(/\/$/, "") || window.location.origin;
      setShareUrl(`${origin}${json.sharePath}`);
      setSaved(true);
      setShowQr(true);
    } catch {
      setError(t("api.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    const existing = user ?? loadPlaySession("sofa");
    if (existing) {
      setUser(existing);
      void persist(existing);
      return;
    }
    setShowAuth(true);
  };

  return (
    <main className="studio-page">
      <div className="bg-atmosphere" aria-hidden>
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
        <div className="bg-grain" />
      </div>

      <SiteHeader active="sofa" />

      <section className="studio-shell">
        <div className="studio-stage">
          <div className="studio-badge">{t("sofa.badge")}</div>
          <SofaCanvas config={config} autoRotate={!showQr} />
          <div className="studio-price">
            <strong>{formatSar(price, locale)}</strong>
            <span>{style}</span>
          </div>
        </div>

        <aside className="studio-panel">
          <p className="studio-kicker">{t("sofa.kicker")}</p>
          <h1>{t("sofa.title")}</h1>
          <p className="studio-lead">{t("sofa.lead")}</p>

          <ChipGroup
            label={t("sofa.seats")}
            options={SEAT_OPTIONS.map((option) => ({
              id: option.id,
              label: localizedLabel(option, locale),
            }))}
            value={config.seats}
            onChange={(seats) => patch({ seats: seats as SeatCount })}
          />
          <ChipGroup
            label={t("sofa.arms")}
            options={ARM_OPTIONS.map((option) => ({
              id: option.id,
              label: localizedLabel(option, locale),
            }))}
            value={config.arm}
            onChange={(arm) => patch({ arm: arm as ArmStyle })}
          />
          <ChipGroup
            label={t("sofa.legs")}
            options={LEG_OPTIONS.map((option) => ({
              id: option.id,
              label: localizedLabel(option, locale),
            }))}
            value={config.legs}
            onChange={(legs) => patch({ legs: legs as LegStyle })}
          />

          <fieldset className="sofa-field">
            <legend>{t("sofa.fabricColor")}</legend>
            <div className="sofa-swatches">
              {FABRIC_COLORS.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  className={`sofa-swatch ${config.fabricColor === swatch.id ? "is-on" : ""}`}
                  style={{ background: swatch.hex }}
                  aria-label={localizedLabel(swatch, locale)}
                  title={localizedLabel(swatch, locale)}
                  onClick={() => patch({ fabricColor: swatch.id })}
                />
              ))}
            </div>
          </fieldset>

          <ChipGroup
            label={t("sofa.fabricType")}
            options={FABRIC_OPTIONS.map((option) => ({
              id: option.id,
              label: localizedLabel(option, locale),
            }))}
            value={config.fabricType}
            onChange={(fabricType) => patch({ fabricType: fabricType as FabricType })}
          />
          <ChipGroup
            label={t("sofa.pillows")}
            options={PILLOW_OPTIONS.map((option) => ({
              id: option.id,
              label: localizedLabel(option, locale),
            }))}
            value={config.pillows}
            onChange={(pillows) => patch({ pillows: pillows as PillowStyle })}
          />

          <p className="studio-summary">{summary}</p>

          {error && <p className="field-error">{error}</p>}
          {saved && <p className="studio-saved">{t("sofa.saved")}</p>}

          <button type="button" className="cta-btn studio-save" disabled={saving} onClick={handleSave}>
            {saving ? t("sofa.saving") : user ? t("sofa.save") : t("sofa.saveRegister")}
          </button>
        </aside>
      </section>

      <AuthModal
        brand="sofa"
        variant="sofa"
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onVerified={(data) => {
          savePlaySession("sofa", { ...data, alreadySpun: false });
          setUser(data);
          setShowAuth(false);
          void persist(data);
        }}
      />

      <SofaSaveModal
        open={showQr}
        shareUrl={shareUrl}
        onClose={() => setShowQr(false)}
      />
    </main>
  );
}
