"use client";

import { useEffect, useRef, useState } from "react";
import UserForm, { type UserData } from "@/components/UserForm";
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
  registerTitle?: string;
  otpTitle?: string;
  lead?: string;
}

type Step = "register" | "otp";

export default function AuthModal({
  open,
  brand,
  onClose,
  onVerified,
  registerTitle = "سجّل ثم لف",
  otpTitle = "أدخل الكود",
  lead = "نرسل كود تأكيد برسالة",
}: AuthModalProps) {
  const [step, setStep] = useState<Step>("register");
  const [pending, setPending] = useState<UserData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && step === "otp") {
      const t = setTimeout(() => codeRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, step]);

  if (!open) return null;

  const sendOtp = async (data: UserData) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
          "هناك خطأ ما حاول مرة اخري",
      );
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } catch {
      setError("هناك خطأ ما حاول مرة اخري");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!pending) return;
    if (!code.trim()) {
      setError("الكود مطلوب");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pending.name,
          phone: pending.phone,
          code: normalizeOtpCode(code),
          brand,
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

      setError(json.loginphonefailed || json.errors?.code || "كود التحقق غير صحيح");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } catch {
      setError("هناك خطأ ما حاول مرة اخري");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className={`modal-card auth-card ${shaking ? "shake" : ""}`}>
        <button type="button" className="auth-close" onClick={onClose} aria-label="إغلاق">
          ×
        </button>
        <p className="modal-eyebrow">بالجوال</p>
        <h2 id="auth-title" className="modal-title">
          {step === "register" ? registerTitle : otpTitle}
        </h2>
        <p className="auth-lead">
          {step === "register" ? lead : `رسالة إلى ${pending?.phone ?? ""}`}
        </p>

        {step === "register" ? (
          <UserForm
            submitLabel={loading ? "جاري الإرسال..." : "أرسل الكود"}
            disabled={loading}
            onSubmit={sendOtp}
          />
        ) : (
          <div className="form-panel auth-form">
            <div className="form-field">
              <label htmlFor="otp-code">كود الرسالة</label>
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
                كود التجربة: {devCode}
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
              {loading ? "جاري التحقق..." : "تأكيد"}
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={loading}
              onClick={() => pending && sendOtp(pending)}
            >
              إعادة إرسال الكود
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
              تغيير الرقم
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
