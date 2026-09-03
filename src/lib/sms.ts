type SmsResult = { ok: true } | { ok: false; message: string };

function smsConfigured() {
  return Boolean(
    process.env.SMS_URL &&
      process.env.SMS_API_KEY &&
      process.env.SMS_USERNAME &&
      process.env.SMS_SENDER,
  );
}

export function isSmsConfigured() {
  return smsConfigured();
}

export function isSmsDebug() {
  if (process.env.SMS_DEBUG === "1") return true;
  return !smsConfigured() && process.env.NODE_ENV !== "production";
}

/** Same gateway contract as enala SendSMS (form POST, success data.code === '100'). */
export async function sendSms(message: string, number: string): Promise<SmsResult> {
  if (!smsConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, message: "خدمة الرسائل غير مهيأة" };
    }
    console.warn("[sms] credentials missing — skipping send in development");
    return { ok: true };
  }

  const body = new URLSearchParams({
    api_key: process.env.SMS_API_KEY!,
    username: process.env.SMS_USERNAME!,
    message,
    numbers: number,
    sender: process.env.SMS_SENDER!,
    unicode: "u",
    return: "full",
  });

  try {
    const res = await fetch(process.env.SMS_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const raw = await res.text();
    let parsed: { data?: { code?: string | number }; code?: string | number } = {};
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      return { ok: false, message: "هناك خطأ ما حاول مرة اخري" };
    }

    const code = String(parsed?.data?.code ?? parsed?.code ?? "");
    if (code === "100" || code === "1") return { ok: true };

    console.error("[sms] gateway rejected", raw);
    return { ok: false, message: "هناك خطأ ما حاول مرة اخري" };
  } catch (err) {
    console.error("[sms] request failed", err);
    return { ok: false, message: "هناك خطأ ما حاول مرة اخري" };
  }
}

export function otpMessage(code: number) {
  return `كود التفعيل: ${code} Place`;
}
