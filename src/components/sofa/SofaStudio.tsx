"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import AuthModal, { type AuthUser } from "@/components/AuthModal";
import SiteHeader from "@/components/SiteHeader";
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
  loading: () => <div className="sofa-canvas-fallback">جاري تجهيز الكنبة...</div>,
});

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
  const [config, setConfig] = useState<SofaConfig>(DEFAULT_SOFA);
  const [user, setUser] = useState<AuthUser | null>(() =>
    typeof window === "undefined" ? null : loadPlaySession("sofa"),
  );
  const [showAuth, setShowAuth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const price = useMemo(() => estimateSofaPrice(config), [config]);
  const summary = useMemo(() => sofaSummary(config), [config]);
  const style = useMemo(() => sofaStyleTag(config), [config]);

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
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!json.ok) {
        setError(json.message || "تعذر حفظ التصميم");
        return;
      }
      setSaved(true);
    } catch {
      setError("تعذر حفظ التصميم");
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
          <div className="studio-badge">Build Your Sofa ★★★★★</div>
          <SofaCanvas config={config} />
          <div className="studio-price">
            <strong>{formatSar(price)}</strong>
            <span>{style}</span>
          </div>
        </div>

        <aside className="studio-panel">
          <p className="studio-kicker">مصنع Place</p>
          <h1>اصنع الكنبة بنفسك</h1>
          <p className="studio-lead">اختر المقاعد والذراع والأرجل والقماش والوسائد، والنتيجة تظهر ثلاثية الأبعاد فوراً.</p>

          <ChipGroup
            label="عدد المقاعد"
            options={SEAT_OPTIONS}
            value={config.seats}
            onChange={(seats) => patch({ seats: seats as SeatCount })}
          />
          <ChipGroup
            label="شكل الذراع"
            options={ARM_OPTIONS}
            value={config.arm}
            onChange={(arm) => patch({ arm: arm as ArmStyle })}
          />
          <ChipGroup
            label="نوع الأرجل"
            options={LEG_OPTIONS}
            value={config.legs}
            onChange={(legs) => patch({ legs: legs as LegStyle })}
          />

          <fieldset className="sofa-field">
            <legend>لون القماش</legend>
            <div className="sofa-swatches">
              {FABRIC_COLORS.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  className={`sofa-swatch ${config.fabricColor === swatch.id ? "is-on" : ""}`}
                  style={{ background: swatch.hex }}
                  aria-label={swatch.label}
                  title={swatch.label}
                  onClick={() => patch({ fabricColor: swatch.id })}
                />
              ))}
            </div>
          </fieldset>

          <ChipGroup
            label="نوع القماش"
            options={FABRIC_OPTIONS.map(({ id, label }) => ({ id, label }))}
            value={config.fabricType}
            onChange={(fabricType) => patch({ fabricType: fabricType as FabricType })}
          />
          <ChipGroup
            label="الوسائد"
            options={PILLOW_OPTIONS}
            value={config.pillows}
            onChange={(pillows) => patch({ pillows: pillows as PillowStyle })}
          />

          <p className="studio-summary">{summary}</p>

          {error && <p className="field-error">{error}</p>}
          {saved && <p className="studio-saved">تم حفظ تصميمك في المصنع — سنتواصل معك.</p>}

          <button type="button" className="cta-btn studio-save" disabled={saving} onClick={handleSave}>
            {saving ? "جاري الحفظ..." : user ? "احفظ التصميم" : "سجّل واحفظ التصميم"}
          </button>
        </aside>
      </section>

      <AuthModal
        brand="sofa"
        open={showAuth}
        onClose={() => setShowAuth(false)}
        registerTitle="سجّل ثم احفظ كنبتك"
        otpTitle="أدخل الكود"
        lead="نرسل كود تأكيد برسالة ثم نحفظ التصميم لفريق Place"
        onVerified={(data) => {
          savePlaySession("sofa", { ...data, alreadySpun: false });
          setUser(data);
          setShowAuth(false);
          void persist(data);
        }}
      />
    </main>
  );
}
