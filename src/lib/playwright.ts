import { chromium, Browser, devices, BrowserContext } from "playwright";

export async function createPage() {
  const browser = await chromium.launch({ headless: false }); // Or 'firefox' or 'webkit'.
  const context = await browser.newContext(devices["Desktop Chrome"]);
  const page = await context.newPage();
  return { browser, context, page };
}

export async function tearDown({
  context,
  browser,
}: { context: BrowserContext; browser: Browser }) {
  await context.close();
  await browser.close();
}
