import { chromium, Browser, devices, BrowserContext, Page } from "playwright";

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

export async function withPlaywright(
  fn: ({
    browser,
    context,
    page,
  }: {
    browser: Browser;
    context: BrowserContext;
    page: Page;
  }) => Promise<void>,
) {
  console.log("opening browser...");
  const { browser, context, page } = await createPage();

  try {
    await fn({ browser, context, page });
  } catch (error) {
    console.log("Something went wrong", error);
  }

  console.log("tearing down");

  await tearDown({ context, browser });
  console.log("done");
}
