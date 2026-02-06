import { describe, expect, it } from "vitest";

import { parseMarkdown } from "./parser.js";

describe("parseMarkdown", () => {
  it("should parse a simple markdown with one heading and one code block", () => {
    const content = `# Setup

\`\`\`bash
pnpm install
\`\`\`
`;
    const result = parseMarkdown(content);

    expect(result.sections).toEqual([{ heading: "Setup", level: 1, path: "Setup" }]);
    expect(result.codeBlocks).toEqual([
      {
        code: "pnpm install",
        language: "bash",
        section: { heading: "Setup", level: 1, path: "Setup" },
      },
    ]);
  });

  it("should build nested section paths", () => {
    const content = `# Project

## Setup

### Database

\`\`\`bash
createdb myapp
\`\`\`

### Redis

\`\`\`bash
redis-server
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`
`;
    const result = parseMarkdown(content);

    expect(result.sections).toEqual([
      { heading: "Project", level: 1, path: "Project" },
      { heading: "Setup", level: 2, path: "Project/Setup" },
      { heading: "Database", level: 3, path: "Project/Setup/Database" },
      { heading: "Redis", level: 3, path: "Project/Setup/Redis" },
      { heading: "Development", level: 2, path: "Project/Development" },
    ]);

    expect(result.codeBlocks).toHaveLength(3);
  });

  describe("same-level headings", () => {
    it("should switch paths correctly", () => {
      const content = `## First

\`\`\`bash
echo first
\`\`\`

## Second

\`\`\`bash
echo second
\`\`\`
`;
      const result = parseMarkdown(content);

      expect(result.sections).toEqual([
        { heading: "First", level: 2, path: "First" },
        { heading: "Second", level: 2, path: "Second" },
      ]);

      expect(result.codeBlocks).toHaveLength(2);
      expect(result.codeBlocks.at(0)?.section.path).toBe("First");
      expect(result.codeBlocks.at(1)?.section.path).toBe("Second");
    });
  });

  it("should handle code blocks without language specification", () => {
    const content = `# Test

\`\`\`
echo hello
\`\`\`
`;
    const result = parseMarkdown(content);

    expect(result.codeBlocks).toHaveLength(1);
    expect(result.codeBlocks.at(0)?.language).toBeUndefined();
    expect(result.codeBlocks.at(0)?.code).toBe("echo hello");
  });

  it("should skip code blocks before any heading", () => {
    const content = `\`\`\`bash
orphan code
\`\`\`

# Setup

\`\`\`bash
pnpm install
\`\`\`
`;
    const result = parseMarkdown(content);

    expect(result.codeBlocks).toHaveLength(1);
    expect(result.codeBlocks.at(0)?.code).toBe("pnpm install");
  });

  it("should return empty results for empty content", () => {
    const result = parseMarkdown("");

    expect(result.sections).toEqual([]);
    expect(result.codeBlocks).toEqual([]);
  });

  it("should return empty code blocks for markdown with no code blocks", () => {
    const content = `# Title

Some text.

## Subtitle

More text.
`;
    const result = parseMarkdown(content);

    expect(result.sections).toHaveLength(2);
    expect(result.codeBlocks).toEqual([]);
  });

  describe("multiple code blocks in one section", () => {
    it("should associate all blocks with the same section", () => {
      const content = `# Setup

\`\`\`bash
step one
\`\`\`

\`\`\`bash
step two
\`\`\`
`;
      const result = parseMarkdown(content);

      expect(result.codeBlocks).toHaveLength(2);
      expect(result.codeBlocks.at(0)?.code).toBe("step one");
      expect(result.codeBlocks.at(1)?.code).toBe("step two");
      expect(result.codeBlocks.at(0)?.section.path).toBe("Setup");
      expect(result.codeBlocks.at(1)?.section.path).toBe("Setup");
    });
  });
});
