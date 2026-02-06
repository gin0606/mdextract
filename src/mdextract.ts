#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { extractMarkdown, filterCodeBlocks } from "./filter.js";
import { formatDryRun, formatSectionList } from "./formatter.js";
import { parseMarkdown } from "./parser.js";

const generateFishCompletion = (): string =>
  [
    "# Fish completion for mdextract",
    "# Installation: mdextract completion --fish | source",
    "#    or: mdextract completion --fish > ~/.config/fish/completions/mdextract.fish",
    "",
    "# Section path completions for --section / -s",
    "complete -c mdextract -l section -s s -rfa '(",
    "  set -l tokens (commandline -opc)",
    "  for i in (seq (count $tokens))",
    '    if string match -q -- "*.md" $tokens[$i]',
    "      mdextract --get-yargs-completions $tokens[$i] (commandline -ct) 2>/dev/null",
    "      break",
    "    end",
    "  end",
    ")'",
    "",
    "# Options",
    "complete -c mdextract -l list -s l -d 'List sections'",
    "complete -c mdextract -l dry-run -s n -d 'Show code blocks (no output)'",
    "complete -c mdextract -l help -s h -d 'Show help'",
    "complete -c mdextract -l version -s v -d 'Show version number'",
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

type CliOptions = {
  readonly dryRun: boolean;
  readonly file: string;
  readonly list: boolean;
  readonly sectionPath: string | undefined;
};

const parseCli = async (): Promise<CliOptions> => {
  const argv = await yargs(hideBin(process.argv))
    .command("$0 <file>", "Extract sections from Markdown files", (y) =>
      y.positional("file", {
        demandOption: true,
        describe: "Target Markdown file",
        type: "string",
      }),
    )
    .option("section", {
      alias: "s",
      describe: "Section path to extract",
      type: "string",
    })
    .option("list", {
      alias: "l",
      default: false,
      describe: "List sections",
      type: "boolean",
    })
    .option("dry-run", {
      alias: "n",
      default: false,
      describe: "Show code blocks (no output)",
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

const run = (options: CliOptions): void => {
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

  const markdown = extractMarkdown(content, sections, options.sectionPath);
  process.stdout.write(markdown);
};

const args = hideBin(process.argv);
if (args.includes("completion") && args.includes("--fish")) {
  console.log(generateFishCompletion());
} else {
  try {
    const options = await parseCli();
    run(options);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}
