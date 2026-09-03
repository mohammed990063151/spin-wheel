"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { toAsciiDigits } from "@/lib/phone";

export interface UserData {
  name: string;
  phone: string;
}

interface UserFormProps {
  onSubmit: (data: UserData) => void;
  submitLabel?: string;
  disabled?: boolean;
}

export default function UserForm({
  onSubmit,
  submitLabel,
  disabled = false,
}: UserFormProps) {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [shaking, setShaking] = useState(false);

  const validate = () => {
    const next: { name?: string; phone?: string } = {};
    if (!name.trim() || name.trim().length < 2) {
      next.name = t("auth.nameRequired");
    }
    const digits = toAsciiDigits(phone).replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) {
      next.phone = t("auth.phoneInvalid");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (disabled) return;
    if (!validate()) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    onSubmit({ name: name.trim(), phone: phone.trim() });
  };

  return (
    <div className={`form-panel ${shaking ? "shake" : ""}`}>
      <div className="form-field">
        <label htmlFor="name">{t("auth.name")}</label>
        <input
          id="name"
          data-testid="auth-name"
          type="text"
          autoComplete="name"
          placeholder={t("auth.namePlaceholder")}
          value={name}
          disabled={disabled}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
          }}
          aria-invalid={!!errors.name}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="phone">{t("auth.phone")}</label>
        <input
          id="phone"
          data-testid="auth-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="05xxxxxxxx"
          dir="ltr"
          value={phone}
          disabled={disabled}
          onChange={(e) => {
            setPhone(e.target.value);
            if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          aria-invalid={!!errors.phone}
        />
        <p className="field-hint">{t("auth.phoneHint")}</p>
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </div>

      <button
        type="button"
        className="cta-btn"
        data-testid="auth-send"
        disabled={disabled}
        onClick={submit}
      >
        <span>{submitLabel ?? t("auth.send")}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
