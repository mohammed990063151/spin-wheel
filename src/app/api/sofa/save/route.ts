import { NextResponse } from "next/server";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { affSaveSofa, clientMeta } from "@/lib/aff";
import { parseLocale, t } from "@/lib/i18n";
import { encodeSofaShare } from "@/lib/sofa-share";
import {
  estimateSofaPrice,
  getFabricColor,
  isSofaConfig,
  sofaStyleTag,
  sofaSummary,
} from "@/lib/sofa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { name?: string; phone?: string; config?: unknown; locale?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: t("ar", "api.invalidData") }, { status: 400 });
  }

  const locale = parseLocale(body.locale);
  const name = (body.name ?? "").trim();
  const phone = normalizePhone(body.phone ?? "");
  if (!name || !isValidPhone(phone) || !isSofaConfig(body.config)) {
    return NextResponse.json({ ok: false, message: t(locale, "api.saveIncomplete") }, { status: 400 });
  }

  const config = body.config;

  // The token carries the whole design, so the share link works without any
  // local database — aff keeps the record for the Place team.
  const token = encodeSofaShare({ name, config });

  const color = getFabricColor(config.fabricColor);
  try {
    const aff = await affSaveSofa({
      name,
      phone,
      seats: config.seats,
      arm_style: config.arm,
      leg_style: config.legs,
      fabric_color: config.fabricColor,
      fabric_color_hex: color.hex,
      fabric_type: config.fabricType,
      pillows: config.pillows,
      estimated_price: estimateSofaPrice(config),
      summary: sofaSummary(config),
      style_tag: sofaStyleTag(config),
      config,
      ...clientMeta(request),
    });
    if (aff && aff.ok === false) {
      console.error("[sofa-save] aff", aff.message);
    }
  } catch (error) {
    console.error("[sofa-save] aff", error);
  }

  return NextResponse.json({
    ok: true,
    token,
    sharePath: `/sofa/d/${token}`,
  });
}
