import type { Heading, PhrasingContent, RootContent } from "mdast";
import type { CodeBlock, ParseResult, Section } from "./types.js";

import remarkParse from "remark-parse";
import { unified } from "unified";

type HeadingStackItem = {
  readonly depth: number;
  readonly text: string;
};

const extractText = (children: readonly PhrasingContent[]): string =>
  children
    .map((child) => {
      if ("value" in child) {
        return child.value;
      }
      return "";
    })
    .join("");

const buildPath = (stack: readonly HeadingStackItem[]): string =>
  stack.map((item) => item.text).join("/");

const processHeading = (node: Heading, stack: HeadingStackItem[], sections: Section[]): void => {
  while (stack.length > 0 && (stack.at(-1)?.depth ?? 0) >= node.depth) {
    stack.pop();
  }
  const text = extractText(node.children);
  stack.push({ depth: node.depth, text });
  const path = buildPath(stack);
  const startOffset = node.position?.start.offset ?? 0;
  sections.push({ heading: text, level: node.depth, path, startOffset });
};

const processNode = (
  node: RootContent,
  stack: HeadingStackItem[],
  sections: Section[],
  codeBlocks: CodeBlock[],
): void => {
  if (node.type === "heading") {
    processHeading(node, stack, sections);
    return;
  }

  if (node.type === "code" && stack.length > 0) {
    const currentSection = sections.at(-1);
    if (currentSection) {
      codeBlocks.push({
        code: node.value,
        language: node.lang ?? undefined,
        section: currentSection,
      });
    }
  }
};

export const parseMarkdown = (content: string): ParseResult => {
  const tree = unified().use(remarkParse).parse(content);
  const stack: HeadingStackItem[] = [];
  const sections: Section[] = [];
  const codeBlocks: CodeBlock[] = [];

  for (const node of tree.children) {
    processNode(node, stack, sections, codeBlocks);
  }

  return { codeBlocks, sections };
};
