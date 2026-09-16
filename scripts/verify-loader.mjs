import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const url = "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "msedge", headless: true });

await fs.mkdir("artifacts", { recursive: true });

const verifyViewport = async (width, height, name) => {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });
  const loader = page.locator("#brand-loader");

  await loader.waitFor({ state: "visible" });
  assert.equal(await loader.getAttribute("role"), "status");
  assert.equal(await loader.getAttribute("aria-live"), "polite");
  assert.equal(
    await page.locator("body").evaluate((node) => node.className),
    "is-booting",
  );

  await page.waitForTimeout(260);
  await page.screenshot({ path: `artifacts/loader-${name}.png` });

  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(dimensions.scrollWidth <= width + 1);

  await loader.waitFor({ state: "detached", timeout: 3000 });
  assert.equal(
    await page.locator("body").evaluate((node) => node.className),
    "",
  );
  assert.equal(
    await page
      .locator("#root")
      .evaluate((node) => getComputedStyle(node).opacity),
    "1",
  );

  await context.close();
  console.log(`PASS branded loader at ${width}px`);
};

await verifyViewport(1440, 900, "desktop");
await verifyViewport(375, 812, "mobile");

const reducedContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
const reducedPage = await reducedContext.newPage();
await reducedPage.route("**/*.woff2", async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 220));
  await route.continue();
});
await reducedPage.goto(url, { waitUntil: "domcontentloaded" });

const reducedAnimation = await reducedPage
  .locator(".brand-loader__mark")
  .evaluate((node) => getComputedStyle(node).animationName);
assert.equal(reducedAnimation, "none");
await reducedPage.locator("#brand-loader").waitFor({
  state: "detached",
  timeout: 3000,
});
assert.equal(
  await reducedPage
    .locator("#root")
    .evaluate((node) => getComputedStyle(node).opacity),
  "1",
);
console.log("PASS reduced motion uses a simple fade");

await reducedContext.close();
await browser.close();
