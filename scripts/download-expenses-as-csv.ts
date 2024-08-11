#!/usr/bin/env node

import colletcMoneymapExpenses from "../src/fineco-expenses";

interface Args {
  username: string;
  password: string;
}
function parseCliArgs() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log(
      "usage: download-moneymap-expenses-as-csv -u <username> -p <password>",
    );
    process.exit(1);
  }
  const cmd: Args = {
    username: "",
    password: "",
  };

  args.reduce((flag: keyof Args | "", arg) => {
    if (arg === "-u") {
      return "username";
    }
    if (arg === "-p") {
      return "password";
    }
    if (flag === "username" || flag === "password") {
      cmd[flag] = arg;
    }
    return flag;
  }, "");

  if (!cmd.username || !cmd.password) {
    console.log(
      "usage: download-moneymap-expenses-as-csv -u <username> -p <password>",
    );
    process.exit(1);
  }
  return cmd;
}

async function downloadMoneymapExpensesAsCsv() {
  const { username, password } = parseCliArgs();
  await colletcMoneymapExpenses({ username, password });
}

downloadMoneymapExpensesAsCsv();
