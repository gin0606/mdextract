#!/usr/bin/env node

import { readFileSync } from "node:fs";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import type { CliOptions } from "./types.js";

import { filterCodeBlocks } from "./filter.js";
import { formatDryRun, formatSectionList } from "./formatter.js";
import { parseMarkdown } from "./parser.js";
import { runCodeBlocks } from "./runner.js";

const parseCli = async (): Promise<CliOptions> => {
  const argv = await yargs(hideBin(process.argv))
    .command("$0 <file> [section-path]", "Execute code blocks from Markdown files", (y) =>
      y
        .positional("file", {
          demandOption: true,
          describe: "Target Markdown file",
          type: "string",
        })
        .positional("section-path", {
          describe: "Section path to execute",
          type: "string",
        }),
    )
    .option("list", {
      alias: "l",
      default: false,
      describe: "List sections (no execution)",
      type: "boolean",
    })
    .option("dry-run", {
      alias: "n",
      default: false,
      describe: "Show code blocks to be executed (no execution)",
      type: "boolean",
    })
    .strict()
    .help()
    .version()
    .parse();

  return {
    dryRun: Boolean(argv["dry-run"]),
    file: String(argv["file"]),
    list: Boolean(argv["list"]),
    sectionPath: typeof argv["section-path"] === "string" ? argv["section-path"] : undefined,
  };
};

const run = async (options: CliOptions): Promise<void> => {
  const content = readFileSync(options.file, "utf-8");
  const { codeBlocks, sections } = parseMarkdown(content);

  if (options.list) {
    console.log(formatSectionList(sections));
    return;
  }

  const filtered = filterCodeBlocks(codeBlocks, options.sectionPath);

  if (options.dryRun) {
    console.log(formatDryRun(filtered));
    return;
  }

  if (filtered.length === 0) {
    console.log("No code blocks found.");
    return;
  }

  await runCodeBlocks(filtered);
};

const options = await parseCli();
await run(options);
