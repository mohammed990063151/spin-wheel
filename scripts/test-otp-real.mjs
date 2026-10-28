import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = path.resolve(import.meta.dirname, "..");
const envFile = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const secret =
  envFile.match(/^OTP_SECRET=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "") ||
  "sakoon-spin-otp";

function toAsciiDigits(input) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return String(input ?? "")
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(eastern.indexOf(digit)));
}

function normalizePhone(input) {
  let digits = toAsciiDigits(input).replace(/\D/g, "");
  if (digits.startsWith("00966")) digits = digits.slice(5);
  else if (digits.startsWith("966")) digits = digits.slice(3);
  if (digits.startsWith("5") && digits.length === 9) digits = `0${digits}`;
  return digits;
}

function hashOtp(phone, code) {
  return createHash("sha256").update(`${phone}:${String(code)}:${secret}`).digest("hex");
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

const phone = "0590000111";
const normalized = normalizePhone(phone);
const code = "4242";
assert(normalized === "0590000111", "phone normalize");
assert(normalizePhone("٠٥٩٠٠٠٠١١١") === "0590000111", "arabic phone");
assert(toAsciiDigits("٤٢٤٢").replace(/\D/g, "").slice(0, 4) === "4242", "arabic otp");
assert(hashOtp(normalized, 4242) === hashOtp(normalized, "4242"), "number/string hash");
assert(hashOtp(normalized, code) !== hashOtp(normalized, "0000"), "wrong code differs");

const dbPath = path.join(root, "data", "spin.db");
const db = new DatabaseSync(dbPath);
const now = Date.now();
db.prepare("DELETE FROM otp_challenges WHERE phone = ?").run(normalized);
db.prepare(
  `INSERT INTO otp_challenges (phone, name, code_hash, expires_at, created_at)
   VALUES (?, ?, ?, ?, ?)`,
).run(normalized, "اختبار", hashOtp(normalized, code), now + 10 * 60 * 1000, now);
db.close();

async function postVerify(otp) {
  const res = await fetch("http://127.0.0.1:3000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "اختبار",
      phone,
      code: otp,
      brand: "guess",
    }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`verify HTTP ${res.status} body=${text.slice(0, 200) || "<empty>"}`);
  }
  return { status: res.status, json };
}

const { json } = await postVerify("٤٢٤٢");
const { json: wrongJson } = await postVerify("1111");

console.log("verify_status", json.status || "fail");
console.log("verify_error", json.loginphonefailed || json.errors || "none");
console.log("wrong_code_rejected", wrongJson.status === "true" ? "no" : "yes");

if (json.status !== "true") {
  process.exit(1);
}
if (wrongJson.status === "true") {
  console.error("wrong code was accepted");
  process.exit(1);
}

const db2 = new DatabaseSync(dbPath);
db2.prepare("DELETE FROM otp_challenges WHERE phone = ?").run(normalized);
db2.prepare(
  `INSERT INTO otp_challenges (phone, name, code_hash, expires_at, created_at)
   VALUES (?, ?, ?, ?, ?)`,
).run(normalized, "اختبار", hashOtp(normalized, code), Date.now() + 10 * 60 * 1000, Date.now());
db2.close();

const intl = await fetch("http://127.0.0.1:3000/api/auth/verify-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "اختبار",
    phone: "966590000111",
    code: "4242",
    brand: "sofa",
  }),
});
const intlJson = await intl.json();
if (intlJson.status !== "true") {
  throw new Error(`966 phone failed: ${intlJson.loginphonefailed || JSON.stringify(intlJson)}`);
}

const badSend = await fetch("http://127.0.0.1:3000/api/auth/send-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "", phone: "12" }),
});
const badSendJson = await badSend.json();
if (badSendJson.status === "true") {
  throw new Error("invalid send-otp was accepted");
}

console.log("PASS otp verify");
console.log("PASS 966 phone + sofa brand");
console.log("PASS send-otp rejects invalid input");
