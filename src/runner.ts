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
    // oxlint-disable-next-line eslint/no-await-in-loop -- intentional sequential execution
    await executeBlock(block);
  }
};
