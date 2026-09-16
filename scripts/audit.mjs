import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { preview } from "vite";
import fs from "node:fs/promises";

await fs.mkdir("artifacts", { recursive: true });
const server = await preview({
  preview: { host: "127.0.0.1", port: 5174, strictPort: true },
});
let chrome;
try {
  chrome = await launch({
    chromePath:
      process.env.CHROME_PATH ||
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    chromeFlags: ["--headless", "--disable-gpu"],
  });
  for (const mobile of [true, false]) {
    const label = mobile ? "mobile" : "desktop";
    const result = await lighthouse("http://127.0.0.1:5174", {
      port: chrome.port,
      output: ["json", "html"],
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      ...(mobile ? {} : { preset: "desktop" }),
    });
    await fs.writeFile(`artifacts/lighthouse-${label}.json`, result.report[0]);
    await fs.writeFile(`artifacts/lighthouse-${label}.html`, result.report[1]);
    console.log(
      label,
      JSON.stringify(
        Object.fromEntries(
          Object.entries(result.lhr.categories).map(([name, category]) => [
            name,
            Math.round(category.score * 100),
          ]),
        ),
      ),
    );
  }
} finally {
  await chrome?.kill();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
