import { createPage, tearDown } from "./lib/playwright";

async function colletcMoneymapExpenses() {
  console.log("opening browser...");
  const { browser, context, page } = await createPage();

  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;

  try {
    await page.goto("https://it.finecobank.com");
    await page.waitForTimeout(5000);
    await page.getByRole("button", { name: "ACCETTA TUTTI I COOKIES" }).click();

    console.log("logging in");

    await page.getByRole("link", { name: "Accedi" }).click();
    await page.getByRole("textbox", { name: "LOGIN" }).fill(username);
    await page.getByRole("textbox", { name: "PASSWD" }).fill(password);
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
