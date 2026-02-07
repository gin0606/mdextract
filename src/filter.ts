import type { CodeBlock, Section } from "./types.js";

const isExcluded = (path: string, excludePaths: readonly string[]): boolean =>
  excludePaths.some((ep) => path === ep || path.startsWith(`${ep}/`));

export const filterCodeBlocks = (
  codeBlocks: readonly CodeBlock[],
  sectionPath: string | undefined,
  excludePaths: readonly string[] = [],
): readonly CodeBlock[] => {
  if (sectionPath === undefined && excludePaths.length === 0) {
    return codeBlocks;
  }
  return codeBlocks.filter((block) => {
    const path = block.section.path;
    if (sectionPath !== undefined && path !== sectionPath && !path.startsWith(`${sectionPath}/`)) {
      return false;
    }
    return !isExcluded(path, excludePaths);
  });
};

type Range = { readonly end: number; readonly start: number };

const collectExcludedRanges = (
  sections: readonly Section[],
  excludePaths: readonly string[],
  firstIdx: number,
  endOffset: number,
  isMatch: (s: Section) => boolean,
): readonly Range[] => {
  const ranges: Range[] = [];
  for (let i = firstIdx; i < sections.length; i++) {
    const section = sections[i];
    if (!section || section.startOffset >= endOffset) {
      break;
    }
    if (!isMatch(section)) {
      break;
    }

    if (isExcluded(section.path, excludePaths)) {
      const exStart = section.startOffset;
      let exEnd = endOffset;
      for (let j = i + 1; j < sections.length; j++) {
        const next = sections[j];
        if (!next || next.startOffset >= endOffset) {
          break;
        }
        if (!isExcluded(next.path, excludePaths)) {
          exEnd = next.startOffset;
          break;
        }
      }
      ranges.push({ end: exEnd, start: exStart });
    }
  }
  return ranges;
};

const sliceExcluding = (
  content: string,
  startOffset: number,
  endOffset: number,
  excludedRanges: readonly Range[],
): string => {
  if (excludedRanges.length === 0) {
    return content.slice(startOffset, endOffset);
  }
  let result = "";
  let cursor = startOffset;
  for (const range of excludedRanges) {
    if (range.start > cursor) {
      result += content.slice(cursor, range.start);
    }
    cursor = range.end;
  }
  if (cursor < endOffset) {
    result += content.slice(cursor, endOffset);
  }
  return result;
};

const findSectionRange = (
  sections: readonly Section[],
  contentLength: number,
  isMatch: (s: Section) => boolean,
): { endOffset: number; firstIdx: number; startOffset: number } | undefined => {
  const firstIdx = sections.findIndex((s) => isMatch(s));
  if (firstIdx === -1) {
    return undefined;
  }
  const startOffset = sections[firstIdx]?.startOffset ?? 0;
  let endOffset = contentLength;
  for (let i = firstIdx + 1; i < sections.length; i++) {
    const section = sections[i];
    if (section && !isMatch(section)) {
      endOffset = section.startOffset;
      break;
    }
  }
  return { endOffset, firstIdx, startOffset };
};

export const extractMarkdown = (
  content: string,
  sections: readonly Section[],
  sectionPath: string | undefined,
  excludePaths: readonly string[] = [],
): string => {
  if (sectionPath === undefined && excludePaths.length === 0) {
    return content;
  }

  const isMatch = (s: Section): boolean =>
    sectionPath === undefined || s.path === sectionPath || s.path.startsWith(`${sectionPath}/`);

  const range = findSectionRange(sections, content.length, isMatch);
  if (!range) {
    return "";
  }

  const { endOffset, firstIdx, startOffset } = range;

  if (excludePaths.length === 0) {
    return content.slice(startOffset, endOffset);
  }

  const excludedRanges = collectExcludedRanges(
    sections,
    excludePaths,
    firstIdx,
    endOffset,
    isMatch,
  );
  return sliceExcluding(content, startOffset, endOffset, excludedRanges);
};
