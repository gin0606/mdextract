#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { extractMarkdown, filterCodeBlocks } from "./filter.js";
import { formatDryRun, formatSectionList } from "./formatter.js";
import { parseMarkdown } from "./parser.js";
import type { Section } from "./types.js";

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
    "# Exclude path completions for --exclude / -x",
    "complete -c mdextract -l exclude -s x -rfa '(",
    "  set -l tokens (commandline -opc)",
    '  set -l section_val ""',
    "  for i in (seq (count $tokens))",
    '    if string match -q -- "-s" $tokens[$i]; or string match -q -- "--section" $tokens[$i]',
    "      set section_val $tokens[(math $i + 1)]",
    "    end",
    "  end",
    "  for i in (seq (count $tokens))",
    '    if string match -q -- "*.md" $tokens[$i]',
    '      mdextract --get-yargs-completions $tokens[$i] --section "$section_val" --exclude (commandline -ct) 2>/dev/null',
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

const readSections = (argv: Record<string, unknown>): readonly Section[] | undefined => {
  const positionals = argv["_"];
  const file = Array.isArray(positionals) ? (positionals.at(0) as unknown) : undefined;
  if (typeof file !== "string" || !existsSync(file)) {
    return undefined;
  }
  const content = readFileSync(file, "utf-8");
  return parseMarkdown(content).sections;
};

const completeArgs = (
  _current: string,
  argv: Record<string, unknown>,
  done: (completions: readonly string[]) => void,
): void => {
  const sections = readSections(argv);
  if (!sections) {
    done([]);
    return;
  }

  // When completing --exclude, return child paths relative to --section
  if (argv["exclude"] !== undefined) {
    const sectionPath = typeof argv["section"] === "string" ? argv["section"] : undefined;
    const prefix = sectionPath === undefined ? "" : `${sectionPath}/`;
    const candidates = sections
      .filter((s) => s.path.startsWith(prefix) && s.path !== sectionPath)
      .map((s) => s.path.slice(prefix.length));
    done(candidates);
    return;
  }

  // Default: complete --section
  done(sections.map((s) => s.path));
};

type CliOptions = {
  readonly dryRun: boolean;
  readonly excludePaths: readonly string[];
  readonly file: string;
  readonly list: boolean;
  readonly sectionPath: string | undefined;
};

const resolveExcludePaths = (
  rawExclude: readonly string[],
  sectionPath: string | undefined,
): readonly string[] =>
  rawExclude.map((e) => (sectionPath === undefined ? e : `${sectionPath}/${e}`));

const buildYargs = () =>
  yargs(hideBin(process.argv))
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
    .option("exclude", {
      alias: "x",
      array: true,
      default: [] as string[],
      describe: "Exclude section paths (relative to --section)",
      type: "string",
    })
    .option("dry-run", {
      alias: "n",
      default: false,
      describe: "Show code blocks (no output)",
      type: "boolean",
    })
    .completion("completion", "Generate shell completion script", completeArgs)
    .strict()
    .help()
    .version();

const parseCli = async (): Promise<CliOptions> => {
  const argv = await buildYargs().parse();
  const sectionPath = typeof argv["section"] === "string" ? argv["section"] : undefined;
  const rawExclude = Array.isArray(argv["exclude"]) ? argv["exclude"] : [];

  return {
    dryRun: Boolean(argv["dry-run"]),
    excludePaths: resolveExcludePaths(rawExclude, sectionPath),
    file: String(argv["file"]),
    list: Boolean(argv["list"]),
    sectionPath,
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

  const filtered = filterCodeBlocks(codeBlocks, options.sectionPath, options.excludePaths);

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

  const markdown = extractMarkdown(content, sections, options.sectionPath, options.excludePaths);
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
