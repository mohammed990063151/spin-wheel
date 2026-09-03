import { notFound } from "next/navigation";
import SofaShareView from "@/components/sofa/SofaShareView";
import { decodeSofaShare } from "@/lib/sofa-share";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SofaSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // The token carries the whole design — no database lookup needed.
  const shared = decodeSofaShare(decodeURIComponent(token));
  if (!shared) notFound();

  return <SofaShareView name={shared.name} config={shared.config} />;
}
