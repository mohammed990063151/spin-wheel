import { NextResponse } from "next/server";
import { affSaveExhibitionLead, clientMeta } from "@/lib/aff";
import { parseLocale, t } from "@/lib/i18n";
import { isValidPhone, normalizePhone } from "@/lib/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLIENT_TYPES = new Set(["individuals", "companies"]);
const ENTITIES = new Set(["ehg", "place", "treeline"]);
const REGIONS = new Set(["central", "eastern", "western", "southern", "northern"]);
const SOURCES = new Set(["desk", "qr"]);

export async function POST(request: Request) {
  let body: {
    name?: string;
    phone?: string;
    email?: string;
    region?: string;
    clientType?: string;
    entity?: string;
    source?: string;
    notes?: string;
    locale?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: t("ar", "api.invalidData") }, { status: 400 });
  }

  const locale = parseLocale(body.locale);
  const name = (body.name ?? "").trim();
  const phone = normalizePhone(body.phone ?? "");
  const email = (body.email ?? "").trim();
  const region = (body.region ?? "").trim();
  const clientType = (body.clientType ?? "").trim();
  const entity = (body.entity ?? "").trim();
  const source = (body.source ?? "desk").trim();
  const notes = (body.notes ?? "").trim();

  if (!name) {
    return NextResponse.json({ ok: false, message: t(locale, "api.nameRequired") }, { status: 400 });
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json({ ok: false, message: t(locale, "api.phoneInvalid") }, { status: 400 });
  }
  if (!CLIENT_TYPES.has(clientType)) {
    return NextResponse.json({ ok: false, message: t(locale, "contact.typeRequired") }, { status: 400 });
  }
  if (!ENTITIES.has(entity)) {
    return NextResponse.json({ ok: false, message: t(locale, "contact.entityRequired") }, { status: 400 });
  }
  if (region && !REGIONS.has(region)) {
    return NextResponse.json({ ok: false, message: t(locale, "contact.regionRequired") }, { status: 400 });
  }
  if (!SOURCES.has(source)) {
    return NextResponse.json({ ok: false, message: t(locale, "api.invalidData") }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, message: t(locale, "contact.emailInvalid") }, { status: 400 });
  }

  const aff = await affSaveExhibitionLead({
    name,
    phone,
    email: email || undefined,
    region: region || undefined,
    client_type: clientType as "individuals" | "companies",
    entity: entity as "ehg" | "place" | "treeline",
    source: source as "desk" | "qr",
    notes: notes || undefined,
    ...clientMeta(request),
  });

  if (!aff || aff.ok === false) {
    return NextResponse.json(
      { ok: false, message: aff?.message || t(locale, "contact.saveFailed") },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
