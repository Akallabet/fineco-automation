import { writeFile } from "node:fs/promises";
import { Page } from "playwright";
import { createPage, tearDown } from "./lib/playwright";
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
  await page.getByRole("dialog").getByText("Conferma operazione").isVisible();
  await page.getByRole("dialog").getByText("Conferma operazione").isHidden();
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

  // const rows = await content.getByRole("row").all();
  const rowsHeader = await content.getByRole("rowheader").all();
  console.log(rowsHeader)
  const [tableHead, tableBody] = await content.getByRole("rowgroup").all();
  console.info(tableHead)
  const data: { columns: string[]; rows: string[][] } = {
    columns: [],
    rows: [],
  };
  const headerRows = await tableHead.getByRole("columnheader").all()
  console.log(headerRows)
  for await (const cell of headerRows) {
    const text = await cell.textContent();
    if (text) {
      data.columns.push(text);
    }
  }

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

  await writeFile("moneymap-expenses.csv", `${data.columns.join(",")}\n`);

  await page.screenshot({ path: "example.png" });
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
