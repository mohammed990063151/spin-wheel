import { NextResponse } from "next/server";
import { createParticipant, findParticipant, saveSofaDesign } from "@/lib/db";
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
  try {
    if (!findParticipant(phone, "sofa")) {
      createParticipant(name, phone, "sofa");
    }
  } catch (error) {
    console.error("[sofa-save] participant", error);
  }

  // The token itself carries the whole design, so the share link works without
  // a database (Vercel's filesystem is ephemeral and would 404 otherwise).
  const token = encodeSofaShare({ name, config });
  try {
    saveSofaDesign({
      token,
      name,
      phone,
      configJson: JSON.stringify(config),
    });
  } catch (error) {
    console.error("[sofa-save] store", error);
  }

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
