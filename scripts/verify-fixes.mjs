import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = 'D:/edwin-leathers/audit/fixes';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

// Test 1: Mobile menu - verify new links
console.log('--- Fix 1: Mobile menu ---');
const menuCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const menuPage = await menuCtx.newPage();
await menuPage.goto('https://edwinleather.com/', { waitUntil: 'networkidle', timeout: 30000 });
await menuPage.waitForTimeout(2000);
const menuBtn = await menuPage.locator('.mobile-menu-button').first();
if (await menuBtn.isVisible()) {
  await menuBtn.click();
  await menuPage.waitForTimeout(1000);
  await menuPage.screenshot({ path: `${outDir}/fix1-mobile-menu.png` });
  const items = await menuPage.locator('.mobile-menu__nav a, .mobile-menu__nav button').allTextContents();
  console.log('  Menu items: ' + items.filter(t => t.trim()).join(' | '));
}
await menuPage.close();
await menuCtx.close();

// Test 2: WhatsApp button on mobile home - no overlap with carousel
console.log('--- Fix 2: WhatsApp on home ---');
const waCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const waPage = await waCtx.newPage();
await waPage.goto('https://edwinleather.com/', { waitUntil: 'networkidle', timeout: 30000 });
await waPage.waitForTimeout(2000);
await waPage.screenshot({ path: `${outDir}/fix2-home-mobile.png` });
console.log('  ✓ Home page captured');
// Check WhatsApp widget position vs carousel controls position
const waBox = await waPage.locator('.wa-button').first().boundingBox();
const controlsBox = await waPage.locator('.hero__controls').first().boundingBox().catch(() => null);
if (waBox && controlsBox) {
  const overlap = waBox.x < controlsBox.x + controlsBox.width && waBox.x + waBox.width > controlsBox.x && waBox.y < controlsBox.y + controlsBox.height && waBox.y + waBox.height > controlsBox.y;
  console.log(`  WhatsApp: x=${waBox.x},y=${waBox.y} w=${waBox.width}x${waBox.height}`);
  console.log(`  Controls: x=${controlsBox.x},y=${controlsBox.y} w=${controlsBox.width}x${controlsBox.height}`);
  console.log(`  Overlap: ${overlap}`);
}
await waPage.close();
await waCtx.close();

// Test 3: Shop page - first 6 products visible
console.log('--- Fix 3: Product grid ---');
const gridCtx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const gridPage = await gridCtx.newPage();
await gridPage.goto('https://edwinleather.com/shop', { waitUntil: 'networkidle', timeout: 30000 });
await gridPage.waitForTimeout(2000);
await gridPage.screenshot({ path: `${outDir}/fix3-shop-desktop.png`, fullPage: true });
const visibleCards = await gridPage.locator('.product-card').evaluateAll((cards) => {
  return cards.filter((c) => {
    const style = window.getComputedStyle(c);
    const rect = c.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && style.opacity !== '0';
  }).length;
});
console.log(`  Visible product cards: ${visibleCards}`);
await gridPage.close();
await gridCtx.close();

// Test 4: Product page - no huge gap on Merchant Sling
console.log('--- Fix 4: Product editorial ---');
const prodCtx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const prodPage = await prodCtx.newPage();
await prodPage.goto('https://edwinleather.com/product/merchant-sling', { waitUntil: 'networkidle', timeout: 30000 });
await prodPage.waitForTimeout(2000);
await prodPage.screenshot({ path: `${outDir}/fix4-product-desktop.png`, fullPage: true });
// Check if editorial section is visible
const editorialVisible = await prodPage.locator('.product-editorial').isVisible().catch(() => false);
console.log(`  Editorial visible: ${editorialVisible}`);
await prodPage.close();
await prodCtx.close();

// Test 5: Same product page on mobile
console.log('--- Fix 5: Product page mobile ---');
const mobProdCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const mobProdPage = await mobProdCtx.newPage();
await mobProdPage.goto('https://edwinleather.com/product/merchant-sling', { waitUntil: 'networkidle', timeout: 30000 });
await mobProdPage.waitForTimeout(2000);
await mobProdPage.screenshot({ path: `${outDir}/fix5-product-mobile.png`, fullPage: false });
await mobProdPage.evaluate(() => window.scrollBy(0, 1200));
await mobProdPage.waitForTimeout(500);
await mobProdPage.screenshot({ path: `${outDir}/fix5-product-mobile-scrolled.png` });
await mobProdPage.close();
await mobProdCtx.close();

// Test 6: Category page with products - BAGS (should show 2)
console.log('--- Fix 6: Category page ---');
const catCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const catPage = await catCtx.newPage();
await catPage.goto('https://edwinleather.com/category/bags', { waitUntil: 'networkidle', timeout: 30000 });
await catPage.waitForTimeout(2000);
await catPage.screenshot({ path: `${outDir}/fix6-category-bags-mobile.png` });
console.log('  ✓ Category bags mobile');
await catPage.close();
await catCtx.close();

await browser.close();
console.log('\nDone: Fix verification screenshots');
