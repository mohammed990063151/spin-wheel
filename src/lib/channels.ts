export type ChannelId = "place" | "enala" | "sofa" | "guess";

export function isChannelId(value: string | undefined): value is ChannelId {
  return value === "place" || value === "enala" || value === "sofa" || value === "guess";
}
