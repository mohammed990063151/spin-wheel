import { notFound } from "next/navigation";
import SofaShareView from "@/components/sofa/SofaShareView";
import { findSofaDesign } from "@/lib/db";
import { decodeSofaShare } from "@/lib/sofa-share";
import { isSofaConfig } from "@/lib/sofa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SofaSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const raw = decodeURIComponent(token);

  // Preferred path: the token carries the design, so no database is needed.
  const shared = decodeSofaShare(raw);
  if (shared) {
    return <SofaShareView name={shared.name} config={shared.config} />;
  }

  // Fallback for older, database-backed tokens (local development).
  try {
    const row = findSofaDesign(raw.replace(/[^a-z0-9]/gi, ""));
    if (row) {
      const config = JSON.parse(row.configJson);
      if (isSofaConfig(config)) {
        return <SofaShareView name={row.name} config={config} />;
      }
    }
  } catch {
    // ignore and fall through to notFound
  }

  notFound();
}
