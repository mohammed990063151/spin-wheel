"use client";

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
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="win-title">
      <div className={`modal-card ${isEmpty ? "is-miss" : ""}`}>
        {!isEmpty && <div className="modal-burst" aria-hidden />}
        <p className="modal-eyebrow">
          {isEmpty ? `حظ أوفر ${userName}` : `مبروك ${userName}`}
        </p>
        <h2 id="win-title" className="modal-title">
          {isEmpty ? "لم تربح" : "ربحت"}
        </h2>
        <p className="modal-prize">{prizeLabel}</p>
        <p className="modal-desc">{prizeDescription}</p>
        <div className="modal-actions">
          <button type="button" className="cta-btn" onClick={onClose}>
            عميل جديد
          </button>
        </div>
      </div>
    </div>
  );
}
