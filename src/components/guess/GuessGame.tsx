"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthModal, { type AuthUser } from "@/components/AuthModal";
import PrizeModal from "@/components/PrizeModal";
import Confetti from "@/components/Confetti";
import SiteHeader from "@/components/SiteHeader";
import { useLocale } from "@/components/LocaleProvider";
import {
  estimateSofaPrice,
  formatSar,
  randomSofaConfig,
  sofaStyleTag,
  type SofaConfig,
} from "@/lib/sofa";
import {
  GUESS_ROUND_SECONDS,
  buildGuessOptions,
  prizeFromScore,
  type GuessPrize,
} from "@/lib/guess";
import { clearPlaySession, loadPlaySession, savePlaySession } from "@/lib/session";
import { isDevPhone } from "@/lib/dev";

const SofaCanvas = dynamic(() => import("@/components/sofa/SofaCanvas"), {
  ssr: false,
  loading: () => <GuessCanvasFallback />,
});

function GuessCanvasFallback() {
  const { t } = useLocale();
  return <div className="sofa-canvas-fallback">{t("guess.loading")}</div>;
}

type Phase = "intro" | "playing" | "result";

interface RoundState {
  sofa: SofaConfig;
  price: number;
  options: number[];
  picked: number | null;
}

function makeRound(): RoundState {
  const sofa = randomSofaConfig();
  const price = estimateSofaPrice(sofa);
  return { sofa, price, options: buildGuessOptions(price), picked: null };
}

export default function GuessGame() {
  const { locale, t } = useLocale();
  const [phase, setPhase] = useState<Phase>("intro");
  const [roundIndex, setRoundIndex] = useState(0);
  const [rounds, setRounds] = useState<RoundState[]>([]);
  const [seconds, setSeconds] = useState(GUESS_ROUND_SECONDS);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authSession, setAuthSession] = useState(0);
  const [prize, setPrize] = useState<GuessPrize | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [locked, setLocked] = useState(false);

  const roundsRef = useRef(rounds);
  const roundIndexRef = useRef(roundIndex);
  const userRef = useRef(user);
  const lockedRef = useRef(locked);
  roundsRef.current = rounds;
  roundIndexRef.current = roundIndex;
  userRef.current = user;
  lockedRef.current = locked;

  const current = rounds[roundIndex];
  const score = useMemo(
    () => rounds.filter((round) => round.picked === round.price).length,
    [rounds],
  );
  const style = current ? sofaStyleTag(current.sofa, locale) : "";

  const resetForNext = () => {
    clearPlaySession("guess");
    setPhase("intro");
    setRoundIndex(0);
    setRounds([]);
    setSeconds(GUESS_ROUND_SECONDS);
    setUser(null);
    setPrize(null);
    setShowConfetti(false);
    setLocked(false);
    setShowAuth(false);
  };

  const startRounds = () => {
    setRounds([makeRound(), makeRound(), makeRound()]);
    setRoundIndex(0);
    setSeconds(GUESS_ROUND_SECONDS);
    setPhase("playing");
    setLocked(false);
    setPrize(null);
  };

  const finish = useCallback((finalRounds: RoundState[], player: AuthUser) => {
    const finalScore = finalRounds.filter((round) => round.picked === round.price).length;
    const nextPrize = prizeFromScore(finalScore);
    setPrize(nextPrize);
    setPhase("result");
    setShowConfetti(!nextPrize.empty);
    savePlaySession("guess", { ...player, alreadySpun: true, prizeLabel: nextPrize.label });
    void fetch("/api/guess/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: player.name,
        phone: player.phone,
        score: finalScore,
        maxScore: finalRounds.length,
        styleTag: sofaStyleTag(finalRounds[finalRounds.length - 1]?.sofa ?? randomSofaConfig(), "ar"),
        prizeId: nextPrize.id,
        prizeLabel: nextPrize.label,
        prizeDescription: nextPrize.description,
        prizeEmpty: Boolean(nextPrize.empty),
        rounds: finalRounds.map((round) => ({
          price: round.price,
          picked: round.picked,
          correct: round.picked === round.price,
          sofa: round.sofa,
        })),
      }),
    }).catch(() => {});
  }, []);

  const choose = useCallback(
    (value: number) => {
      if (lockedRef.current) return;
      const player = userRef.current;
      const index = roundIndexRef.current;
      const currentRounds = roundsRef.current;
      const round = currentRounds[index];
      if (!player || !round) return;

      lockedRef.current = true;
      setLocked(true);
      const nextRounds = currentRounds.map((item, i) =>
        i === index ? { ...item, picked: value } : item,
      );
      setRounds(nextRounds);

      window.setTimeout(() => {
        if (index >= nextRounds.length - 1) {
          finish(nextRounds, player);
          return;
        }
        lockedRef.current = false;
        setRoundIndex(index + 1);
        setSeconds(GUESS_ROUND_SECONDS);
        setLocked(false);
      }, 850);
    },
    [finish],
  );

  useEffect(() => {
    if (phase !== "playing" || locked) return;
    setSeconds(GUESS_ROUND_SECONDS);
    const started = Date.now();
    const tick = window.setInterval(() => {
      const left = GUESS_ROUND_SECONDS - Math.floor((Date.now() - started) / 1000);
      if (left <= 0) {
        window.clearInterval(tick);
        setSeconds(0);
        choose(-1);
        return;
      }
      setSeconds(left);
    }, 200);
    return () => window.clearInterval(tick);
  }, [phase, roundIndex, locked, choose]);

  useEffect(() => {
    if (phase !== "result") return;
    const t = window.setTimeout(resetForNext, 9000);
    return () => window.clearTimeout(t);
  }, [phase]);

  const handleStart = () => {
    const saved = loadPlaySession("guess");
    if (saved?.alreadySpun && !isDevPhone(saved.phone)) {
      setUser(saved);
      setPrize({
        id: "played",
        label: "لعبت سابقاً",
        labelEn: "Already played",
        description: "كل زائر يلعب مرة واحدة — شكراً لمشاركتك",
        descriptionEn: "Each visitor plays once — thank you for joining",
        empty: true,
      });
      setPhase("result");
      return;
    }
    if (saved) {
      setUser(saved);
      startRounds();
      return;
    }
    setAuthSession((n) => n + 1);
    setShowAuth(true);
  };

  return (
    <main className="studio-page guess-page">
      <div className="bg-atmosphere" aria-hidden>
        <div className="bg-orb bg-orb-a" />
        <div className="bg-orb bg-orb-b" />
        <div className="bg-grain" />
      </div>

      <SiteHeader active="guess" />

      {phase === "intro" && (
        <section className="guess-intro">
          <p className="studio-kicker">{t("guess.kicker")}</p>
          <h1>{t("guess.title")}</h1>
          <p>{t("guess.lead")}</p>
          <ul className="guess-prizes">
            <li>{t("guess.prize3")}</li>
            <li>{t("guess.prize2")}</li>
            <li>{t("guess.prize1")}</li>
          </ul>
          <button type="button" className="cta-btn" onClick={handleStart}>
            {t("guess.start")}
          </button>
        </section>
      )}

      {phase === "playing" && current && (
        <section className="studio-shell">
          <div className="studio-stage">
            <div className="studio-badge">
              {t("guess.round", { n: roundIndex + 1, s: seconds })}
            </div>
            <SofaCanvas config={current.sofa} autoRotate />
            <div className="studio-price">
              <strong>{style}</strong>
              <span>{t("guess.askPrice")}</span>
            </div>
          </div>
          <aside className="studio-panel">
            <h1>{t("guess.title")}</h1>
            <p className="studio-lead">{t("guess.playLead")}</p>
            <div className="guess-options">
              {current.options.map((option) => {
                const correct = locked && option === current.price;
                const wrong = locked && current.picked === option && option !== current.price;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`guess-option ${correct ? "is-correct" : ""} ${wrong ? "is-wrong" : ""}`}
                    disabled={locked}
                    onClick={() => choose(option)}
                  >
                    {formatSar(option, locale)}
                  </button>
                );
              })}
            </div>
            <p className="studio-summary">{t("guess.score", { score, total: rounds.length })}</p>
          </aside>
        </section>
      )}

      <AuthModal
        key={authSession}
        brand="guess"
        variant="guess"
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onVerified={(data) => {
          savePlaySession("guess", {
            ...data,
            alreadySpun: data.alreadySpun && !isDevPhone(data.phone),
          });
          setUser(data);
          setShowAuth(false);
          if (data.alreadySpun && !isDevPhone(data.phone)) {
            setPrize({
              id: "played_phone",
              label: "لعبت سابقاً",
              labelEn: "Already played",
              description: "سبق أن لعبت خمن السعر بهذا الرقم",
              descriptionEn: "This number has already played Guess the Price",
              empty: true,
            });
            setPhase("result");
            return;
          }
          startRounds();
        }}
      />

      <PrizeModal
        open={phase === "result" && !!prize}
        prizeLabel={
          prize?.id === "played" || prize?.id === "played_phone"
            ? t("guess.played")
            : prize
              ? locale === "en"
                ? prize.labelEn
                : prize.label
              : ""
        }
        prizeDescription={
          prize?.id === "played"
            ? t("guess.playedDesc")
            : prize?.id === "played_phone"
              ? t("guess.playedPhone")
              : prize
                ? t("guess.resultExtra", {
                    description: locale === "en" ? prize.descriptionEn : prize.description,
                    score,
                  })
                : ""
        }
        userName={user?.name ?? ""}
        isEmpty={Boolean(prize?.empty)}
        onClose={resetForNext}
      />

      <Confetti active={showConfetti} />
    </main>
  );
}
