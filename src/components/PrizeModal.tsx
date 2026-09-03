"use client";

import { useLocale } from "@/components/LocaleProvider";

interface PrizeModalProps {
  open: boolean;
  prizeLabel: string;
  prizeDescription: string;
  userName: string;
  isEmpty?: boolean;
  onClose: () => void;
}

export default function PrizeModal({
  open,
  prizeLabel,
  prizeDescription,
  userName,
  isEmpty = false,
  onClose,
}: PrizeModalProps) {
  const { t } = useLocale();
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="win-title">
      <div className={`modal-card ${isEmpty ? "is-miss" : ""}`}>
        {!isEmpty && <div className="modal-burst" aria-hidden />}
        <p className="modal-eyebrow">
          {isEmpty
            ? t("prize.betterLuck", { name: userName })
            : t("prize.congrats", { name: userName })}
        </p>
        <h2 id="win-title" className="modal-title">
          {isEmpty ? t("prize.missed") : t("prize.won")}
        </h2>
        <p className="modal-prize">{prizeLabel}</p>
        <p className="modal-desc">{prizeDescription}</p>
        <div className="modal-actions">
          <button type="button" className="cta-btn" onClick={onClose}>
            {t("prize.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
