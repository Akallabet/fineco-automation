import dotenv from 'dotenv';
import { Page } from "playwright";
import { test, expect } from '@playwright/test';
import { withPlaywright } from "../src/lib/playwright";
import { extractExpensesData, colletcMoneymapExpenses } from "../src/fineco-expenses";
import { start } from "../scripts/server";

dotenv.config()
//
// async function testExtractExpensesData({ page }: { page: Page }) {
//   await page.goto("https://it.finecobank.com");
//   await extractExpensesData({ page });
// }

// test('has title', async ({ page }) => {
//   await page.goto("https://it.finecobank.com");
//   await colletcMoneymapExpenses({ page, username: process.env.USERNAME || '', password: process.env.PASSWORD || "" });
//
//   // Expect a title "to contain" a substring.
//   expect(page).toBeDefined()
// });

test('extract expenses', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await extractExpensesData({ page });
  
})
