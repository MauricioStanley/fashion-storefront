import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import assert from "node:assert/strict";

await fs.mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = { viewports: [], checks: [], errors: [], accessibility: [] };
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
page.on("pageerror", (e) => results.errors.push(e.message));
const url = "http://127.0.0.1:5173";
const check = (name) => {
  results.checks.push(name);
  console.log(`PASS ${name}`);
};
try {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 1024, 768, 430, 390, 360]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.evaluate(async () => {
      const elements = [...document.querySelectorAll("[data-reveal]")];
      for (const el of elements) {
        el.scrollIntoView();
        await new Promise((r) => setTimeout(r, 90));
      }
      document
        .querySelectorAll("[data-reveal]")
        .forEach((el) => el.classList.add("is-visible"));
      document
        .querySelectorAll('img[loading="lazy"]')
        .forEach((img) => (img.loading = "eager"));
      await Promise.all(
        [...document.images].map((img) => img.decode().catch(() => {})),
      );
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    results.viewports.push(dimensions);
    assert.ok(
      dimensions.scrollWidth <= width + 1,
      `Horizontal overflow at ${width}: ${dimensions.scrollWidth}`,
    );
    await page.screenshot({
      path: `artifacts/full-${width}.png`,
      fullPage: true,
    });
    await page.screenshot({ path: `artifacts/hero-${width}.png` });
    console.log(`PASS viewport ${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("#coleccion").scrollIntoViewIfNeeded();
  await page.waitForTimeout(450);
  await page.screenshot({ path: "artifacts/desktop-catalog-refined.png" });
  const headerBox = await page.locator(".site-header").boundingBox();
  assert.ok(headerBox.y >= 0 && headerBox.y < 30);
  await page.getByRole("button", { name: "Abrir bolsa, 0 prendas" }).click();
  await page.locator("dialog .suggestion-row").first().waitFor();
  assert.equal(await page.locator("dialog .suggestion-row").count(), 3);
  await page.keyboard.press("Escape");
  await page.locator("dialog").waitFor({ state: "detached" });
  check("Desktop persistent bag and useful empty recommendations");
  await page.getByRole("button", { name: "Vestidos", exact: true }).click();
  assert.equal(await page.locator(".product-card").count(), 1);
  check("Category filtering");
  await page.getByRole("button", { name: "Todo", exact: true }).click();
  const card = page.locator(".product-card").first();
  const original = await card.locator("img").getAttribute("src");
  await card.getByRole("button", { name: "Prenda", exact: true }).click();
  assert.notEqual(await card.locator("img").getAttribute("src"), original);
  check("Product / model view changes");
  await card.getByRole("button", { name: /Guardar.*favoritos/ }).click();
  assert.equal(
    await card
      .getByRole("button", { name: /Quitar.*favoritos/ })
      .getAttribute("aria-pressed"),
    "true",
  );
  check("Favorites toggle");
  await page
    .getByRole("button", { name: "Buscar prendas", exact: true })
    .click();
  await page.getByLabel("Buscar por prenda o material").fill("camiseta");
  assert.equal(await page.locator("dialog .search-result").count(), 1);
  await page.getByLabel("Buscar por prenda o material").fill("zzzzzzz");
  await page.locator("dialog .suggestions").waitFor();
  await page.getByRole("button", { name: "Buscar lino", exact: true }).click();
  assert.ok((await page.locator("dialog .search-result").count()) > 0);
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  assert.ok(
    await page.evaluate(() => !!document.activeElement?.closest("dialog")),
  );
  check("Search recovery suggestions and modal keyboard containment");
  await page.keyboard.press("Escape");
  await page.locator("dialog").waitFor({ state: "detached" });
  assert.equal(await page.locator("dialog").count(), 0);
  check("Search and Escape dismissal");
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Talla").selectOption("XL");
  await page.getByRole("button", { name: /Mostrar .* prendas/ }).click();
  await page.locator("dialog").waitFor({ state: "detached" });
  assert.equal(await page.locator(".product-card").count(), 4);
  assert.equal(
    await page
      .locator(".product-card")
      .filter({ hasText: "Vestido satinado" })
      .count(),
    0,
  );
  check("Size filter");
  await page
    .getByRole("button", { name: "Limpiar filtros", exact: false })
    .click();
  await page.locator("#atelier").scrollIntoViewIfNeeded();
  const builder = page.locator("#atelier");
  await page.waitForTimeout(450);
  await page.screenshot({ path: "artifacts/desktop-atelier-refined.png" });
  await builder.getByRole("button", { name: /Añadir a la bolsa/ }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Elige una talla" })
    .waitFor();
  check("Required size validation");
  await builder.getByRole("button", { name: "M", exact: true }).click();
  await builder.getByRole("button", { name: "Cacao", exact: true }).click();
  await builder.getByRole("button", { name: "Lino", exact: true }).click();
  await builder.locator(".inline-status.error").waitFor();
  assert.match(
    await builder.locator(".inline-status.error").innerText(),
    /Esta combinación está agotada/,
  );
  assert.ok(
    await builder
      .getByRole("button", { name: /Añadir a la bolsa/ })
      .isDisabled(),
  );
  check("Unavailable variant blocks purchase");
  await builder
    .getByRole("button", { name: "Ver alternativa disponible", exact: false })
    .click();
  await builder.getByRole("button", { name: "Relajado", exact: true }).click();
  assert.match(await builder.locator(".product-price").innerText(), /64/);
  check("Variant pricing");
  await builder.getByRole("button", { name: /Añadir a la bolsa/ }).click();
  await builder.locator(".added-feedback").waitFor();
  await builder
    .getByRole("button", { name: "Guardar mi combinación", exact: false })
    .click();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Abrir bolsa, 1 prendas" }).click();
  assert.equal(await page.locator(".cart-line").count(), 1);
  check("Cart persistence after reload");
  await page
    .getByRole("button", { name: "Sumar Sobrecamisa esencial" })
    .click();
  assert.equal(await page.locator(".quantity-controls>span").innerText(), "2");
  check("Quantity update");
  await page
    .getByRole("button", { name: "Revisar mi selección", exact: false })
    .click();
  await page.getByText("Tu selección está lista.", { exact: true }).waitFor();
  check("Demo checkout summary");
  await page.screenshot({ path: "artifacts/cart-desktop.png" });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Abrir favoritos", exact: true })
    .click();
  assert.equal(await page.locator(".favorite-row").count(), 1);
  assert.equal(await page.locator(".saved-design").count(), 1);
  check("Saved design and favorites persistence");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Tu talla, sin adivinar.", exact: false })
    .click();
  await page.getByLabel("Contorno de pecho (cm)").fill("40");
  assert.equal(
    await page
      .getByLabel("Contorno de pecho (cm)")
      .getAttribute("aria-invalid"),
    "true",
  );
  assert.match(
    await page.locator("#size-validation").innerText(),
    /entre 72 y 124/,
  );
  await page.screenshot({ path: "artifacts/desktop-validation-refined.png" });
  await page
    .getByRole("button", { name: "Consultar mi talla", exact: false })
    .click();
  assert.ok(
    await page
      .getByRole("status")
      .filter({ hasText: "entre 72 y 124" })
      .isVisible(),
  );
  await page.getByLabel("Contorno de pecho (cm)").fill("96,5");
  assert.equal(
    await page
      .getByLabel("Contorno de pecho (cm)")
      .getAttribute("aria-invalid"),
    "false",
  );
  await page
    .getByRole("button", { name: "Consultar mi talla", exact: false })
    .click();
  await page.getByText("Tu talla de referencia: M").waitFor();
  check("Sizing error and success");
  await page.keyboard.press("Escape");
  await page.getByLabel("Lo nuevo, antes que nadie.").fill("incorrecto");
  assert.equal(
    await page
      .getByLabel("Lo nuevo, antes que nadie.")
      .getAttribute("aria-invalid"),
    "true",
  );
  assert.equal(
    await page
      .getByLabel("Lo nuevo, antes que nadie.")
      .getAttribute("inputmode"),
    "email",
  );
  await page.getByRole("button", { name: "Suscribirme", exact: true }).click();
  assert.ok(
    await page
      .getByText("Revisa el formato de tu correo.", { exact: false })
      .isVisible(),
  );
  await page.getByLabel("Lo nuevo, antes que nadie.").fill("test@example.com");
  await page.getByRole("button", { name: "Suscribirme", exact: true }).click();
  assert.ok(
    await page.getByText("Formulario validado.", { exact: false }).isVisible(),
  );
  check("Email validation and honest demo success");
  const desktopAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  results.accessibility.push({
    viewport: "desktop",
    violations: desktopAxe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#atelier").scrollIntoViewIfNeeded();
  await page
    .getByRole("button", { name: "Elegir opciones", exact: false })
    .click();
  await page.getByRole("dialog").waitFor();
  await page.locator("dialog").evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((a) => a.finished));
    await Promise.all(
      [...el.querySelectorAll("img")].map((img) =>
        img.decode().catch(() => {}),
      ),
    );
  });
  await page.screenshot({ path: "artifacts/customizer-mobile.png" });
  const mobileAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  results.accessibility.push({
    viewport: "mobile dialog",
    violations: mobileAxe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "S", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Añadir a la bolsa/ })
    .click();
  await page.locator("dialog").waitFor({ state: "detached" });
  assert.equal(await page.locator("dialog").count(), 0);
  check("Mobile customizer sheet purchase");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hombre", exact: false })
    .click();
  await page.locator("dialog").waitFor({ state: "detached" });
  assert.equal(await page.locator("dialog").count(), 0);
  check("Mobile navigation");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await page
    .locator(".hero-ctas")
    .evaluate((el) => getComputedStyle(el).animationName);
  assert.equal(motion, "none");
  check("Reduced motion");
  await page.evaluate(() => {
    localStorage.setItem("fashion:cart:v1", "{broken");
    localStorage.setItem(
      "fashion:configuration:v1",
      JSON.stringify({ productId: "invalid" }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page.locator(".product-title h3").innerText(),
    "Sobrecamisa esencial",
  );
  check("Corrupt localStorage recovery");
  const imageFailures = await page.locator(".photo.error").count();
  assert.equal(imageFailures, 0);
  check("All local photography loads");
  // Real image lifecycle under a controlled network failure, then retry.
  let releaseImage;
  const imageGate = new Promise((resolve) => {
    releaseImage = resolve;
  });
  await page.route("**/images/editorial-hero-*.webp", async (route) => {
    await imageGate;
    await route.abort();
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator(".hero .photo.loading").waitFor();
  await page.screenshot({ path: "artifacts/loading-mobile.png" });
  releaseImage();
  await page.locator(".hero .image-error").waitFor();
  await page.screenshot({ path: "artifacts/error-mobile.png" });
  await page.unroute("**/images/editorial-hero-*.webp");
  await page
    .locator(".hero")
    .getByRole("button", { name: "Reintentar" })
    .click();
  await page.locator(".hero .photo.loaded").waitFor();
  check("Image loading, failure and retry recovery");
  assert.equal(
    results.accessibility.reduce(
      (count, audit) => count + audit.violations.length,
      0,
    ),
    0,
  );
  check("Axe: no WCAG A/AA violations in checked views");
  assert.equal(results.errors.length, 0);
  check("No browser runtime errors");
} catch (error) {
  results.failure = error.stack;
  await page.screenshot({ path: "artifacts/failure.png", fullPage: true });
  console.error(error);
  process.exitCode = 1;
} finally {
  await fs.writeFile(
    "artifacts/verification.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}
