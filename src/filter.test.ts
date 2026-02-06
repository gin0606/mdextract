import { describe, expect, it } from "vitest";

import { extractMarkdown, filterCodeBlocks } from "./filter.js";
import type { CodeBlock, Section } from "./types.js";

const makeBlock = (path: string, code: string): CodeBlock => ({
  code,
  language: "bash",
  section: { heading: path.split("/").at(-1) ?? "", level: 1, path, startOffset: 0 },
});

const blocks: readonly CodeBlock[] = [
  makeBlock("Project/Setup/Database", "createdb myapp"),
  makeBlock("Project/Setup/Redis", "redis-server"),
  makeBlock("Project/Development", "npm run dev"),
];

describe("filterCodeBlocks", () => {
  it("should return all blocks when sectionPath is undefined", () => {
    const sectionPath: string | undefined = undefined;
    const result = filterCodeBlocks(blocks, sectionPath);
    expect(result).toEqual(blocks);
  });

  it("should filter by exact match", () => {
    const result = filterCodeBlocks(blocks, "Project/Setup/Database");
    expect(result).toHaveLength(1);
    expect(result.at(0)?.code).toBe("createdb myapp");
  });

  it("should filter by prefix match including descendants", () => {
    const result = filterCodeBlocks(blocks, "Project/Setup");
    expect(result).toHaveLength(2);
    expect(result.at(0)?.code).toBe("createdb myapp");
    expect(result.at(1)?.code).toBe("redis-server");
  });

  it("should filter all blocks under root section", () => {
    const result = filterCodeBlocks(blocks, "Project");
    expect(result).toHaveLength(3);
  });

  it("should not match partial section names", () => {
    const result = filterCodeBlocks(blocks, "Setup");
    expect(result).toHaveLength(0);
  });

  it("should return empty array for non-existent section", () => {
    const result = filterCodeBlocks(blocks, "NonExistent");
    expect(result).toHaveLength(0);
  });
});

const markdownContent = `# Project

## Setup

\`\`\`bash
createdb myapp
\`\`\`

### Database

\`\`\`bash
psql -d myapp
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`
`;

const markdownSections: readonly Section[] = [
  { heading: "Project", level: 1, path: "Project", startOffset: 0 },
  { heading: "Setup", level: 2, path: "Project/Setup", startOffset: 11 },
  { heading: "Database", level: 3, path: "Project/Setup/Database", startOffset: 49 },
  { heading: "Development", level: 2, path: "Project/Development", startOffset: 90 },
];

describe("extractMarkdown", () => {
  it("should return full content when sectionPath is undefined", () => {
    const sectionPath: string | undefined = undefined;
    const result = extractMarkdown(markdownContent, markdownSections, sectionPath);
    expect(result).toBe(markdownContent);
  });

  it("should extract by exact section match", () => {
    const result = extractMarkdown(markdownContent, markdownSections, "Project/Development");
    expect(result).toBe("## Development\n\n```bash\nnpm run dev\n```\n");
  });

  it("should extract by prefix match including child sections", () => {
    const result = extractMarkdown(markdownContent, markdownSections, "Project/Setup");
    expect(result).toContain("## Setup");
    expect(result).toContain("### Database");
    expect(result).not.toContain("## Development");
  });

  it("should return empty string for non-existent section", () => {
    const result = extractMarkdown(markdownContent, markdownSections, "NonExistent");
    expect(result).toBe("");
  });

  it("should extract last section to end of content", () => {
    const result = extractMarkdown(markdownContent, markdownSections, "Project/Development");
    expect(result).toBe(markdownContent.slice(90));
  });
});
