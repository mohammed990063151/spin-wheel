import { toE164 } from "@/lib/phone";

type TemplateKind = "win" | "register";
type WhatsAppResult = { ok: true } | { ok: false; message: string };

const DEFAULT_TEMPLATES: Record<TemplateKind, string> = {
  win: "مبروك {{customer_name}}! ربحت {{prize}} من {{brand_name}}.\n{{prize_description}}",
  register:
    "أهلاً {{customer_name}}، تم تسجيل بياناتك لدى {{entity_label}}. شكراً لزيارتك.",
};

function apiBase() {
  return (process.env.WHATSAPP_API_URL ?? "").replace(/\/$/, "");
}

function apiKey() {
  return process.env.WHATSAPP_API_KEY ?? "";
}

function sender() {
  return (process.env.WHATSAPP_FROM ?? "").trim();
}

function templateId(kind: TemplateKind) {
  const value =
    kind === "win"
      ? process.env.WHATSAPP_WIN_TEMPLATE_ID
      : process.env.WHATSAPP_REGISTER_TEMPLATE_ID;
  return value?.trim() || "";
}

function templateName(kind: TemplateKind) {
  const value =
    kind === "win"
      ? process.env.WHATSAPP_WIN_TEMPLATE_NAME
      : process.env.WHATSAPP_REGISTER_TEMPLATE_NAME;
  return value?.trim() || (kind === "win" ? "spin_win" : "spin_register");
}

function fallbackContent(kind: TemplateKind) {
  const value =
    kind === "win"
      ? process.env.WHATSAPP_WIN_TEMPLATE
      : process.env.WHATSAPP_REGISTER_TEMPLATE;
  return value?.trim() || DEFAULT_TEMPLATES[kind];
}

export function isWhatsAppConfigured() {
  return Boolean(apiBase() && apiKey() && sender());
}

function renderTemplate(content: string, variables: Record<string, string>) {
  let rendered = content;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  return rendered;
}

async function whatsappFetch(path: string, init?: RequestInit) {
  return fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey()}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
}

type StoredTemplate = { id: string; name?: string; content?: string };

async function loadDashboardTemplate(kind: TemplateKind): Promise<StoredTemplate | null> {
  const id = templateId(kind);
  if (id) {
    const res = await whatsappFetch(`/templates/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as StoredTemplate;
  }

  const res = await whatsappFetch("/templates");
  if (!res.ok) return null;
  const list = (await res.json()) as StoredTemplate[];
  const name = templateName(kind);
  return list.find((item) => item.name === name) ?? null;
}

async function renderFromDashboard(
  template: StoredTemplate,
  variables: Record<string, string>,
) {
  if (template.id) {
    const preview = await whatsappFetch(`/templates/${template.id}/preview`, {
      method: "POST",
      body: JSON.stringify({ variables }),
    });
    if (preview.ok) {
      const json = (await preview.json()) as { rendered?: string };
      if (json.rendered?.trim()) return json.rendered;
    }
  }
  if (template.content?.trim()) return renderTemplate(template.content, variables);
  return null;
}

async function resolveMessage(kind: TemplateKind, variables: Record<string, string>) {
  try {
    const template = await loadDashboardTemplate(kind);
    if (template) {
      const rendered = await renderFromDashboard(template, variables);
      if (rendered?.trim()) return rendered;
    }
  } catch (err) {
    console.warn("[whatsapp] template api skipped", err);
  }
  return renderTemplate(fallbackContent(kind), variables);
}

async function sendText(phone: string, message: string): Promise<WhatsAppResult> {
  const to = toE164(phone);
  try {
    const res = await whatsappFetch("/messages/send", {
      method: "POST",
      body: JSON.stringify({
        from: sender(),
        to,
        type: "text",
        message,
      }),
    });
    const raw = await res.text();
    let parsed: { success?: boolean; message?: string } = {};
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      console.error("[whatsapp] non-json response", res.status, raw);
      return { ok: false, message: "whatsapp invalid response" };
    }
    if (!res.ok || parsed.success === false) {
      console.error("[whatsapp] send failed", res.status, raw);
      return { ok: false, message: parsed.message || "whatsapp send failed" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[whatsapp] request failed", err);
    return { ok: false, message: "whatsapp request failed" };
  }
}

async function sendTemplate(
  kind: TemplateKind,
  phone: string,
  variables: Record<string, string>,
): Promise<WhatsAppResult> {
  if (!isWhatsAppConfigured()) {
    console.warn("[whatsapp] not configured — skipping send");
    return { ok: true };
  }
  const message = await resolveMessage(kind, variables);
  return sendText(phone, message);
}

/** Never throws — a WhatsApp failure must not block spin/register. */
export async function notifySpinWin(input: {
  name: string;
  phone: string;
  brand: string;
  brandName: string;
  prizeId: string;
  prizeLabel: string;
  prizeDescription?: string;
}) {
  return sendTemplate("win", input.phone, {
    customer_name: input.name,
    name: input.name,
    prize: input.prizeLabel,
    prize_label: input.prizeLabel,
    prize_description: input.prizeDescription || input.prizeLabel,
    prize_id: input.prizeId,
    brand: input.brand,
    brand_name: input.brandName,
  });
}

export async function notifyRegistration(input: {
  name: string;
  phone: string;
  entity: string;
  entityLabel: string;
  clientType: string;
  clientTypeLabel: string;
  region?: string;
  regionLabel?: string;
  source?: string;
  email?: string;
}) {
  return sendTemplate("register", input.phone, {
    customer_name: input.name,
    name: input.name,
    entity: input.entity,
    entity_label: input.entityLabel,
    client_type: input.clientType,
    client_type_label: input.clientTypeLabel,
    region: input.region || "",
    region_label: input.regionLabel || "",
    source: input.source || "",
    email: input.email || "",
  });
}
