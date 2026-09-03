import { chromium } from "playwright";

const base = process.env.E2E_URL || "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  await page.goto(base, { waitUntil: "networkidle" });

  const arabicTitle = (await page.locator(".gate-intro h1").textContent()) || "";
  if (!arabicTitle.includes("مسابقة")) {
    throw new Error(`expected Arabic home title, got: ${arabicTitle}`);
  }
  if ((await page.locator("html").getAttribute("dir")) !== "rtl") {
    throw new Error("home should start RTL");
  }

  await page.locator(".lang-switch button[lang='en']").click();
  await page.waitForFunction(() => document.documentElement.lang === "en");

  const englishTitle = (await page.locator(".gate-intro h1").textContent()) || "";
  if (!englishTitle.includes("Spin the Wheel")) {
    throw new Error(`expected English home title, got: ${englishTitle}`);
  }
  if ((await page.locator("html").getAttribute("dir")) !== "ltr") {
    throw new Error("English should switch to LTR");
  }

  await page.goto(`${base}/sofa`, { waitUntil: "networkidle" });
  const sofaTitle = (await page.locator(".studio-panel h1").textContent()) || "";
  if (!sofaTitle.toLowerCase().includes("build")) {
    throw new Error(`expected English sofa title, got: ${sofaTitle}`);
  }

  await page.goto(`${base}/guess`, { waitUntil: "networkidle" });
  const guessTitle = (await page.locator(".guess-intro h1").textContent()) || "";
  if (!guessTitle.toLowerCase().includes("guess")) {
    throw new Error(`expected English guess title, got: ${guessTitle}`);
  }

  await page.locator(".lang-switch button[lang='ar']").click();
  await page.waitForFunction(() => document.documentElement.lang === "ar");
  const guessAr = (await page.locator(".guess-intro h1").textContent()) || "";
  if (!guessAr.includes("خمن")) {
    throw new Error(`expected Arabic guess title, got: ${guessAr}`);
  }

  await page.goto(`${base}/place`, { waitUntil: "networkidle" });
  const spin = (await page.locator(".spin-btn-label").textContent()) || "";
  if (!spin.includes("لف")) {
    throw new Error(`expected Arabic spin button, got: ${spin}`);
  }

  console.log("PASS i18n switch ar/en across home, sofa, guess, place");
  await browser.close();
}

main().catch(async (err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
