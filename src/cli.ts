#!/usr/bin/env node

import { runMarkdown } from "./runner.js";

let input = "";
process.stdin.setEncoding("utf-8");
for await (const chunk of process.stdin) {
  input += chunk;
}
await runMarkdown(input);
