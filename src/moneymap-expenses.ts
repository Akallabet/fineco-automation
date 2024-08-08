import { createPage, tearDown } from "./lib/playwright";

interface ScriptArgs {
  username: string;
  password: string;
}

async function colletcMoneymapExpenses(args: ScriptArgs) {
  console.log("opening browser...");
  const { browser, context, page } = await createPage();

  try {
    await page.goto("https://it.finecobank.com");
    await page.getByRole("button", { name: "ACCETTA TUTTI I COOKIES" }).click();

    console.log("logging in");

    await page.getByRole("link", { name: "Accedi" }).click();
    await page
      .getByRole("textbox", { name: "Inserisci codice utente" })
      .fill(args.username);
    await page.getByRole("textbox", { name: "Password" }).fill(args.password);
    await page.getByRole("button", { name: "ACCEDI" }).click();
    await page.waitForSelector("section[id='accounts-container']");
    await page.goto("https://finecobank.com/conto-e-carte/bilancio-familiare");
    await page.getByRole("link", { name: "TUTTI" }).click();
    await page
      .locator(
        "#highcharts-0 > svg > g.highcharts-series-group > g:nth-child(1) > rect",
      )
      .click();
    await page
      .locator("#qtip-18")
      .getByRole("link", { name: "SBLOCCA DATI" })
      .last()
      .click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "example.png" });
  } catch (error) {
    console.log("Something went wrong", error);
  }

  console.log("tearing down");

  await tearDown({ context, browser });
  console.log("done");
}

export default colletcMoneymapExpenses;
