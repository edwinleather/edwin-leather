import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = 'D:/edwin-leathers/screenshots';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

const pages = [
  { name: 'home', url: 'https://edwinleather.com/' },
  { name: 'shop', url: 'https://edwinleather.com/shop' },
  { name: 'product', url: 'https://edwinleather.com/product/heritage-tote' },
  { name: 'product-scrolled', url: 'https://edwinleather.com/product/heritage-tote', scroll: 900 },
  { name: 'cart', url: 'https://edwinleather.com/cart' },
  { name: 'login', url: 'https://edwinleather.com/login' },
  { name: 'signup', url: 'https://edwinleather.com/signup' },
  { name: 'about', url: 'https://edwinleather.com/about' },
  { name: 'category', url: 'https://edwinleather.com/category/bags' },
  { name: 'story', url: 'https://edwinleather.com/story' },
  { name: 'checkout', url: 'https://edwinleather.com/checkout' },
  { name: 'discount', url: 'https://edwinleather.com/discount' },
];

// Mobile 375px
const ctx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
});

console.log('=== Mobile 375px ===');
for (const p of pages) {
  const page = await ctx.newPage();
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    if (p.scroll) {
      await page.evaluate((s) => window.scrollBy(0, s), p.scroll);
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `${outDir}/review-${p.name}-375.png` });
    console.log(`  ✓ ${p.name}`);
  } catch (e) {
    console.log(`  ✗ ${p.name}: ${e.message.substring(0, 80)}`);
  }
  await page.close();
}

// Desktop 1440px
const ctx2 = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

console.log('=== Desktop 1440px ===');
for (const p of pages.filter(x => !x.scroll)) {
  const page = await ctx2.newPage();
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${outDir}/review-${p.name}-desktop.png`, fullPage: true });
    console.log(`  ✓ ${p.name}`);
  } catch (e) {
    console.log(`  ✗ ${p.name}: ${e.message.substring(0, 80)}`);
  }
  await page.close();
}

await browser.close();
console.log('\nDone!');
