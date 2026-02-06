import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { CodeBlock } from "./types.js";

import { $ } from "zx";

const shellLanguages = new Set(["bash", "sh", "zsh"]);
const jsLanguages = new Set(["javascript", "js"]);

const executeBlock = async (block: CodeBlock): Promise<void> => {
  const lang = block.language;

  if (lang === undefined || shellLanguages.has(lang)) {
    await $({ verbose: true })`bash -c ${block.code}`;
    return;
  }

  if (jsLanguages.has(lang)) {
    await $({ verbose: true })`node -e ${block.code}`;
    return;
  }

  await $({ verbose: true })`bash -c ${block.code}`;
};

export const runCodeBlocks = async (codeBlocks: readonly CodeBlock[]): Promise<void> => {
  for (const block of codeBlocks) {
    try {
      // oxlint-disable-next-line eslint/no-await-in-loop -- intentional sequential execution
      await executeBlock(block);
    } catch (error: unknown) {
      const lang = block.language ?? "shell";
      throw new Error(`Failed to execute ${lang} code block in section "${block.section.path}"`, {
        cause: error,
      });
    }
  }
};

export const runMarkdown = async (markdown: string): Promise<void> => {
  const zxPath = fileURLToPath(import.meta.resolve("zx/cli"));
  const tempPath = join(tmpdir(), `mdrun-${Date.now()}-${Math.random().toString(36).slice(2)}.md`);
  try {
    await writeFile(tempPath, markdown, "utf-8");
    await $`node ${zxPath} ${tempPath}`;
  } finally {
    await unlink(tempPath).catch(() => {});
  }
};
