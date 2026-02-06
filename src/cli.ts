#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import type { CliOptions } from "./types.js";

import { filterCodeBlocks } from "./filter.js";
import { formatDryRun, formatSectionList } from "./formatter.js";
import { parseMarkdown } from "./parser.js";
import { runCodeBlocks } from "./runner.js";

const generateFishCompletion = (): string =>
  [
    "# Fish completion for mdrun",
    "# Installation: mdrun completion --fish | source",
    "#    or: mdrun completion --fish > ~/.config/fish/completions/mdrun.fish",
    "",
    "# Section path completions for --section / -s",
    "complete -c mdrun -l section -s s -rfa '(",
    "  set -l tokens (commandline -opc)",
    "  for i in (seq (count $tokens))",
    '    if string match -q -- "*.md" $tokens[$i]',
    "      mdrun --get-yargs-completions $tokens[$i] (commandline -ct) 2>/dev/null",
    "      break",
    "    end",
    "  end",
    ")'",
    "",
    "# Options",
    "complete -c mdrun -l list -s l -d 'List sections (no execution)'",
    "complete -c mdrun -l dry-run -s n -d 'Show code blocks to be executed (no execution)'",
    "complete -c mdrun -l help -s h -d 'Show help'",
    "complete -c mdrun -l version -s v -d 'Show version number'",
  ].join("\n");

const completeSectionPath = (
  _current: string,
  argv: Record<string, unknown>,
  done: (completions: readonly string[]) => void,
): void => {
  const positionals = argv["_"];
  const file = Array.isArray(positionals) ? (positionals.at(0) as unknown) : undefined;
  if (typeof file !== "string" || !existsSync(file)) {
    done([]);
    return;
  }
  const content = readFileSync(file, "utf-8");
  const { sections } = parseMarkdown(content);
  done(sections.map((s) => s.path));
};

const parseCli = async (): Promise<CliOptions> => {
  const argv = await yargs(hideBin(process.argv))
    .command("$0 <file>", "Execute code blocks from Markdown files", (y) =>
      y.positional("file", {
        demandOption: true,
        describe: "Target Markdown file",
        type: "string",
      }),
    )
    .option("section", {
      alias: "s",
      describe: "Section path to execute",
      type: "string",
    })
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
    .completion("completion", "Generate shell completion script", completeSectionPath)
    .strict()
    .help()
    .version()
    .parse();

  return {
    dryRun: Boolean(argv["dry-run"]),
    file: String(argv["file"]),
    list: Boolean(argv["list"]),
    sectionPath: typeof argv["section"] === "string" ? argv["section"] : undefined,
  };
};

const run = async (options: CliOptions): Promise<void> => {
  if (!existsSync(options.file)) {
    console.error(`Error: File not found: ${options.file}`);
    process.exitCode = 1;
    return;
  }

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
    if (options.sectionPath !== undefined) {
      const sectionExists = sections.some(
        (s) => s.path === options.sectionPath || s.path.startsWith(`${options.sectionPath}/`),
      );
      if (!sectionExists) {
        console.error(`Warning: Section not found: ${options.sectionPath}`);
      }
    }
    console.log("No code blocks found.");
    return;
  }

  await runCodeBlocks(filtered);
};

const args = hideBin(process.argv);
if (args.includes("completion") && args.includes("--fish")) {
  console.log(generateFishCompletion());
} else {
  try {
    const options = await parseCli();
    await run(options);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}
