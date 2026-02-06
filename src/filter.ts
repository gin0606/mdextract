import type { CodeBlock, Section } from "./types.js";

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

export const extractMarkdown = (
  content: string,
  sections: readonly Section[],
  sectionPath: string | undefined,
): string => {
  if (sectionPath === undefined) {
    return content;
  }

  const isMatch = (s: Section): boolean =>
    s.path === sectionPath || s.path.startsWith(`${sectionPath}/`);

  const firstIdx = sections.findIndex((s) => isMatch(s));
  if (firstIdx === -1) {
    return "";
  }

  const startOffset = sections[firstIdx]?.startOffset ?? 0;

  let endOffset = content.length;
  for (let i = firstIdx + 1; i < sections.length; i++) {
    const section = sections[i];
    if (section && !isMatch(section)) {
      endOffset = section.startOffset;
      break;
    }
  }

  return content.slice(startOffset, endOffset);
};
