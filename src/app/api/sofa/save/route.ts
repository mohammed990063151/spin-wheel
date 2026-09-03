import { NextResponse } from "next/server";
import { createParticipant, findParticipant } from "@/lib/db";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { affSaveSofa, clientMeta } from "@/lib/aff";
import {
  estimateSofaPrice,
  getFabricColor,
  sofaStyleTag,
  sofaSummary,
  type SofaConfig,
} from "@/lib/sofa";

function isSofaConfig(value: unknown): value is SofaConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as SofaConfig;
  return (
    [2, 3, 4, 5].includes(Number(config.seats)) &&
    typeof config.arm === "string" &&
    typeof config.legs === "string" &&
    typeof config.fabricColor === "string" &&
    typeof config.fabricType === "string" &&
    typeof config.pillows === "string"
  );
}

export async function POST(request: Request) {
  let body: { name?: string; phone?: string; config?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: "بيانات غير صحيحة" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const phone = normalizePhone(body.phone ?? "");
  if (!name || !isValidPhone(phone) || !isSofaConfig(body.config)) {
    return NextResponse.json({ ok: false, message: "أكمل البيانات أولاً" }, { status: 400 });
  }

  const config = body.config;
  if (!findParticipant(phone, "sofa")) {
    createParticipant(name, phone, "sofa");
  }

  const color = getFabricColor(config.fabricColor);
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
    return NextResponse.json({ ok: false, message: aff.message || "تعذر الحفظ" }, { status: 422 });
  }

  return NextResponse.json({ ok: true });
}
