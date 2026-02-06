import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { $ } from "zx";

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
