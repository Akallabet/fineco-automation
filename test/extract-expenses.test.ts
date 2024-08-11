import {  Page } from "playwright";
import { withPlaywright } from "../src/lib/playwright";
import { extractExpensesData } from "../src/fineco-expenses";
import { start } from "../scripts/server";

async function testExtractExpensesData({ page }: { page: Page }) {
  await page.goto("http://localhost:3000/expenses-table.html");
  await extractExpensesData({ page });
}

await start()
await withPlaywright(testExtractExpensesData);

process.exit(0);
