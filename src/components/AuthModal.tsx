"use client";

import { useEffect, useRef, useState } from "react";
import UserForm, { type UserData } from "@/components/UserForm";
import { useLocale } from "@/components/LocaleProvider";
import type { ChannelId } from "@/lib/channels";
import { normalizeOtpCode } from "@/lib/phone";

export interface AuthUser extends UserData {
  alreadySpun: boolean;
  prizeLabel?: string | null;
}

interface AuthModalProps {
  open: boolean;
  brand: ChannelId;
  onClose: () => void;
  onVerified: (user: AuthUser) => void;
  variant?: "spin" | "sofa" | "guess";
}

type Step = "register" | "otp";

export default function AuthModal({
  open,
  brand,
  onClose,
  onVerified,
  variant = "spin",
}: AuthModalProps) {
  const { locale, t } = useLocale();
  const [step, setStep] = useState<Step>("register");
  const [pending, setPending] = useState<UserData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  const registerTitle =
    variant === "sofa"
      ? t("auth.sofa.registerTitle")
      : variant === "guess"
        ? t("auth.guess.registerTitle")
        : t("auth.registerTitle");
  const lead =
    variant === "sofa"
      ? t("auth.sofa.lead")
      : variant === "guess"
        ? t("auth.guess.lead")
        : t("auth.lead");

  useEffect(() => {
    if (open && step === "otp") {
      const timeout = setTimeout(() => codeRef.current?.focus(), 80);
      return () => clearTimeout(timeout);
    }
  }, [open, step]);

  if (!open) return null;

  const sendOtp = async (data: UserData) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...data, locale }),
      });
      const json = (await res.json()) as {
        status?: string;
        name?: string;
        errors?: { name?: string; phone?: string };
        loginphonefailed?: string;
        code_for_test?: number;
      };

      if (json.status === "true") {
        setPending(data);
        setStep("otp");
        setCode("");
        setDevCode(json.code_for_test ?? null);
        return;
      }

      setError(
        json.loginphonefailed ||
          json.errors?.phone ||
          json.errors?.name ||
          t("auth.genericError"),
      );
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } catch {
      setError(t("auth.genericError"));
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!pending || busyRef.current) return;
    const nextCode = normalizeOtpCode(code);
    if (nextCode.length !== 4) {
      setError(t("auth.codeLength"));
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    busyRef.current = true;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: pending.name,
          phone: pending.phone,
          code: nextCode,
          brand,
          locale,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        status?: string;
        name?: string;
        phone?: string;
        already_spun?: boolean;
        prize_label?: string | null;
        errors?: { code?: string; name?: string };
        loginphonefailed?: string;
      };

      if (json.status === "true") {
        onVerified({
          name: json.name || pending.name,
          phone: json.phone || pending.phone,
          alreadySpun: Boolean(json.already_spun),
          prizeLabel: json.prize_label,
        });
        return;
      }

      setError(json.loginphonefailed || json.errors?.code || t("auth.codeWrong"));
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } catch {
      setError(t("auth.genericError"));
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className={`modal-card auth-card ${shaking ? "shake" : ""}`}>
        <button type="button" className="auth-close" onClick={onClose} aria-label={t("auth.close")}>
          ×
        </button>
        <p className="modal-eyebrow">{t("auth.eyebrow")}</p>
        <h2 id="auth-title" className="modal-title">
          {step === "register" ? registerTitle : t("auth.otpTitle")}
        </h2>
        <p className="auth-lead">
          {step === "register" ? lead : t("auth.smsTo", { phone: pending?.phone ?? "" })}
        </p>

        {step === "register" ? (
          <UserForm
            submitLabel={loading ? t("auth.sending") : t("auth.send")}
            disabled={loading}
            onSubmit={sendOtp}
          />
        ) : (
          <div className="form-panel auth-form">
            <div className="form-field">
              <label htmlFor="otp-code">{t("auth.otpLabel")}</label>
              <input
                ref={codeRef}
                id="otp-code"
                data-testid="otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••"
                maxLength={4}
                dir="ltr"
                className="otp-input"
                value={code}
                onChange={(e) => {
                  setCode(normalizeOtpCode(e.target.value));
                  if (error) setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void verify();
                  }
                }}
                aria-invalid={!!error}
              />
            </div>
            {devCode != null && (
              <p className="auth-dev-code" data-testid="otp-dev-code">
                {t("auth.devCode", { code: devCode })}
              </p>
            )}
            {error && <span className="field-error">{error}</span>}
            <button
              type="button"
              className="cta-btn"
              data-testid="otp-confirm"
              disabled={loading}
              onClick={() => void verify()}
            >
              {loading ? t("auth.verifying") : t("auth.confirm")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={loading}
              onClick={() => pending && sendOtp(pending)}
            >
              {t("auth.resend")}
            </button>
            <button
              type="button"
              className="auth-switch"
              disabled={loading}
              onClick={() => {
                setStep("register");
                setCode("");
                setError("");
                setDevCode(null);
              }}
            >
              {t("auth.changePhone")}
            </button>
          </div>
        )}

        {step === "register" && error && (
          <p className="field-error auth-form-error">{error}</p>
        )}
      </div>
    </div>
  );
}
