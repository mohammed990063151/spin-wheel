import { isSofaConfig, type SofaConfig } from "@/lib/sofa";

export type SofaSharePayload = {
  name: string;
  config: SofaConfig;
};

function toBase64Url(input: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized, "base64").toString("utf8");
  }
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Pack the whole design into a URL-safe token so the QR needs no database. */
export function encodeSofaShare(payload: SofaSharePayload): string {
  const compact = {
    n: payload.name,
    c: [
      payload.config.seats,
      payload.config.arm,
      payload.config.legs,
      payload.config.fabricColor,
      payload.config.fabricType,
      payload.config.pillows,
    ],
  };
  return toBase64Url(JSON.stringify(compact));
}

export function decodeSofaShare(token: string): SofaSharePayload | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as {
      n?: unknown;
      c?: unknown[];
    };
    if (!Array.isArray(parsed.c) || parsed.c.length < 6) return null;
    const config = {
      seats: Number(parsed.c[0]),
      arm: parsed.c[1],
      legs: parsed.c[2],
      fabricColor: parsed.c[3],
      fabricType: parsed.c[4],
      pillows: parsed.c[5],
    };
    if (!isSofaConfig(config)) return null;
    return {
      name: typeof parsed.n === "string" ? parsed.n : "",
      config,
    };
  } catch {
    return null;
  }
}
