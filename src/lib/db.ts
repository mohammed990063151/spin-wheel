import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ChannelId } from "@/lib/channels";

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

const globalForDb = globalThis as unknown as { spinDb?: DatabaseSync };

function dbFilePath() {
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
  db.exec("PRAGMA journal_mode = WAL");
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
) {
  const spunAt = new Date().toISOString();
  return getDb()
    .prepare(
      `UPDATE participants
       SET prize_id = ?, prize_label = ?, spun_at = ?
       WHERE phone = ? AND brand = ? AND spun_at IS NULL`,
    )
    .run(prizeId, prizeLabel, spunAt, phone, brand);
}

export function replaceOtpChallenge(input: {
  phone: string;
  name: string;
  codeHash: string;
  expiresAt: number;
}) {
  const db = getDb();
  db.prepare("DELETE FROM otp_challenges WHERE phone = ?").run(input.phone);
  db.prepare(
    `INSERT INTO otp_challenges (phone, name, code_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(input.phone, input.name, input.codeHash, input.expiresAt, Date.now());
}

export function latestOtp(phone: string): OtpChallenge | undefined {
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
  };
}

export function clearOtp(phone: string) {
  getDb().prepare("DELETE FROM otp_challenges WHERE phone = ?").run(phone);
}
