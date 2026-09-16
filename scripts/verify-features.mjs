import assert from "node:assert/strict";
import path from "node:path";
import { chromium } from "playwright";

const base = "http://127.0.0.1:5173/";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const checks = [];
const check = (label) => {
  checks.push(label);
  console.log(`PASS ${label}`);
};

try {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(base, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Buscar prendas" }).click();
  const search = page.getByLabel("Buscar por prenda o material");
  await search.fill("boda");
  await page.getByRole("option", { name: /Vestido satinado/ }).waitFor();
  await search.press("ArrowDown");
  await search.press("Enter");
  await page
    .locator("#atelier .product-panel")
    .getByRole("heading", { name: "Vestido satinado", exact: true })
    .waitFor();
  assert.match(page.url(), /product=vestido-satin/);
  check("Predictive intent search and keyboard selection");

  await page.getByRole("button", { name: /Tu talla, sin adivinar/ }).click();
  await page.getByLabel("Contorno de pecho (cm)").fill("96,5");
  await page.getByLabel("Altura").fill("168");
  await page.getByRole("button", { name: /Consultar mi talla/ }).click();
  await page.getByText("Tu talla de referencia: M").waitFor();
  await page.getByRole("button", { name: /Usar esta talla/ }).click();
  assert.match(
    await page.evaluate(() => localStorage.getItem("fashion:size-profile:v1")),
    /96,5/,
  );
  check("Persistent multi-measurement size profile");

  await page.locator("#coleccion").scrollIntoViewIfNeeded();
  const compareButtons = page.getByRole("button", {
    name: "Comparar",
    exact: true,
  });
  await compareButtons.nth(0).click();
  await compareButtons.nth(1).click();
  await page
    .getByRole("button", { name: "Comparar", exact: true })
    .last()
    .click();
  await page.locator("dialog .compare-grid article").first().waitFor();
  assert.equal(await page.locator("dialog .compare-grid article").count(), 2);
  await page.keyboard.press("Escape");
  check("Three-slot product comparison");

  await page
    .locator("#coleccion")
    .getByRole("button", { name: /Ver toda la colección/ })
    .click();
  await page
    .locator("#coleccion")
    .getByRole("button", { name: "Sobrecamisa esencial", exact: true })
    .click();
  const productPanel = page.locator("#atelier .product-panel");
  await productPanel
    .getByRole("button", { name: "Cacao", exact: true })
    .click();
  await productPanel
    .locator(".fabric-option")
    .filter({ hasText: "Lino" })
    .click();
  await productPanel.getByRole("button", { name: /^M/ }).click();
  await productPanel
    .getByRole("button", { name: /Avísame cuando vuelva/ })
    .click();
  assert.match(
    await page.evaluate(() =>
      localStorage.getItem("fashion:restock-alerts:v1"),
    ),
    /sobrecamisa-esencial/,
  );
  check("Out-of-stock recovery and local restock alert");

  await productPanel.getByRole("button", { name: /Calcular entrega/ }).click();
  await page.getByLabel("Código postal").fill("1101");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await page.getByText("Estudio Centro", { exact: true }).waitFor();
  await page.keyboard.press("Escape");
  check("Delivery and pickup estimator");

  await productPanel
    .getByRole("button", { name: "Compartir", exact: true })
    .click();
  const sharedUrl = await page
    .getByLabel("Enlace a tu combinación")
    .inputValue();
  assert.match(sharedUrl, /product=sobrecamisa-esencial/);
  assert.match(sharedUrl, /fabric=Lino/);
  await page.keyboard.press("Escape");
  check("Shareable product configuration URL");

  await productPanel.getByRole("button", { name: /Prueba visual/ }).click();
  await page
    .locator(".try-on-drop input[type=file]")
    .setInputFiles(path.resolve("public/images/tee-model-480.webp"));
  await page.getByText("Comparación lista.", { exact: true }).waitFor();
  assert.equal(await page.locator(".try-on-stage figure").count(), 2);
  await page.keyboard.press("Escape");
  check("Private local try-on comparison flow");

  await page.locator("#opiniones").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /Escribir una opinión/ }).click();
  await page.getByLabel("Nombre").fill("Valeria Portillo");
  await page.getByLabel("Talla usada").selectOption("M");
  await page.getByLabel("Altura").fill("167");
  await page
    .getByLabel("Tu experiencia")
    .fill(
      "La caída se siente ligera y la talla coincide con mi referencia habitual.",
    );
  await page.getByRole("button", { name: /Publicar en esta demo/ }).click();
  await page.getByText("Valeria Portillo", { exact: true }).waitFor();
  check("Fit review creation and persistence");

  await page.locator(".look-section").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /Añadir look seleccionado/ }).click();
  await page.getByRole("button", { name: /Abrir bolsa/ }).click();
  assert.ok((await page.locator(".cart-line").count()) >= 2);
  await page.getByRole("button", { name: /Revisar mi selección/ }).click();
  await page.getByRole("button", { name: /Continuar como invitado/ }).click();
  await page.getByLabel("Nombre completo").fill("Valeria Portillo");
  await page.getByLabel("Correo electrónico").fill("valeria@example.com");
  await page.getByLabel("Código postal").fill("1101");
  await page.getByLabel("Dirección").fill("Calle Los Olivos 24, apartamento 3");
  await page.getByRole("button", { name: /Confirmar pedido demo/ }).click();
  await page.getByText(/DEMO-\d+/).waitFor();
  assert.match(
    await page.evaluate(() => localStorage.getItem("fashion:orders:v1")),
    /DEMO-/,
  );
  check("Guest demo checkout and local order tracking");

  await page.keyboard.press("Escape");
  await page.screenshot({
    path: "artifacts/features-desktop.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(base, { waitUntil: "networkidle" });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    375,
  );
  await page.getByRole("button", { name: "Buscar prendas" }).click();
  await page.getByLabel("Buscar por prenda o material").fill("oficina");
  await page.screenshot({ path: "artifacts/features-mobile-search.png" });
  await page.keyboard.press("Escape");
  check("Functional mobile layout without horizontal overflow");

  console.log(JSON.stringify({ checks }, null, 2));
} finally {
  await browser.close();
}
