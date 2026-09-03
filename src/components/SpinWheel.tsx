"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  getPrizeAtRotation,
  pickPrizeIndex,
  prizeLabel,
  rotationForPrize,
  segmentAngle,
  segmentCount,
  type Prize,
} from "@/lib/prizes";
import { playTick, playWinFanfare, resumeAudio } from "@/lib/audio";
import { useLocale } from "@/components/LocaleProvider";

export interface SpinWheelHandle {
  spin: () => void;
}

interface SpinWheelProps {
  prizes: Prize[];
  userName?: string;
  onWin: (prize: Prize) => void;
  disabled?: boolean;
  /** Return false to intercept the click (e.g. show phone OTP first). */
  onRequestSpin?: () => boolean;
}

/** Ease-out with long deceleration + tiny settle bounce. */
function spinEase(t: number): number {
  if (t >= 1) return 1;
  if (t < 0.82) {
    const u = t / 0.82;
    return 1 - Math.pow(1 - u, 2.6);
  }
  const u = (t - 0.82) / 0.18;
  const overshoot = Math.sin(u * Math.PI) * 0.014 * (1 - u);
  return 1 + overshoot;
}

const SpinWheel = forwardRef<SpinWheelHandle, SpinWheelProps>(function SpinWheel(
  { prizes, userName, onWin, disabled = false, onRequestSpin },
  ref,
) {
  const { locale, t } = useLocale();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pointerKick, setPointerKick] = useState(0);
  const [glowPulse, setGlowPulse] = useState(false);

  const rotationRef = useRef(0);
  const lastSegmentRef = useRef(-1);
  const rafRef = useRef(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const spinningRef = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const spin = useCallback(() => {
    if (spinningRef.current) return;
    spinningRef.current = true;
    resumeAudio();

    const prizeIndex = pickPrizeIndex(prizes);
    const start = rotationRef.current;
    const angle = segmentAngle(prizes);
    const count = segmentCount(prizes);
    // Add slight random offset within segment so it doesn't always land dead-center
    const jitter = (Math.random() - 0.5) * (angle * 0.55);
    const extraSpins = 12 + Math.floor(Math.random() * 4);
    const target = rotationForPrize(prizes, prizeIndex, extraSpins) + jitter;
    // Continuously increase rotation (never reset) for smooth multi-spins
    const delta = target + Math.ceil(start / 360) * 360 - (start % 360);
    const minTravel = extraSpins * 360;
    const end = start + (delta < minTravel ? delta + minTravel : delta);

    const duration = 14500 + Math.random() * 2500;
    const t0 = performance.now();
    setSpinning(true);
    setGlowPulse(true);
    lastSegmentRef.current = Math.floor(
      ((360 - (start % 360) + 360) % 360) / angle,
    );

    const frame = (now: number) => {
      const raw = Math.min(1, (now - t0) / duration);
      const eased = spinEase(raw);
      const value = start + (end - start) * eased;

      rotationRef.current = value;
      setRotation(value);

      // Tick when crossing segment boundaries
      const norm = ((value % 360) + 360) % 360;
      const under = ((360 - norm) % 360 + 360) % 360;
      const seg = Math.floor(under / angle) % count;
      if (seg !== lastSegmentRef.current) {
        lastSegmentRef.current = seg;
        const speedFactor = 1 - raw;
        playTick(0.35 + speedFactor * 0.65);
        setPointerKick(1);
        requestAnimationFrame(() => setPointerKick(0));
      }

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        rotationRef.current = end;
        setRotation(end);
        setSpinning(false);
        spinningRef.current = false;
        setGlowPulse(false);
        const prize = getPrizeAtRotation(prizes, end);
        if (!prize.empty) playWinFanfare();
        setTimeout(() => onWin(prize), 900);
      }
    };

    rafRef.current = requestAnimationFrame(frame);
  }, [onWin, prizes]);

  useImperativeHandle(ref, () => ({ spin }), [spin]);

  const requestSpin = () => {
    if (spinningRef.current || disabledRef.current) return;
    if (onRequestSpin && !onRequestSpin()) return;
    spin();
  };

  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;
  const angle = segmentAngle(prizes);
  const labelSize = prizes.length > 4 ? 13 : 12;

  const segments = prizes.map((prize, i) => {
    const startAngle = (i * angle - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * angle - 90) * (Math.PI / 180);
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const mid = ((i + 0.5) * angle - 90) * (Math.PI / 180);
    const labelR = radius * 0.62;
    const lx = cx + labelR * Math.cos(mid);
    const ly = cy + labelR * Math.sin(mid);
    const rawRot = i * angle + angle / 2;
    const labelRot = rawRot > 90 && rawRot < 270 ? rawRot + 180 : rawRot;

    return { prize, path, lx, ly, labelRot, i };
  });

  return (
    <div className="wheel-stage">
      <p className="wheel-greeting" data-testid="wheel-greeting">
        {userName ? t("spin.greetingNamed", { name: userName }) : t("spin.greeting")}
      </p>

      <div className={`wheel-frame ${glowPulse ? "is-spinning" : ""}`}>
        {/* Pointer */}
        <div
          className="wheel-pointer"
          style={{
            transform: `translateX(-50%) rotate(${pointerKick ? -14 : 0}deg)`,
          }}
        >
          <svg width="36" height="48" viewBox="0 0 36 48" aria-hidden>
            <defs>
              <linearGradient id="ptrGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F0D78C" />
                <stop offset="50%" stopColor="#C4A35A" />
                <stop offset="100%" stopColor="#8A6E2F" />
              </linearGradient>
            </defs>
            <path
              d="M18 46 C18 46 2 28 2 16 C2 7.7 9.2 1 18 1 C26.8 1 34 7.7 34 16 C34 28 18 46 18 46Z"
              fill="url(#ptrGold)"
              stroke="#5C4A1E"
              strokeWidth="1.2"
            />
            <circle cx="18" cy="16" r="5" fill="#1A2E28" opacity="0.35" />
          </svg>
        </div>

        {/* Outer rim lights */}
        <div className="wheel-lights" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="wheel-light"
              style={{
                transform: `rotate(${i * 15}deg) translateY(calc(var(--wheel-r) * -1))`,
                animationDelay: `${(i % 3) * 0.15}s`,
              }}
            />
          ))}
        </div>

        <div
          ref={wheelRef}
          className="wheel-disk"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="wheel-svg"
            role="img"
            aria-label={t("spin.wheelLabel")}
          >
            <defs>
              {prizes.map((p, i) => (
                <linearGradient
                  key={p.id}
                  id={`seg-${i}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={p.colorAlt} />
                  <stop offset="100%" stopColor={p.color} />
                </linearGradient>
              ))}
              <radialGradient id="hubGold" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#F0D78C" />
                <stop offset="55%" stopColor="#C4A35A" />
                <stop offset="100%" stopColor="#6B5420" />
              </radialGradient>
            </defs>

            {/* Segments */}
            {segments.map(({ prize, path, lx, ly, labelRot, i }) => (
              <g key={`${prize.id}-${i}`}>
                <path d={path} fill={`url(#seg-${i})`} stroke="#0A1F1A" strokeWidth="1.5" />
                <g transform={`translate(${lx}, ${ly}) rotate(${labelRot})`}>
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={prize.textColor}
                    fontSize={labelSize}
                    fontWeight="700"
                    fontFamily="var(--font-cairo), sans-serif"
                    style={{ letterSpacing: "0.02em" }}
                  >
                    {prizeLabel(prize, locale)}
                  </text>
                </g>
              </g>
            ))}

            {/* Rim ring */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="#C4A35A"
              strokeWidth="6"
              opacity="0.95"
            />
            <circle
              cx={cx}
              cy={cy}
              r={radius - 5}
              fill="none"
              stroke="#5C4A1E"
              strokeWidth="1.5"
              opacity="0.5"
            />

            {/* Center hub */}
            <circle cx={cx} cy={cy} r="38" fill="#1A2E28" />
            <circle cx={cx} cy={cy} r="30" fill="url(#hubGold)" />
            <circle cx={cx} cy={cy} r="12" fill="#0F2A24" />
            <circle cx={cx} cy={cy} r="5" fill="#F0D78C" />
          </svg>
        </div>
        <div className="wheel-stand" aria-hidden />
      </div>

      <button
        type="button"
        className="spin-btn"
        data-testid="spin-btn"
        onClick={requestSpin}
        disabled={spinning || disabled}
        aria-busy={spinning}
      >
        {spinning ? (
          <span className="spin-btn-label">{t("spin.spinning")}</span>
        ) : (
          <span className="spin-btn-label">{t("spin.button")}</span>
        )}
      </button>

      <ul className="prize-legend" aria-label={t("spin.legend")}>
        {prizes.map((p) => (
          <li key={p.id}>
            <span className="legend-dot" style={{ background: p.color }} />
            {prizeLabel(p, locale)}
          </li>
        ))}
      </ul>
    </div>
  );
});

export default SpinWheel;
