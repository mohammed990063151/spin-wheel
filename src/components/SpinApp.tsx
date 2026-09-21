"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import AuthModal, { type AuthUser } from "@/components/AuthModal";
import { useLocale } from "@/components/LocaleProvider";
import SpinWheel, { type SpinWheelHandle } from "@/components/SpinWheel";
import PrizeModal from "@/components/PrizeModal";
import Confetti from "@/components/Confetti";
import { getBrand, isEmptyPrize, prizeDescription, prizeLabel, applyPrizeStock, totalPrizeStock, usedPrizeStock, type BrandId, type Prize } from "@/lib/prizes";
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
  const [prizes, setPrizes] = useState<Prize[]>(brand.prizes);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authSession, setAuthSession] = useState(0);
  const [notice, setNotice] = useState("");
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const countsRef = useRef<Record<string, number>>({});
  const resetHoldRef = useRef(0);

  const ignoreRemoteStockRef = useRef(false);

  const refreshStock = useCallback(async () => {
    if (ignoreRemoteStockRef.current) return;
    try {
      const res = await fetch(`/api/spin/stock?brand=${brandId}`, { cache: "no-store" });
      const json = (await res.json()) as { counts?: Record<string, number> };
      countsRef.current = json.counts ?? {};
      setPrizes(applyPrizeStock(getBrand(brandId).prizes, countsRef.current));
    } catch {
      setPrizes(getBrand(brandId).prizes);
    }
  }, [brandId]);

  useEffect(() => {
    void refreshStock();
  }, [refreshStock]);

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

  const resetGame = useCallback(async () => {
    if (resetting) return;
    setConfirmReset(false);
    setResetting(true);
    const applyLocalReset = () => {
      countsRef.current = {};
      setPrizes(getBrand(brandId).prizes);
      resetForNextCustomer();
    };
    try {
      const res = await fetch("/api/spin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: brandId }),
      });
      const json = (await res.json()) as { ok?: boolean };
      if (!res.ok || !json.ok) throw new Error("reset failed");
      ignoreRemoteStockRef.current = false;
      applyLocalReset();
      void refreshStock();
      setNotice(t("spin.reset"));
      window.setTimeout(() => setNotice(""), 3500);
    } catch {
      ignoreRemoteStockRef.current = true;
      applyLocalReset();
      setNotice(t("spin.reset"));
      window.setTimeout(() => setNotice(""), 3500);
    } finally {
      setResetting(false);
    }
  }, [brandId, resetForNextCustomer, refreshStock, resetting, t]);

  const beginResetHold = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    window.clearTimeout(resetHoldRef.current);
    resetHoldRef.current = window.setTimeout(() => {
      setConfirmReset(true);
    }, 1400);
  };

  const cancelResetHold = () => {
    window.clearTimeout(resetHoldRef.current);
  };

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
    if (brandId === "enala") {
      const brandPrizes = getBrand(brandId).prizes;
      const maxSpins = totalPrizeStock(brandPrizes);
      if (maxSpins > 0 && usedPrizeStock(countsRef.current, brandPrizes) >= maxSpins) return;
    }
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

  useEffect(() => () => {
    window.clearTimeout(spinTimerRef.current);
    window.clearTimeout(resetHoldRef.current);
  }, []);

  const handleRequestSpin = () => {
    resumeAudio();
    if (brandId === "enala") {
      const brandPrizes = getBrand(brandId).prizes;
      const maxSpins = totalPrizeStock(brandPrizes);
      if (maxSpins > 0 && usedPrizeStock(countsRef.current, brandPrizes) >= maxSpins) {
        setNotice(t("spin.finished"));
        return false;
      }
    }
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
    if (brandId === "enala") {
      const brandPrizes = getBrand(brandId).prizes;
      const maxSpins = totalPrizeStock(brandPrizes);
      if (maxSpins > 0 && usedPrizeStock(countsRef.current, brandPrizes) >= maxSpins) {
        setShowAuth(false);
        setNotice(t("spin.finished"));
        return;
      }
    }
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
      if (p.stock) {
        countsRef.current = {
          ...countsRef.current,
          [p.id]: (countsRef.current[p.id] ?? 0) + 1,
        };
        setPrizes(applyPrizeStock(getBrand(brandId).prizes, countsRef.current));
      }
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
      })
        .then(() => refreshStock())
        .catch(() => {});
    },
    [brandId, refreshStock],
  );

  const brandPrizes = getBrand(brandId).prizes;
  const maxSpins = totalPrizeStock(brandPrizes);
  const usedSpins = usedPrizeStock(countsRef.current, brandPrizes);
  const gameFinished = brandId === "enala" && maxSpins > 0 && usedSpins >= maxSpins;
  const spinningLock = phase === "result" || showAuth || gameFinished;

  return (
    <main className={`page brand-${brandId}`}>
      <button
        type="button"
        className="spin-reset-hotspot"
        aria-label={t("spin.resetHidden")}
        disabled={resetting}
        onPointerDown={beginResetHold}
        onPointerUp={cancelResetHold}
        onPointerLeave={cancelResetHold}
        onPointerCancel={cancelResetHold}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div className="bg-atmosphere" aria-hidden>
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
        <div className="bg-grain" />
      </div>

      <section className="page-intro enter-up">
        <p className="national-day-badge">{t("spin.nationalDay")}</p>
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

      {confirmReset ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t("spin.resetConfirmTitle")}>
          <div className="modal-card">
            <p className="modal-eyebrow">{t("spin.resetConfirmTitle")}</p>
            <p className="modal-desc">{t("spin.resetConfirmBody")}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="cta-btn"
                disabled={resetting}
                onClick={() => void resetGame()}
              >
                {resetting ? t("spin.resetting") : t("spin.resetConfirmYes")}
              </button>
              <button
                type="button"
                className="ghost-btn"
                disabled={resetting}
                onClick={() => setConfirmReset(false)}
              >
                {t("spin.resetConfirmNo")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className={`wheel-section ${phase === "wheel" ? "enter-scale" : ""}`}>
        <SpinWheel
          ref={wheelRef}
          prizes={prizes}
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