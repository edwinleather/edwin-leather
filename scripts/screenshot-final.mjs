import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const outDir = 'D:/edwin-leathers/screenshots';
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();

// Mobile product page - verify WhatsApp + purchase bar no longer overlap
const ctx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const page = await ctx.newPage();
await page.goto('https://edwinleather.com/product/heritage-tote', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// Top
await page.screenshot({ path: `${outDir}/final-product-top.png` });

// Scroll to show purchase bar
await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/final-product-mid.png` });

// Scroll to bottom area
await page.evaluate(() => window.scrollBy(0, 600));
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/final-product-bottom.png` });

// Small mobile
const ctx2 = await browser.newContext({
  viewport: { width: 320, height: 568 },
  deviceScaleFactor: 2,
});
const page2 = await ctx2.newPage();
await page2.goto('https://edwinleather.com/product/heritage-tote', { waitUntil: 'networkidle', timeout: 30000 });
await page2.waitForTimeout(2000);
await page2.evaluate(() => window.scrollBy(0, 900));
await page2.waitForTimeout(500);
await page2.screenshot({ path: `${outDir}/final-product-320.png` });

await browser.close();
console.log('Done!');
