import { writeFile } from "node:fs/promises";
import { Page } from "playwright";
import { createPage, tearDown } from "./lib/playwright";

interface ScriptArgs {
  username: string;
  password: string;
}

async function openExpenses({ page }: { page: Page }) {
  await page.getByRole("link", { name: "TUTTI" }).click();
  await page
    .locator(
      "#highcharts-0 > svg > g.highcharts-series-group > g:nth-child(1) > rect",
    )
    .click();
}

export async function extractExpensesData({ page }: { page: Page }) {
  const content = page.getByRole("table", { name: "Tabella Spese" });

  const [tableHead, tableBody] = await content.getByRole("rowgroup").all();
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

  console.log(data);

  await writeFile("moneymap-expenses.csv", `${data.columns.join(",")}\n`);
}

async function colletcMoneymapExpenses(args: ScriptArgs) {
  console.log("opening browser...");
  const { browser, context, page } = await createPage();

  try {
    await page.goto("https://it.finecobank.com");
    await page.getByRole("button", { name: "ACCETTA TUTTI I COOKIES" }).click();

    await page.getByRole("link", { name: "Accedi" }).click();
    await page
      .getByRole("textbox", { name: "Inserisci codice utente" })
      .fill(args.username);
    await page.getByRole("textbox", { name: "Password" }).fill(args.password);
    await page.getByRole("button", { name: "ACCEDI" }).click();
    await page.waitForSelector("section[id='accounts-container']");
    await page.goto("https://finecobank.com/conto-e-carte/bilancio-familiare");
    await openExpenses({ page });
    await page
      .locator("#qtip-18")
      .getByRole("link", { name: "SBLOCCA DATI" })
      .last()
      .click();
    await page.getByRole("dialog").getByText("Conferma operazione").isVisible();
    await page.getByRole("dialog").getByText("Conferma operazione").isHidden();
    await openExpenses({ page });

    await extractExpensesData({ page });
    await page.screenshot({ path: "example.png" });
  } catch (error) {
    console.log("Something went wrong", error);
  }

  console.log("tearing down");

  await tearDown({ context, browser });
  console.log("done");
}

export default colletcMoneymapExpenses;
