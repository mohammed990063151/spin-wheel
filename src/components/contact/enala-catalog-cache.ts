import type { EnalaCatalogItem } from "@/lib/enala";

const TTL_MS = 5 * 60_000;
let memory: { items: EnalaCatalogItem[]; at: number } | null = null;
let inflight: Promise<EnalaCatalogItem[]> | null = null;
const details = new Map<number, EnalaCatalogItem>();

export function peekEnalaCatalog() {
  if (!memory) return null;
  return memory.items;
}

export function prefetchEnalaCatalog() {
  void loadEnalaCatalog().catch(() => undefined);
}

export async function loadEnalaCatalog(force = false) {
  if (!force && memory && Date.now() - memory.at < TTL_MS) return memory.items;
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch("/api/enala/catalog?group=1&per_page=120&slim=1", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const json = (await res.json()) as { ok?: boolean; items?: EnalaCatalogItem[] };
    if (!json.ok) throw new Error("enala catalog failed");
    const items = json.items ?? [];
    memory = { items, at: Date.now() };
    return items;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export async function loadEnalaCatalogItem(id: number) {
  const cached = details.get(id);
  if (cached && (cached.images?.length || 0) > 1) return cached;
  try {
    const res = await fetch(`/api/enala/catalog?id=${id}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const json = (await res.json()) as { ok?: boolean; data?: EnalaCatalogItem | null };
    if (!json.ok || !json.data) return cached ?? null;
    details.set(id, json.data);
    return json.data;
  } catch {
    return cached ?? null;
  }
}
