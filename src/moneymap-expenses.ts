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
    await page.waitForTimeout(5000);
    await page.getByRole("button", { name: "ACCETTA TUTTI I COOKIES" }).click();

    console.log("logging in");

    await page.getByRole("link", { name: "Accedi" }).click();
    await page.getByRole("textbox", { name: "LOGIN" }).fill(args.username);
    await page.getByRole("textbox", { name: "PASSWD" }).fill(args.password);
    await page.getByRole("button", { name: "ACCEDI" }).click();
    await page.screenshot({ path: "example.png" });
  } catch (error) {
    console.log("Something went wrong", error);
  }

  console.log("tearing down");

  await tearDown({ context, browser });
  console.log("done");
}

export default colletcMoneymapExpenses;
