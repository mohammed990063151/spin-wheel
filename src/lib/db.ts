import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ChannelId } from "@/lib/channels";
import { otpMatches } from "@/lib/otp";

export interface Participant {
  id: number;
  name: string;
  phone: string;
  brand: ChannelId;
  prize_id: string | null;
  prize_label: string | null;
  created_at: string;
  spun_at: string | null;
}

export interface OtpChallenge {
  id: number;
  phone: string;
  name: string;
  code_hash: string;
  expires_at: number;
  created_at: number;
}

const globalForDb = globalThis as unknown as {
  spinDb?: DatabaseSync;
  spinOtps?: OtpChallenge[];
};

function dbFilePath() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "spin.db");
  }
  return path.join(process.cwd(), "data", "spin.db");
}

function migrateParticipants(db: DatabaseSync) {
  const cols = db.prepare("PRAGMA table_info(participants)").all() as { name: string }[];
  if (!cols.length) return;
  if (cols.some((col) => col.name === "brand")) return;

  db.exec(`
    CREATE TABLE participants_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT 'place',
      prize_id TEXT,
      prize_label TEXT,
      created_at TEXT NOT NULL,
      spun_at TEXT,
      UNIQUE(phone, brand)
    );
    INSERT INTO participants_new (id, name, phone, brand, prize_id, prize_label, created_at, spun_at)
    SELECT id, name, phone, 'place', prize_id, prize_label, created_at, spun_at FROM participants;
    DROP TABLE participants;
    ALTER TABLE participants_new RENAME TO participants;
  `);
}

function openDb() {
  const file = dbFilePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  try {
    db.exec(process.env.VERCEL ? "PRAGMA journal_mode = DELETE" : "PRAGMA journal_mode = WAL");
  } catch (error) {
    console.error("[db journal]", error);
  }
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT 'place',
      prize_id TEXT,
      prize_label TEXT,
      created_at TEXT NOT NULL,
      spun_at TEXT,
      UNIQUE(phone, brand)
    );
    CREATE TABLE IF NOT EXISTS otp_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      name TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_challenges(phone);
    CREATE TABLE IF NOT EXISTS sofa_designs (
      token TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      config TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  migrateParticipants(db);
  return db;
}

export function getDb() {
  if (!globalForDb.spinDb) {
    globalForDb.spinDb = openDb();
  }
  return globalForDb.spinDb;
}

export function findParticipant(phone: string, brand: ChannelId): Participant | undefined {
  const row = getDb()
    .prepare("SELECT * FROM participants WHERE phone = ? AND brand = ?")
    .get(phone, brand) as Participant | undefined;
  return row;
}

export function createParticipant(
  name: string,
  phone: string,
  brand: ChannelId,
): Participant {
  const createdAt = new Date().toISOString();
  try {
    getDb()
      .prepare(
        "INSERT INTO participants (name, phone, brand, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(name, phone, brand, createdAt);
  } catch {
    const existing = findParticipant(phone, brand);
    if (existing) return existing;
    throw new Error("تعذر حفظ المشارك");
  }
  return findParticipant(phone, brand)!;
}

export function savePrize(
  phone: string,
  brand: ChannelId,
  prizeId: string,
  prizeLabel: string,
  options: { overwrite?: boolean } = {},
) {
  const spunAt = new Date().toISOString();
  const clause = options.overwrite
    ? "WHERE phone = ? AND brand = ?"
    : "WHERE phone = ? AND brand = ? AND spun_at IS NULL";
  return getDb()
    .prepare(
      `UPDATE participants
       SET prize_id = ?, prize_label = ?, spun_at = ?
       ${clause}`,
    )
    .run(prizeId, prizeLabel, spunAt, phone, brand);
}

export function replaceOtpChallenge(input: {
  phone: string;
  name: string;
  codeHash: string;
  expiresAt: number;
}) {
  const createdAt = Date.now();
  globalForDb.spinOtps = [
    {
      id: createdAt,
      phone: input.phone,
      name: input.name,
      code_hash: input.codeHash,
      expires_at: Number(input.expiresAt),
      created_at: createdAt,
    },
    ...(globalForDb.spinOtps ?? []),
  ].slice(0, 40);
  try {
    getDb()
      .prepare(
        `INSERT INTO otp_challenges (phone, name, code_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(input.phone, input.name, input.codeHash, input.expiresAt, createdAt);
  } catch (error) {
    console.error("[otp store sqlite]", error);
  }
}

export function latestOtp(phone: string): OtpChallenge | undefined {
  try {
    const row = getDb()
      .prepare(
        `SELECT * FROM otp_challenges WHERE phone = ? ORDER BY id DESC LIMIT 1`,
      )
      .get(phone) as OtpChallenge | undefined;
    if (!row) return undefined;
    return {
      ...row,
      expires_at: Number(row.expires_at),
      created_at: Number(row.created_at),
      code_hash: String(row.code_hash),
    };
  } catch (error) {
    console.error("[otp latest]", error);
    return (globalForDb.spinOtps ?? []).find((row) => row.phone === phone);
  }
}

export function findMatchingOtp(phones: string[], code: string): OtpChallenge | undefined {
  const unique = [...new Set(phones.filter(Boolean))];
  const now = Date.now();
  const freshMs = 15 * 60 * 1000;
  const isFresh = (row: OtpChallenge) => {
    const created = Number(row.created_at);
    if (Number.isFinite(created) && now - created >= 0 && now - created < freshMs) return true;
    return Number(row.expires_at) > now;
  };
  const rows: OtpChallenge[] = (globalForDb.spinOtps ?? []).filter(
    (row) => unique.includes(row.phone) && isFresh(row),
  );

  for (const phone of unique) {
    try {
      const found = getDb()
        .prepare(
          `SELECT * FROM otp_challenges WHERE phone = ? ORDER BY id DESC LIMIT 8`,
        )
        .all(phone) as OtpChallenge[];
      for (const row of found) {
        rows.push({
          ...row,
          expires_at: Number(row.expires_at),
          created_at: Number(row.created_at),
          code_hash: String(row.code_hash),
        });
      }
    } catch (error) {
      console.error("[otp lookup]", error);
    }
  }

  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.code_hash)) continue;
    seen.add(row.code_hash);
    if (!isFresh(row)) continue;
    if (unique.some((key) => otpMatches(key, code, row.code_hash) || otpMatches(row.phone, code, row.code_hash))) {
      return row;
    }
  }
  return undefined;
}

export function clearOtp(phone: string) {
  getDb().prepare("DELETE FROM otp_challenges WHERE phone = ?").run(phone);
  globalForDb.spinOtps = (globalForDb.spinOtps ?? []).filter((row) => row.phone !== phone);
}

export interface SavedSofaDesign {
  token: string;
  name: string;
  configJson: string;
  created_at: string;
}

export function saveSofaDesign(input: {
  token: string;
  name: string;
  phone: string;
  configJson: string;
}) {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS sofa_designs (
      token TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      config TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  getDb()
    .prepare(
      `INSERT INTO sofa_designs (token, name, phone, config, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(input.token, input.name, input.phone, input.configJson, new Date().toISOString());
}

export function findSofaDesign(token: string): SavedSofaDesign | undefined {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS sofa_designs (
      token TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      config TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  const row = getDb()
    .prepare("SELECT token, name, config, created_at FROM sofa_designs WHERE token = ?")
    .get(token) as
    | { token: string; name: string; config: string; created_at: string }
    | undefined;
  if (!row) return undefined;
  return {
    token: row.token,
    name: row.name,
    configJson: row.config,
    created_at: row.created_at,
  };
}
