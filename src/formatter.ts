import type { CodeBlock, Section } from "./types.js";

export const formatSectionList = (sections: readonly Section[]): string => {
  const lines = sections.map((section) => `  ${section.path}`);
  return `\nSections:\n${lines.join("\n")}\n`;
};

export const formatDryRun = (codeBlocks: readonly CodeBlock[]): string => {
  const entries = codeBlocks.map((block) => {
    const language = block.language ?? "unknown";
    return `\nSection: ${block.section.path}\nLanguage: ${language}\n---\n${block.code}\n---\n`;
  });
  return entries.join("");
};
