import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = process.cwd();
const outputDirectory = path.join(root, "public", "icons");
const source = await readFile(path.join(outputDirectory, "prepmind.svg"), "utf8");
const icons = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  for (const icon of icons) {
    const page = await browser.newPage({
      viewport: { width: icon.size, height: icon.size },
      deviceScaleFactor: 1,
    });

    await page.setContent(`
      <!doctype html>
      <html>
        <head>
          <style>
            html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #206bc4; }
            svg { display: block; width: 100%; height: 100%; }
          </style>
        </head>
        <body>${source}</body>
      </html>
    `);
    await page.screenshot({ path: path.join(outputDirectory, icon.name) });
    await page.close();
  }
} finally {
  await browser.close();
}
