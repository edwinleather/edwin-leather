import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = 'D:/edwin-leathers/screenshots';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

const pages = [
  { name: 'home', url: 'https://edwinleather.com/' },
  { name: 'shop', url: 'https://edwinleather.com/shop' },
  { name: 'product', url: 'https://edwinleather.com/product/heritage-tote' },
  { name: 'cart', url: 'https://edwinleather.com/cart' },
  { name: 'login', url: 'https://edwinleather.com/login' },
  { name: 'about', url: 'https://edwinleather.com/about' },
  { name: 'category', url: 'https://edwinleather.com/category/bags' },
  { name: 'checkout', url: 'https://edwinleather.com/checkout' },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
  { name: 'mobile-small', width: 320, height: 568 },
];

for (const vp of viewports) {
  console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.name === 'desktop' ? 1 : 2,
    userAgent: vp.name.startsWith('mobile')
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      : undefined,
  });

  for (const p of pages) {
    const page = await context.newPage();
    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const filename = `${outDir}/${p.name}-${vp.name}.png`;
      await page.screenshot({ path: filename, fullPage: vp.name === 'desktop' });
      console.log(`  ✓ ${p.name}`);
    } catch (e) {
      console.log(`  ✗ ${p.name}: ${e.message.substring(0, 100)}`);
    }
    await page.close();
  }
  await context.close();
}

await browser.close();
console.log('\nDone! Screenshots saved to D:/edwin-leathers/screenshots/');
