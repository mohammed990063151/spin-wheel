"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useLocale } from "@/components/LocaleProvider";

export default function SofaSaveModal({
  open,
  shareUrl,
  onClose,
}: {
  open: boolean;
  shareUrl: string;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [qrImage, setQrImage] = useState("");

  useEffect(() => {
    if (!open || !shareUrl) return;
    let cancelled = false;
    void QRCode.toDataURL(shareUrl, {
      width: 720,
      margin: 1,
      color: { dark: "#1a1408", light: "#f8f1de" },
      errorCorrectionLevel: "M",
    }).then((url) => {
      if (!cancelled) setQrImage(url);
    });
    return () => {
      cancelled = true;
    };
  }, [open, shareUrl]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="sofa-qr-title">
      <div className="modal-card sofa-qr-card">
        <p className="modal-eyebrow">{t("sofa.saved")}</p>
        <h2 id="sofa-qr-title" className="modal-title">
          {t("sofa.qrTitle")}
        </h2>
        <p className="modal-desc">{t("sofa.qrLead")}</p>
        {qrImage ? (
          <img className="sofa-qr-code" src={qrImage} alt={t("sofa.qrTitle")} />
        ) : (
          <div className="sofa-qr-code is-empty" />
        )}
        <p className="sofa-qr-hint">{t("sofa.qrScan")}</p>
        <div className="modal-actions sofa-qr-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            {t("sofa.closeQr")}
          </button>
        </div>
      </div>
    </div>
  );
}
