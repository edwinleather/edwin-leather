import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = 'D:/edwin-leathers/screenshots';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

// Mobile product page
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
});

const page = await context.newPage();

// Take product page screenshot (scroll to see content)
await page.goto('https://edwinleather.com/product/heritage-tote', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// Top of page
await page.screenshot({ path: `${outDir}/product-mobile-fixed.png` });

// Scroll down to see the details below the image
await page.evaluate(() => window.scrollBy(0, 800));
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/product-mobile-scrolled.png` });

// Scroll further
await page.evaluate(() => window.scrollBy(0, 600));
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/product-mobile-scrolled2.png` });

// Also check the small mobile
const ctx2 = await browser.newContext({
  viewport: { width: 320, height: 568 },
  deviceScaleFactor: 2,
});
const page2 = await ctx2.newPage();
await page2.goto('https://edwinleather.com/product/heritage-tote', { waitUntil: 'networkidle', timeout: 30000 });
await page2.waitForTimeout(2000);
await page2.screenshot({ path: `${outDir}/product-mobile-small-fixed.png` });
await page2.evaluate(() => window.scrollBy(0, 800));
await page2.waitForTimeout(500);
await page2.screenshot({ path: `${outDir}/product-mobile-small-scrolled.png` });

await browser.close();
console.log('Done! Screenshots saved.');
