import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const url = "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const report = { viewports: [], interactions: [], reducedMotion: [] };
await fs.mkdir("artifacts", { recursive: true });

const note = (group, message) => {
  report[group].push(message);
  console.log(`PASS ${message}`);
};

const addClsObserver = async (context) => {
  await context.addInitScript(() => {
    window.__storefrontCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__storefrontCls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
};

for (const width of [375, 768, 1440]) {
  const context = await browser.newContext({
    viewport: { width, height: width === 375 ? 812 : 1000 },
  });
  await addClsObserver(context);
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    document
      .querySelectorAll('img[loading="lazy"]')
      .forEach((image) => (image.loading = "eager"));
    await Promise.all(
      Array.from(document.images).map((image) =>
        image.decode().catch(() => {}),
      ),
    );
    for (const element of document.querySelectorAll("[data-reveal]")) {
      element.scrollIntoView({ block: "center" });
      await new Promise((resolve) => setTimeout(resolve, 90));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(450);
  const metrics = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    cls: window.__storefrontCls,
  }));
  assert.ok(
    metrics.scrollWidth <= width + 1,
    `Horizontal overflow at ${width}: ${metrics.scrollWidth}`,
  );
  assert.ok(metrics.cls < 0.1, `CLS at ${width}: ${metrics.cls}`);
  await page.screenshot({
    path: `artifacts/motion-${width}.png`,
    fullPage: true,
  });
  report.viewports.push(metrics);
  console.log(`PASS viewport ${width}, CLS ${metrics.cls.toFixed(4)}`);
  await context.close();
}

const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });

await page.locator("#coleccion").scrollIntoViewIfNeeded();
await page.waitForTimeout(250);
assert.ok(
  await page
    .locator(".site-header")
    .evaluate((node) => node.classList.contains("is-compact")),
);
note("interactions", "Header compacts after scrolling");

const indicatorBefore = await page
  .locator(".category-indicator")
  .evaluate((node) => getComputedStyle(node).transform);
await page.getByRole("button", { name: "Vestidos", exact: true }).click();
await page.waitForTimeout(260);
const indicatorAfter = await page
  .locator(".category-indicator")
  .evaluate((node) => getComputedStyle(node).transform);
assert.notEqual(indicatorAfter, indicatorBefore);
assert.equal(
  await page
    .getByRole("button", { name: "Vestidos", exact: true })
    .getAttribute("aria-pressed"),
  "true",
);
note("interactions", "Category pill slides and preserves aria-pressed");
await page.getByRole("button", { name: "Todo", exact: true }).click();

const firstCard = page.locator(".product-card").first();
const favorite = firstCard.locator(".favorite-button");
await favorite.click();
const favoriteAnimation = await favorite
  .locator("svg")
  .evaluate((node) =>
    node
      .getAnimations()
      .some((animation) => animation.animationName === "favorite-pop"),
  );
assert.ok(favoriteAnimation);
note("interactions", "Favorite heart runs spring feedback");

await page
  .getByRole("button", { name: "Ver toda la colección", exact: true })
  .click();
assert.equal(await page.locator(".product-card").count(), 6);
const flipAnimation = await page
  .locator(".product-card")
  .nth(4)
  .evaluate((node) => node.getAnimations().length > 0);
assert.ok(flipAnimation);
note("interactions", "Collection expansion uses FLIP entry motion");

await firstCard.getByRole("button", { name: /Ver Vestido satinado/ }).click();
await page.locator("#atelier").waitFor();
await page.waitForTimeout(450);
assert.ok(await page.locator(".product-card.is-selected").count());
const fadedCardOpacity = await page
  .locator(".product-card:not(.is-selected)")
  .first()
  .evaluate((node) => getComputedStyle(node).opacity);
assert.equal(fadedCardOpacity, "0.6");
note("interactions", "Selected product card keeps a distinct visual state");

await page.locator("#atelier").scrollIntoViewIfNeeded();
const linen = page.getByRole("button", { name: "Lino", exact: true }).first();
await linen.click();
await page.locator("#atelier .crossfade-outgoing").waitFor({ timeout: 1500 });
note("interactions", "Customizer image crossfades between variant states");

const size = page.locator("#product-sizes .size-chip").filter({ hasText: "M" });
await size.click();
assert.equal(await size.getAttribute("aria-pressed"), "true");
const fillTransform = await size.evaluate(
  (node) => getComputedStyle(node, "::before").transform,
);
assert.notEqual(fillTransform, "none");
note("interactions", "Size chip animates while retaining aria-pressed");

await page.locator("#atelier .add-button").click();
await page.getByRole("button", { name: /Añadido/ }).waitFor();
assert.ok(await page.locator(".badge-bounce").count());
note("interactions", "Add button confirms success and bag badge bounces");
await context.close();

const reducedContext = await browser.newContext({
  viewport: { width: 375, height: 812 },
  reducedMotion: "reduce",
});
const reducedPage = await reducedContext.newPage();
await reducedPage.goto(url, { waitUntil: "networkidle" });
const reducedState = await reducedPage.evaluate(() => {
  const hero = document.querySelector(".hero-photo img");
  const reveal = document.querySelector("[data-reveal]");
  const indicator = document.querySelector(".category-indicator");
  return {
    heroAnimation: hero ? getComputedStyle(hero).animationName : "missing",
    revealTransform: reveal ? getComputedStyle(reveal).transform : "missing",
    revealTransition: reveal
      ? getComputedStyle(reveal).transitionProperty
      : "missing",
    indicatorDuration: indicator
      ? getComputedStyle(indicator).transitionDuration
      : "missing",
    scrollWidth: document.documentElement.scrollWidth,
    width: innerWidth,
  };
});
assert.equal(reducedState.heroAnimation, "none");
assert.equal(reducedState.revealTransform, "none");
assert.ok(reducedState.revealTransition.includes("opacity"));
assert.equal(reducedState.indicatorDuration, "0s");
assert.ok(reducedState.scrollWidth <= reducedState.width + 1);
await reducedPage.locator("#coleccion").scrollIntoViewIfNeeded();
await reducedPage
  .getByRole("button", { name: "Vestidos", exact: true })
  .click();
assert.equal(
  await reducedPage
    .getByRole("button", { name: "Vestidos", exact: true })
    .getAttribute("aria-pressed"),
  "true",
);
await reducedPage.locator(".product-card .card-open-overlay").first().click();
await reducedPage.locator("#atelier .crossfade-outgoing").waitFor();
const reducedCrossfade = await reducedPage
  .locator("#atelier .crossfade-incoming")
  .evaluate((node) => getComputedStyle(node).transitionProperty);
assert.ok(reducedCrossfade.includes("opacity"));
note(
  "reducedMotion",
  "Reduced motion removes transforms while preserving fades and selection states",
);
await reducedContext.close();

await browser.close();
await fs.writeFile(
  "artifacts/motion-verification.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
