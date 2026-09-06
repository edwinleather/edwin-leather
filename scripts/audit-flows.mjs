import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const outDir = 'D:/edwin-leathers/audit';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

// =============================================
// INTERACTIVE FLOW TESTS
// =============================================

// Test 1: Add to cart flow (mobile)
console.log('--- Add to Cart Flow (mobile 375px) ---');
const cartCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const cartPage = await cartCtx.newPage();

await cartPage.goto('https://edwinleather.com/product/heritage-tote', { waitUntil: 'networkidle', timeout: 30000 });
await cartPage.waitForTimeout(2000);
await cartPage.screenshot({ path: `${outDir}/flow-01-product-top.png` });
console.log('  ✓ Step 1: Product page top');

// Scroll down to see product info and add to bag
await cartPage.evaluate(() => window.scrollBy(0, 500));
await cartPage.waitForTimeout(500);
await cartPage.screenshot({ path: `${outDir}/flow-02-product-variants.png` });
console.log('  ✓ Step 2: Product variants');

// Click variant if visible
try {
  const espresso = await cartPage.locator('button:has-text("Espresso")').first();
  if (await espresso.isVisible({ timeout: 1000 })) {
    await espresso.click();
    await cartPage.waitForTimeout(300);
    console.log('  ✓ Clicked Espresso variant');
  }
} catch (e) {}

// Scroll more to see Add to Bag
await cartPage.evaluate(() => window.scrollBy(0, 500));
await cartPage.waitForTimeout(500);
await cartPage.screenshot({ path: `${outDir}/flow-03-product-details.png` });
console.log('  ✓ Step 3: Product details');

// Click Add to Bag
try {
  const addBtn = await cartPage.locator('.purchase-bar .button--dark, .purchase-row .button--dark').first();
  if (await addBtn.isVisible({ timeout: 2000 })) {
    await addBtn.click();
    await cartPage.waitForTimeout(1500);
    await cartPage.screenshot({ path: `${outDir}/flow-04-cart-drawer.png` });
    console.log('  ✓ Step 4: Cart drawer opened');
  } else {
    console.log('  ✗ Step 4: Add to Bag button not visible');
    // Try alternative selectors
    const altBtn = await cartPage.locator('button:has-text("Add to Bag"), button:has-text("Add to Cart")').first();
    if (await altBtn.isVisible({ timeout: 1000 })) {
      await altBtn.click();
      await cartPage.waitForTimeout(1500);
      await cartPage.screenshot({ path: `${outDir}/flow-04-cart-drawer.png` });
      console.log('  ✓ Step 4: Cart drawer opened (alt)');
    }
  }
} catch (e) {
  console.log('  ✗ Step 4: ' + e.message.substring(0, 80));
}

// Navigate to cart page
await cartPage.goto('https://edwinleather.com/cart', { waitUntil: 'networkidle', timeout: 30000 });
await cartPage.waitForTimeout(2000);
await cartPage.screenshot({ path: `${outDir}/flow-05-cart-page.png` });
console.log('  ✓ Step 5: Cart page');

// Navigate to checkout
await cartPage.goto('https://edwinleather.com/checkout', { waitUntil: 'networkidle', timeout: 30000 });
await cartPage.waitForTimeout(2000);
await cartPage.screenshot({ path: `${outDir}/flow-06-checkout.png` });
console.log('  ✓ Step 6: Checkout page');

// Fill in checkout form
try {
  const emailInput = await cartPage.locator('input[name="email"], input[type="email"]').first();
  if (await emailInput.isVisible({ timeout: 2000 })) {
    await emailInput.fill('test@edwinleather.com');
    console.log('  ✓ Filled email');
  }
} catch (e) {}

try {
  const nameInput = await cartPage.locator('input[name="name"], input[placeholder*="name" i]').first();
  if (await nameInput.isVisible({ timeout: 1000 })) {
    await nameInput.fill('Test User');
    console.log('  ✓ Filled name');
  }
} catch (e) {}

await cartPage.waitForTimeout(500);
await cartPage.screenshot({ path: `${outDir}/flow-07-checkout-filled.png` });
console.log('  ✓ Step 7: Checkout filled');

await cartPage.close();
await cartCtx.close();

// =============================================
// Test 2: Desktop flow
// =============================================
console.log('\n--- Desktop Add to Cart Flow ---');
const deskCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const deskPage = await deskCtx.newPage();

await deskPage.goto('https://edwinleather.com/product/merchant-sling', { waitUntil: 'networkidle', timeout: 30000 });
await deskPage.waitForTimeout(2000);
await deskPage.screenshot({ path: `${outDir}/flow-desk-01-product.png`, fullPage: true });
console.log('  ✓ Desktop: Product page');

// Click Add to Bag
try {
  const addBtn = await deskPage.locator('.purchase-button').first();
  if (await addBtn.isVisible({ timeout: 2000 })) {
    await addBtn.click();
    await deskPage.waitForTimeout(1500);
    await deskPage.screenshot({ path: `${outDir}/flow-desk-02-cart-drawer.png` });
    console.log('  ✓ Desktop: Cart drawer');
  }
} catch (e) {
  console.log('  ✗ Desktop: ' + e.message.substring(0, 80));
}

await deskPage.close();
await deskCtx.close();

// =============================================
// Test 3: Mobile menu
// =============================================
console.log('\n--- Mobile Menu ---');
const menuCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const menuPage = await menuCtx.newPage();
await menuPage.goto('https://edwinleather.com/', { waitUntil: 'networkidle', timeout: 30000 });
await menuPage.waitForTimeout(2000);

// Open mobile menu
try {
  const menuBtn = await menuPage.locator('.mobile-menu-button, button[aria-label="Menu"]').first();
  if (await menuBtn.isVisible({ timeout: 2000 })) {
    await menuBtn.click();
    await menuPage.waitForTimeout(700);
    await menuPage.screenshot({ path: `${outDir}/flow-mobile-menu.png` });
    console.log('  ✓ Mobile menu opened');

    // Check for all menu items
    const menuItems = await menuPage.locator('.mobile-menu-drawer a, .mobile-menu a').allTextContents();
    console.log('  Menu items: ' + menuItems.filter(t => t.trim()).join(', '));
  }
} catch (e) {
  console.log('  ✗ Mobile menu: ' + e.message.substring(0, 80));
}
await menuPage.close();
await menuCtx.close();

// =============================================
// Test 4: Theme toggle
// =============================================
console.log('\n--- Theme Toggle ---');
const themeCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const themePage = await themeCtx.newPage();
await themePage.goto('https://edwinleather.com/', { waitUntil: 'networkidle', timeout: 30000 });
await themePage.waitForTimeout(2000);

try {
  const themeBtn = await themePage.locator('.theme-toggle, button[aria-label*="dark" i], button[aria-label*="theme" i], button[aria-label*="mode" i]').first();
  if (await themeBtn.isVisible({ timeout: 2000 })) {
    await themeBtn.click();
    await themePage.waitForTimeout(800);
    await themePage.screenshot({ path: `${outDir}/flow-dark-mode.png` });
    console.log('  ✓ Dark mode toggled');
  } else {
    console.log('  ✗ Theme toggle button not found');
  }
} catch (e) {
  console.log('  ✗ Theme toggle: ' + e.message.substring(0, 80));
}
await themePage.close();
await themeCtx.close();

// =============================================
// Test 5: Search functionality
// =============================================
console.log('\n--- Search Flow ---');
const searchCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const searchPage = await searchCtx.newPage();
await searchPage.goto('https://edwinleather.com/shop', { waitUntil: 'networkidle', timeout: 30000 });
await searchPage.waitForTimeout(2000);

try {
  const searchInput = await searchPage.locator('.shop-search input, input[type="search"], input[placeholder*="search" i]').first();
  if (await searchInput.isVisible({ timeout: 2000 })) {
    await searchInput.click();
    await searchPage.waitForTimeout(300);
    await searchInput.fill('wallet');
    await searchPage.waitForTimeout(1500);
    await searchPage.screenshot({ path: `${outDir}/flow-search-results.png` });
    console.log('  ✓ Search: Typed "wallet"');
  } else {
    console.log('  ✗ Search input not found');
  }
} catch (e) {
  console.log('  ✗ Search: ' + e.message.substring(0, 80));
}
await searchPage.close();
await searchCtx.close();

// =============================================
// Test 6: Category filter
// =============================================
console.log('\n--- Category Filter ---');
const filterCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const filterPage = await filterCtx.newPage();
await filterPage.goto('https://edwinleather.com/shop', { waitUntil: 'networkidle', timeout: 30000 });
await filterPage.waitForTimeout(2000);
await filterPage.screenshot({ path: `${outDir}/flow-shop-all.png` });
console.log('  ✓ Shop: All products');

// Click each category filter
const cats = ['Bags', 'Wallets', 'Belts', 'Accessories'];
for (const cat of cats) {
  try {
    const catBtn = await filterPage.locator(`button:has-text("${cat}")`).first();
    if (await catBtn.isVisible({ timeout: 1000 })) {
      await catBtn.click();
      await filterPage.waitForTimeout(800);
      await filterPage.screenshot({ path: `${outDir}/flow-shop-${cat.toLowerCase()}.png` });
      console.log(`  ✓ Filter: ${cat}`);
    }
  } catch (e) {
    console.log(`  ✗ Filter: ${cat} - ${e.message.substring(0, 60)}`);
  }
}
await filterPage.close();
await filterCtx.close();

// =============================================
// Test 7: Checkout with empty cart
// =============================================
console.log('\n--- Checkout (empty cart) ---');
const emptyCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const emptyPage = await emptyCtx.newPage();
await emptyPage.goto('https://edwinleather.com/checkout', { waitUntil: 'networkidle', timeout: 30000 });
await emptyPage.waitForTimeout(2000);
await emptyPage.screenshot({ path: `${outDir}/flow-checkout-empty.png` });
console.log('  ✓ Checkout with empty cart');

// Navigate through checkout
await emptyPage.goto('https://edwinleather.com/thank-you', { waitUntil: 'networkidle', timeout: 30000 });
await emptyPage.waitForTimeout(2000);
await emptyPage.screenshot({ path: `${outDir}/flow-thank-you.png` });
console.log('  ✓ Thank you page');

await emptyPage.close();
await emptyCtx.close();

// =============================================
// Test 8: Login/Signup flow
// =============================================
console.log('\n--- Login/Signup Flow ---');
const authCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
});
const authPage = await authCtx.newPage();
await authPage.goto('https://edwinleather.com/login', { waitUntil: 'networkidle', timeout: 30000 });
await authPage.waitForTimeout(2000);
await authPage.screenshot({ path: `${outDir}/flow-login.png` });
console.log('  ✓ Login page');

// Try to see Google sign-in button
try {
  const googleBtn = await authPage.locator('.google-button, button:has-text("Google"), button:has-text("Sign in with")').first();
  if (await googleBtn.isVisible({ timeout: 2000 })) {
    console.log('  ✓ Google sign-in button visible');
  } else {
    console.log('  ✗ Google sign-in button not found');
  }
} catch (e) {
  console.log('  ✗ Google sign-in check failed');
}

await authPage.goto('https://edwinleather.com/signup', { waitUntil: 'networkidle', timeout: 30000 });
await authPage.waitForTimeout(2000);
await authPage.screenshot({ path: `${outDir}/flow-signup.png` });
console.log('  ✓ Signup page');

await authPage.goto('https://edwinleather.com/account', { waitUntil: 'networkidle', timeout: 30000 });
await authPage.waitForTimeout(2000);
await authPage.screenshot({ path: `${outDir}/flow-account-redirect.png` });
console.log('  ✓ Account page (unauthenticated)');

await authPage.close();
await authCtx.close();

await browser.close();
console.log('\nDone: All interactive flow tests');
