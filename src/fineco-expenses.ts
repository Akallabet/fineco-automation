import { mkdir, writeFile } from "node:fs/promises";
import type { Page } from "playwright";
import { createPage, tearDown } from "./lib/playwright.ts";
import { expect } from "@playwright/test";

interface ScriptArgs {
  username: string;
  password: string;
}

async function openExpenses({ page }: { page: Page }) {
  console.info('Opening expenses');
  await page.getByRole("link", { name: "TUTTI" }).click();
  await page
    .locator(
      "#sintesi-conto #sc-in-out-graph-column svg > g.highcharts-series-group > g:nth-child(3) > rect",
    )
    .click();
}

async function askForSecurity({ page }: { page: Page }) {
  console.info('Waiting for security');
  await page
    .getByRole('alert')
    .getByRole("link", { name: "SBLOCCA DATI" })
    .last()
    .click();
  await expect(page.getByRole("dialog").getByText("Conferma operazione")).toBeVisible();
  await page.getByRole("dialog").getByText("Conferma operazione").waitFor({state: 'detached'});
  // await expect(page.getByRole("dialog").getByText("Conferma operazione")).toBeNull();
}

async function waitForExpenses({ page }: { page: Page }) {
  console.info('Waiting for expenses');
  await page
    .getByRole('alert')
    .getByRole("table", { name: "Tabella Spese" })
    .isVisible()
}

export async function extractExpensesData({ page }: { page: Page }): Promise<{ columns: string[], rows: string[][] }> {
  const content = page.getByRole("table", { name: "Tabella Spese" })
  await expect(content).toBeVisible();

  const [_, ...tableBodyRows] = await content.getByRole("row").all();
  const data: { columns: string[]; rows: string[][] } = {
    columns: ['Data', 'Descrizione', 'Categoria', 'Importo'],
    rows: [],
  };
  console.info(`Extracting ${tableBodyRows.length} rows`, performance.now());

  for (const row of tableBodyRows.slice(0, 10)) {
    const cellsLocator = await row.getByRole("cell").all();
    const [date, description, category, _, amount] = await Promise.all(cellsLocator.map(cell => cell.innerHTML()));
    const [mainCategory, subCategory] = category.replace('<br>', '---').split('---');
    const normalizedAmount = amount.replace('<b>','').replace('</b>','').replace('€','');
    data.rows.push([date, description.replace('<b>','').replace('</b>',''), mainCategory, subCategory.replace('<i>','').replace('</i>',''), normalizedAmount]);
  }

  console.log('Extraction finished', performance.now());

  return data

}

export async function colletcMoneymapExpenses({ page, username, password }: { page: Page, username: string, password: string }) {
  await page.goto("https://it.finecobank.com");
  await page.getByRole("button", { name: "ACCETTA TUTTI I COOKIES" }).click();

  console.info('Logging in');
  await page.getByRole("link", { name: "Accedi" }).click();
  await page
    .getByRole("textbox", { name: "Inserisci codice utente" })
    .fill(username);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "ACCEDI" }).click();
  console.info('Logged in');
  await page.waitForSelector("section[id='accounts-container']");
  await page.goto("https://finecobank.com/conto-e-carte/bilancio-familiare");
  await openExpenses({ page });
  await askForSecurity({ page });
  console.info('Access granted');
  await openExpenses({ page });
  await waitForExpenses({ page });

  console.info('Extracting expenses');
  const data = await extractExpensesData({ page });

  console.info('Writing csv');

  await mkdir("results", { recursive: true });

  await writeFile("results/moneymap-expenses.tsv", `${data.columns.join("\t")}\n${data.rows.map(row => row.join("\t")).join("\n")}`);
}

async function colletcMoneymapExpensesWithAuth(args: ScriptArgs) {
  console.info("opening browser...");
  const { browser, context, page } = await createPage();

  try {
    await colletcMoneymapExpenses({ page, ...args });
  } catch (error) {
    console.log("Something went wrong", error);
  }

  console.log("tearing down");

  await tearDown({ context, browser });
  console.log("done");
}

export default colletcMoneymapExpensesWithAuth;
