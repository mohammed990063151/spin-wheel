import { sendSms } from "@/lib/sms";
import { notifyRegistration as notifyWhatsAppRegistration, notifySpinWin } from "@/lib/whatsapp";

async function sendGuestSms(phone: string, message: string) {
  try {
    const result = await sendSms(message, phone);
    if (!result.ok) console.error("[sms] guest notify failed", result.message);
  } catch (err) {
    console.error("[sms] guest notify failed", err);
  }
}

/** Never throws — SMS/WhatsApp failure must not block the guest flow. */
export async function notifyWin(input: {
  name: string;
  phone: string;
  brand: string;
  brandName: string;
  prizeId: string;
  prizeLabel: string;
  prizeDescription?: string;
}) {
  await Promise.all([
    sendGuestSms(input.phone, winSms(input)),
    notifySpinWin({
      ...input,
      prizeDescription: input.prizeDescription || winSms(input),
    }),
  ]);
}

function winSms(input: {
  name: string;
  brand: string;
  brandName: string;
  prizeId: string;
  prizeLabel: string;
}) {
  if (input.brand === "enala" && input.prizeId === "wallet_1000") {
    return `مبروك ${input.name} ربحت 1000 ريال بالمحفظة من إناله. ادخل موقع enala.sa ثم أدخل كود الربح ehg1000`;
  }
  if (input.brand === "enala") {
    return `مبروك ${input.name} ربحت ${input.prizeLabel} من إناله. ادخل موقع enala.sa لاستلام هديتك`;
  }
  return `مبروك ${input.name} ربحت ${input.prizeLabel} من ${input.brandName}`;
}

export async function notifySofaSaved(input: { name: string; phone: string }) {
  await sendGuestSms(input.phone, `أهلاً ${input.name} تم حفظ تصميم كنبتك لدى مصنع Place`);
}

export async function notifyVisitor(input: {
  name: string;
  phone: string;
  entity: string;
  entityLabel: string;
  clientType: string;
  clientTypeLabel: string;
  region?: string;
  regionLabel?: string;
  companyName?: string;
  source?: string;
  email?: string;
}) {
  await Promise.all([
    sendGuestSms(input.phone, `أهلاً ${input.name} تم تسجيل زيارتك لدى ${input.entityLabel} شكراً لك`),
    notifyWhatsAppRegistration(input),
  ]);
}
