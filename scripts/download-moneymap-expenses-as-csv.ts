import colletcMoneymapExpenses from "../src/moneymap-expenses";

async function downloadMoneymapExpensesAsCsv() {
  await colletcMoneymapExpenses();
}

downloadMoneymapExpensesAsCsv();
