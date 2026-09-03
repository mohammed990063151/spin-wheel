import { chromium } from "playwright";

const base = process.env.E2E_URL || "http://localhost:3001";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.addInitScript(() => sessionStorage.clear());

  await page.route("**/api/auth/send-otp", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "true", name: "أحمد", code_for_test: 1234 }),
    });
  });
  await page.route("**/api/auth/verify-otp", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "true",
        is_new: true,
        already_spun: false,
        name: "أحمد",
        phone: "0511111111",
        prize_label: null,
      }),
    });
  });
  await page.route("**/api/spin/complete", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByTestId("spin-btn").click();
  await page.getByTestId("auth-name").fill("أحمد");
  await page.getByTestId("auth-phone").fill("0511111111");
  await page.getByTestId("auth-send").click();
  await page.getByTestId("otp-code").waitFor({ state: "visible" });
  await page.getByTestId("otp-code").fill("1234");
  await page.getByTestId("otp-confirm").click();

  await page.waitForFunction(
    () => document.querySelector("[data-testid=otp-confirm]") === null,
    { timeout: 5000 },
  );

  const urlAfter = page.url();
  if (new URL(urlAfter).pathname !== "/") {
    throw new Error(`page navigated away after OTP: ${urlAfter}`);
  }

  await page.locator('[data-testid="spin-btn"][aria-busy="true"]').waitFor({
    timeout: 5000,
  });

  const greeting = (await page.getByTestId("wheel-greeting").textContent()) || "";
  if (!greeting.includes("أحمد")) {
    throw new Error(`expected greeting with name, got: ${greeting}`);
  }

  console.log("PASS: OTP then wheel spins without returning to register");
  await browser.close();
}

main().catch(async (err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
