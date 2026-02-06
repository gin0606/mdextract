import type { CodeBlock } from "./types.js";

export const filterCodeBlocks = (
  codeBlocks: readonly CodeBlock[],
  sectionPath: string | undefined,
): readonly CodeBlock[] => {
  if (sectionPath === undefined) {
    return codeBlocks;
  }
  return codeBlocks.filter(
    (block) =>
      block.section.path === sectionPath || block.section.path.startsWith(`${sectionPath}/`),
  );
};
