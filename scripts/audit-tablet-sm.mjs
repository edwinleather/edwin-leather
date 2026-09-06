import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = 'D:/edwin-leathers/audit';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

const allPages = [
  { name: '01-home', url: 'https://edwinleather.com/' },
  { name: '02-shop', url: 'https://edwinleather.com/shop' },
  { name: '03-product-heritage-tote', url: 'https://edwinleather.com/product/heritage-tote' },
  { name: '04-product-archive-wallet', url: 'https://edwinleather.com/product/archive-wallet' },
  { name: '05-product-sandal', url: 'https://edwinleather.com/product/sandal' },
  { name: '06-category-bags', url: 'https://edwinleather.com/category/bags' },
  { name: '07-category-wallets', url: 'https://edwinleather.com/category/wallets' },
  { name: '08-category-belts', url: 'https://edwinleather.com/category/belts' },
  { name: '09-category-accessories', url: 'https://edwinleather.com/category/accessories' },
  { name: '10-category-travel', url: 'https://edwinleather.com/category/travel' },
  { name: '11-category-work', url: 'https://edwinleather.com/category/work' },
  { name: '12-category-footwear', url: 'https://edwinleather.com/category/footwear' },
  { name: '13-cart-empty', url: 'https://edwinleather.com/cart' },
  { name: '14-login', url: 'https://edwinleather.com/login' },
  { name: '15-signup', url: 'https://edwinleather.com/signup' },
  { name: '16-about', url: 'https://edwinleather.com/about' },
  { name: '17-story', url: 'https://edwinleather.com/story' },
  { name: '18-contact', url: 'https://edwinleather.com/contact' },
  { name: '19-feedback', url: 'https://edwinleather.com/feedback' },
  { name: '20-discount', url: 'https://edwinleather.com/discount' },
  { name: '21-checkout', url: 'https://edwinleather.com/checkout' },
  { name: '22-terms', url: 'https://edwinleather.com/terms' },
  { name: '23-privacy', url: 'https://edwinleather.com/privacy' },
  { name: '24-shipping-policy', url: 'https://edwinleather.com/shipping-policy' },
  { name: '25-returns-policy', url: 'https://edwinleather.com/returns-policy' },
  { name: '26-thank-you', url: 'https://edwinleather.com/thank-you' },
  { name: '27-account', url: 'https://edwinleather.com/account' },
  { name: '28-backoffice', url: 'https://edwinleather.com/backoffice' },
  { name: '29-404', url: 'https://edwinleather.com/nonexistent-page' },
];

// Tablet
const vp = { name: 'tablet', width: 768, height: 1024, scale: 2 };
console.log(`=== ${vp.name} (${vp.width}x${vp.height}) ===`);
const ctx = await browser.newContext({
  viewport: { width: vp.width, height: vp.height },
  deviceScaleFactor: vp.scale,
});

for (const p of allPages) {
  const page = await ctx.newPage();
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${outDir}/${p.name}-${vp.name}.png`, fullPage: false });
    console.log(`  ✓ ${p.name}`);
  } catch (e) {
    console.log(`  ✗ ${p.name}: ${e.message.substring(0, 80)}`);
  }
  await page.close();
}
await ctx.close();

// mobile-sm
const vp2 = { name: 'mobile-sm', width: 320, height: 568, scale: 2 };
console.log(`\n=== ${vp2.name} (${vp2.width}x${vp2.height}) ===`);
const ctx2 = await browser.newContext({
  viewport: { width: vp2.width, height: vp2.height },
  deviceScaleFactor: vp2.scale,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});

for (const p of allPages) {
  const page = await ctx2.newPage();
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${outDir}/${p.name}-${vp2.name}.png`, fullPage: false });
    console.log(`  ✓ ${p.name}`);
  } catch (e) {
    console.log(`  ✗ ${p.name}: ${e.message.substring(0, 80)}`);
  }
  await page.close();
}
await ctx2.close();

await browser.close();
console.log('\nDone: tablet + mobile-sm');
