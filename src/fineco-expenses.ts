import { mkdir, writeFile } from "node:fs/promises";
import { JSDOM } from 'jsdom'
import type { Page } from "playwright";
import { createPage, tearDown } from "./lib/playwright.ts";

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
  await page.getByRole("dialog").getByText("Conferma operazione").waitFor({ state: 'visible' });
  await page.getByRole("dialog").getByText("Conferma operazione").waitFor({ state: 'detached' });
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
  await content.waitFor({ state: 'visible' })

  const data: { columns: string[]; rows: string[][] } = {
    columns: ['Data', 'Descrizione', 'Originale', 'Categoria', 'Sotto Categoria', 'Tags', 'Importo'],
    rows: [],
  };
  const table = `<table>${await content.innerHTML()}</table>`

  const { window: { document } } = new JSDOM(table)

  const tableBody = document.querySelector('tbody')
  if (!tableBody) {
    throw new Error('Table body not found');
  }

  const rows = Array.from(tableBody.querySelectorAll('tr'))

  for (const row of rows) {
    if (row.classList.contains('description')) {
      const cells = Array.from(row.querySelectorAll('td'))
      const date = cells[1].innerHTML
      const description = cells[2].innerHTML
      const originalCategory = cells[3].innerHTML.replace('<i>', '').replace('</i>', '').replace('<br>', ' - ')
      const category = originalCategory.split(' - ')[0]
      const subCategory = originalCategory.split(' - ')[1]
      const amount = cells[5].innerHTML
      const normalizedAmount = amount.replace('<b>', '').replace('</b>', '').replace('€', '');
      data.rows.push([date, description.replace('<b>', '').replace('</b>', ''), originalCategory, category, subCategory, '', normalizedAmount]);
    }
    if (row.classList.contains('detail')) {
      const tags = Array.from(row.querySelectorAll('.div-tags>a')).map(tag => tag.childNodes.item(0).textContent?.trim())
      if (tags.length > 0) {
        data.rows[data.rows.length - 1][5] = tags.join(';')
      }
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
