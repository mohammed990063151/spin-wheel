"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AuthModal, { type AuthUser } from "@/components/AuthModal";
import LangSwitch from "@/components/LangSwitch";
import { useLocale } from "@/components/LocaleProvider";
import SpinWheel, { type SpinWheelHandle } from "@/components/SpinWheel";
import PrizeModal from "@/components/PrizeModal";
import Confetti from "@/components/Confetti";
import { getBrand, isEmptyPrize, prizeDescription, prizeLabel, type BrandId, type Prize } from "@/lib/prizes";
import { resumeAudio } from "@/lib/audio";
import {
  clearPlaySession,
  loadPlaySession,
  savePlaySession,
} from "@/lib/session";
import { isDevPhone } from "@/lib/dev";

type Phase = "wheel" | "result";

export default function SpinApp({ brandId }: { brandId: BrandId }) {
  const brand = getBrand(brandId);
  const { locale, t } = useLocale();
  const wheelRef = useRef<SpinWheelHandle>(null);
  const userRef = useRef<AuthUser | null>(null);
  const readyToSpinRef = useRef(false);
  const spinTimerRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>("wheel");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authSession, setAuthSession] = useState(0);
  const [notice, setNotice] = useState("");

  const resetForNextCustomer = useCallback(() => {
    window.clearTimeout(spinTimerRef.current);
    userRef.current = null;
    readyToSpinRef.current = false;
    clearPlaySession(brandId);
    setShowConfetti(false);
    setPrize(null);
    setPhase("wheel");
    setUser(null);
    setNotice("");
    setShowAuth(false);
  }, [brandId]);

  const startSpin = useCallback(() => {
    window.clearTimeout(spinTimerRef.current);
    setPrize(null);
    setShowConfetti(false);
    setPhase("wheel");
    spinTimerRef.current = window.setTimeout(() => {
      wheelRef.current?.spin();
    }, 450);
  }, []);

  useEffect(() => {
    const saved = loadPlaySession(brandId);
    if (!saved || (saved.alreadySpun && !isDevPhone(saved.phone))) return;
    userRef.current = saved;
    readyToSpinRef.current = true;
    setUser(saved);
    startSpin();
  }, [brandId, startSpin]);

  useEffect(() => {
    if (phase !== "result") return;
    const t = window.setTimeout(resetForNextCustomer, 8000);
    return () => window.clearTimeout(t);
  }, [phase, resetForNextCustomer]);

  useEffect(() => () => window.clearTimeout(spinTimerRef.current), []);

  const handleRequestSpin = () => {
    resumeAudio();
    const player = userRef.current;
    if (player && isDevPhone(player.phone)) {
      readyToSpinRef.current = true;
      setNotice("");
      return true;
    }
    if (readyToSpinRef.current && player && !player.alreadySpun) {
      setNotice("");
      return true;
    }
    if (player?.alreadySpun) return false;
    setNotice("");
    setAuthSession((n) => n + 1);
    setShowAuth(true);
    return false;
  };

  const handleVerified = (data: AuthUser) => {
    setShowAuth(false);
    setPrize(null);
    setPhase("wheel");
    setShowConfetti(false);
    userRef.current = data;
    readyToSpinRef.current = true;
    savePlaySession(brandId, { ...data, alreadySpun: false });
    setUser(data);
    setNotice("");
    startSpin();
  };

  const handleWin = useCallback(
    (p: Prize) => {
      const player = userRef.current;
      readyToSpinRef.current = false;
      setPrize(p);
      setPhase("result");
      setShowConfetti(!isEmptyPrize(p));
      if (!player) return;
      const next = { ...player, alreadySpun: true, prizeLabel: p.label };
      userRef.current = next;
      savePlaySession(brandId, next);
      setUser(next);
      void fetch("/api/spin/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: player.name,
          phone: player.phone,
          brand: brandId,
          prizeId: p.id,
          prizeLabel: p.label,
          prizeDescription: p.description,
          prizeEmpty: isEmptyPrize(p),
        }),
      }).catch(() => {});
    },
    [brandId],
  );

  const spinningLock = phase === "result" || showAuth;

  return (
    <main className={`page brand-${brandId}`}>
      <div className="bg-atmosphere" aria-hidden>
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
        <div className="bg-grain" />
      </div>

      <header className="site-brand">
        <a className="brand-back" href="/">
          {t("header.back")}
        </a>
        <span className="brand-mark" lang="en" dir="ltr">
          {brand.name}
        </span>
        <LangSwitch />
      </header>

      <section className="page-intro enter-up">
        <h1 className="hero-brand hero-brand-compact" lang="en" dir="ltr">
          {brand.name}
        </h1>
        <p className="hero-line">
          {t(brandId === "enala" ? "spin.tagline.enala" : "spin.tagline.place")}
        </p>
        <p className="hero-support hero-support-compact">
          {t(brandId === "enala" ? "spin.support.enala" : "spin.support.place")}
        </p>
      </section>

      {notice && <p className="spin-notice">{notice}</p>}

      <section className={`wheel-section ${phase === "wheel" ? "enter-scale" : ""}`}>
        <SpinWheel
          ref={wheelRef}
          prizes={brand.prizes}
          userName={user?.name}
          onWin={handleWin}
          onRequestSpin={handleRequestSpin}
          disabled={spinningLock}
        />
      </section>

      <AuthModal
        key={authSession}
        brand={brandId}
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onVerified={handleVerified}
      />

      <PrizeModal
        open={phase === "result" && !!prize}
        prizeLabel={prize ? prizeLabel(prize, locale) : ""}
        prizeDescription={prize ? prizeDescription(prize, locale) : ""}
        userName={user?.name ?? ""}
        isEmpty={prize ? isEmptyPrize(prize) : false}
        onClose={resetForNextCustomer}
      />

      <Confetti active={showConfetti} />

      <footer className="site-foot">
        {t(brandId === "enala" ? "spin.footer.enala" : "spin.footer.place")}
      </footer>
    </main>
  );
}