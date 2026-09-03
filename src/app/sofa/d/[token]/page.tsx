import { notFound } from "next/navigation";
import SofaShareView from "@/components/sofa/SofaShareView";
import { findSofaDesign } from "@/lib/db";
import { isSofaConfig } from "@/lib/sofa";

export default async function SofaSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const row = findSofaDesign(token.replace(/[^a-z0-9]/gi, ""));
  if (!row) notFound();

  let config: unknown;
  try {
    config = JSON.parse(row.configJson);
  } catch {
    notFound();
  }
  if (!isSofaConfig(config)) notFound();

  return <SofaShareView name={row.name} config={config} />;
}
