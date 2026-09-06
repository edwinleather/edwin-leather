import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = 'D:/edwin-leathers/audit';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

// =============================================
// PHASE 1: Full page screenshots
// =============================================
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

const viewports = [
  { name: 'desktop', width: 1440, height: 900, scale: 1 },
  { name: 'tablet', width: 768, height: 1024, scale: 2 },
  { name: 'mobile', width: 375, height: 812, scale: 2 },
  { name: 'mobile-sm', width: 320, height: 568, scale: 2 },
];

for (const vp of viewports) {
  console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.scale,
    userAgent: vp.name.startsWith('mobile')
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      : undefined,
  });

  for (const p of allPages) {
    const page = await ctx.newPage();
    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2500);
      
      // Full page screenshot
      await page.screenshot({ 
        path: `${outDir}/${p.name}-${vp.name}.png`, 
        fullPage: vp.name === 'desktop' || vp.name === 'tablet'
      });
      console.log(`  ✓ ${p.name}`);
    } catch (e) {
      console.log(`  ✗ ${p.name}: ${e.message.substring(0, 100)}`);
    }
    await page.close();
  }
  await ctx.close();
}

// =============================================
// PHASE 2: Interactive flow tests
// =============================================
console.log('\n\n=== INTERACTIVE FLOW TESTS ===');

// Test 1: Add to cart flow (mobile)
console.log('\n--- Add to Cart Flow (mobile 375px) ---');
const cartCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const cartPage = await cartCtx.newPage();

// Step 1: Go to product
await cartPage.goto('https://edwinleather.com/product/heritage-tote', { waitUntil: 'networkidle', timeout: 30000 });
await cartPage.waitForTimeout(2000);
await cartPage.screenshot({ path: `${outDir}/flow-01-product-top.png` });
console.log('  ✓ Step 1: Product page loaded');

// Step 2: Scroll to see variant selector
await cartPage.evaluate(() => window.scrollBy(0, 600));
await cartPage.waitForTimeout(500);
await cartPage.screenshot({ path: `${outDir}/flow-02-product-variants.png` });
console.log('  ✓ Step 2: Scrolled to variants');

// Step 3: Try clicking variant
try {
  const espressoBtn = await cartPage.locator('button:has-text("Espresso")').first();
  if (await espressoBtn.isVisible()) {
    await espressoBtn.click();
    await cartPage.waitForTimeout(300);
    console.log('  ✓ Step 3: Clicked Espresso variant');
  }
} catch (e) {
  console.log('  ✗ Step 3: Could not click variant');
}

// Step 4: Scroll to Add to Bag button and click it
await cartPage.evaluate(() => window.scrollBy(0, 400));
await cartPage.waitForTimeout(500);
await cartPage.screenshot({ path: `${outDir}/flow-03-product-details.png` });

try {
  const addBtn = await cartPage.locator('.purchase-bar .button, .purchase-row .button--dark').first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await cartPage.waitForTimeout(1500);
    await cartPage.screenshot({ path: `${outDir}/flow-04-cart-drawer.png` });
    console.log('  ✓ Step 4: Clicked Add to Bag, cart drawer opened');
  } else {
    // Try clicking the button in purchase panel
    const panelBtn = await cartPage.locator('.purchase-button').first();
    if (await panelBtn.isVisible()) {
      await panelBtn.click();
      await cartPage.waitForTimeout(1500);
      await cartPage.screenshot({ path: `${outDir}/flow-04-cart-drawer.png` });
      console.log('  ✓ Step 4: Clicked Add to Bag (panel), cart drawer opened');
    }
  }
} catch (e) {
  console.log('  ✗ Step 4: Could not click Add to Bag');
}

// Step 5: Check cart page
await cartPage.goto('https://edwinleather.com/cart', { waitUntil: 'networkidle', timeout: 30000 });
await cartPage.waitForTimeout(2000);
await cartPage.screenshot({ path: `${outDir}/flow-05-cart-page.png` });
console.log('  ✓ Step 5: Cart page');

// Step 6: Checkout page
await cartPage.goto('https://edwinleather.com/checkout', { waitUntil: 'networkidle', timeout: 30000 });
await cartPage.waitForTimeout(2000);
await cartPage.screenshot({ path: `${outDir}/flow-06-checkout.png` });
console.log('  ✓ Step 6: Checkout page');

await cartPage.close();
await cartCtx.close();

// Test 2: Desktop add to cart flow
console.log('\n--- Add to Cart Flow (desktop 1440px) ---');
const deskCtx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const deskPage = await deskCtx.newPage();

await deskPage.goto('https://edwinleather.com/product/merchant-sling', { waitUntil: 'networkidle', timeout: 30000 });
await deskPage.waitForTimeout(2000);
await deskPage.screenshot({ path: `${outDir}/flow-desk-01-product.png`, fullPage: true });
console.log('  ✓ Desktop: Product page');

// Click add to bag
try {
  const deskAddBtn = await deskPage.locator('.purchase-button').first();
  if (await deskAddBtn.isVisible()) {
    await deskAddBtn.click();
    await deskPage.waitForTimeout(1500);
    await deskPage.screenshot({ path: `${outDir}/flow-desk-02-cart-drawer.png` });
    console.log('  ✓ Desktop: Cart drawer opened');
  }
} catch (e) {
  console.log('  ✗ Desktop: Could not click Add to Bag');
}

// Test 3: Search functionality
console.log('\n--- Search Flow ---');
const searchCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
});
const searchPage = await searchCtx.newPage();
await searchPage.goto('https://edwinleather.com/shop', { waitUntil: 'networkidle', timeout: 30000 });
await searchPage.waitForTimeout(2000);

// Try clicking search
try {
  const searchInput = await searchPage.locator('input[type="search"], .shop-search input').first();
  if (await searchInput.isVisible()) {
    await searchInput.click();
    await searchPage.waitForTimeout(500);
    await searchInput.fill('wallet');
    await searchPage.waitForTimeout(1000);
    await searchPage.screenshot({ path: `${outDir}/flow-search.png` });
    console.log('  ✓ Search: Typed "wallet"');
  }
} catch (e) {
  console.log('  ✗ Search: Could not interact with search');
}
await searchPage.close();
await searchCtx.close();

// Test 4: Category filter
console.log('\n--- Category Filter ---');
const filterCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
});
const filterPage = await filterCtx.newPage();
await filterPage.goto('https://edwinleather.com/shop', { waitUntil: 'networkidle', timeout: 30000 });
await filterPage.waitForTimeout(2000);
await filterPage.screenshot({ path: `${outDir}/flow-shop-all.png` });

// Click "Bags" filter
try {
  const bagsBtn = await filterPage.locator('button:has-text("Bags")').first();
  if (await bagsBtn.isVisible()) {
    await bagsBtn.click();
    await filterPage.waitForTimeout(1000);
    await filterPage.screenshot({ path: `${outDir}/flow-shop-bags.png` });
    console.log('  ✓ Filter: Clicked Bags');
  }
} catch (e) {
  console.log('  ✗ Filter: Could not click Bags');
}
await filterPage.close();
await filterCtx.close();

// Test 5: Mobile menu
console.log('\n--- Mobile Menu ---');
const menuCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
});
const menuPage = await menuCtx.newPage();
await menuPage.goto('https://edwinleather.com/', { waitUntil: 'networkidle', timeout: 30000 });
await menuPage.waitForTimeout(2000);
try {
  const menuBtn = await menuPage.locator('.mobile-menu-button').first();
  if (await menuBtn.isVisible()) {
    await menuBtn.click();
    await menuPage.waitForTimeout(500);
    await menuPage.screenshot({ path: `${outDir}/flow-mobile-menu.png` });
    console.log('  ✓ Mobile menu opened');
  }
} catch (e) {
  console.log('  ✗ Could not open mobile menu');
}
await menuPage.close();
await menuCtx.close();

// Test 6: Theme toggle
console.log('\n--- Theme Toggle ---');
const themeCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
});
const themePage = await themeCtx.newPage();
await themePage.goto('https://edwinleather.com/', { waitUntil: 'networkidle', timeout: 30000 });
await themePage.waitForTimeout(2000);
try {
  const themeBtn = await themePage.locator('.theme-toggle, button[aria-label*="dark"], button[aria-label*="theme"]').first();
  if (await themeBtn.isVisible()) {
    await themeBtn.click();
    await themePage.waitForTimeout(500);
    await themePage.screenshot({ path: `${outDir}/flow-dark-mode.png` });
    console.log('  ✓ Dark mode toggled');
  }
} catch (e) {
  console.log('  ✗ Could not toggle theme');
}
await themePage.close();
await themeCtx.close();

await browser.close();
console.log('\n\nDone! All audit screenshots saved to D:/edwin-leathers/audit/');
