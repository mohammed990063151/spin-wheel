import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000/?kiosk=1";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.addInitScript(() => {
  let fs = null;
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => fs,
  });
  const enter = async function () {
    fs = document.documentElement;
    document.dispatchEvent(new Event("fullscreenchange"));
  };
  const exit = async function () {
    fs = null;
    document.dispatchEvent(new Event("fullscreenchange"));
  };
  Document.prototype.requestFullscreen = enter;
  Document.prototype.exitFullscreen = exit;
  HTMLElement.prototype.requestFullscreen = enter;
  HTMLElement.prototype.exitFullscreen = exit;
  const nativeMatch = window.matchMedia.bind(window);
  window.matchMedia = (query) => {
    if (String(query).includes("display-mode")) {
      return {
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() {
          return false;
        },
      };
    }
    return nativeMatch(query);
  };
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector(".kiosk-unlock-dot", { timeout: 30000 });
await page.evaluate(() => {
  sessionStorage.removeItem("spin-desk");
  sessionStorage.removeItem("spin-kiosk-pause");
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".kiosk-unlock-dot", { timeout: 30000 });
await page.waitForTimeout(800);

const enterBtn = page.locator(".kiosk-enter");
if (await enterBtn.count()) {
  await enterBtn.click();
  await page.waitForTimeout(200);
}

await page.locator(".kiosk-unlock-dot").evaluate((el) => el.click());
await page.waitForSelector(".kiosk-pin input", { timeout: 10000 });
await page.locator(".kiosk-pin input").fill("0000");
await page.locator(".kiosk-pin button[type=submit]").click();
await page.waitForTimeout(400);

const afterUnlock = await page.evaluate(() => ({
  pause: sessionStorage.getItem("spin-kiosk-pause"),
  kiosk: document.documentElement.classList.contains("kiosk-mode"),
  fs: Boolean(document.fullscreenElement),
  dot: Boolean(document.querySelector(".kiosk-unlock-dot")),
  overlay: Boolean(document.querySelector(".kiosk-enter")),
}));

if (afterUnlock.pause !== "1") {
  throw new Error(`unlock did not pause: ${JSON.stringify(afterUnlock)}`);
}
if (afterUnlock.dot) {
  throw new Error(`unlock button should hide after cancel: ${JSON.stringify(afterUnlock)}`);
}
if (!afterUnlock.overlay) {
  throw new Error(`resume overlay missing after cancel: ${JSON.stringify(afterUnlock)}`);
}

const overlay = page.locator(".kiosk-enter");
if (!(await overlay.count())) {
  throw new Error("resume overlay missing after cancel");
}
await overlay.click();
await page.waitForTimeout(500);

const afterClick = await page.evaluate(() => ({
  pause: sessionStorage.getItem("spin-kiosk-pause"),
  kiosk: document.documentElement.classList.contains("kiosk-mode"),
  fs: Boolean(document.fullscreenElement),
  dot: Boolean(document.querySelector(".kiosk-unlock-dot")),
}));

if (afterClick.pause) {
  throw new Error(`click did not resume: ${JSON.stringify(afterClick)}`);
}
if (!afterClick.dot) {
  throw new Error(`unlock button did not return: ${JSON.stringify(afterClick)}`);
}
if (!afterClick.kiosk && !afterClick.fs) {
  throw new Error(`screen did not fill again: ${JSON.stringify(afterClick)}`);
}

console.log("PASS", { afterUnlock, afterClick });
await browser.close();
