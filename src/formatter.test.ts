import { describe, expect, it } from "vitest";

import { formatDryRun, formatSectionList } from "./formatter.js";
import type { CodeBlock, Section } from "./types.js";

describe("formatSectionList", () => {
  it("should format sections with indentation", () => {
    const sections: readonly Section[] = [
      { heading: "Project", level: 1, path: "Project" },
      { heading: "Setup", level: 2, path: "Project/Setup" },
      { heading: "Database", level: 3, path: "Project/Setup/Database" },
      { heading: "Redis", level: 3, path: "Project/Setup/Redis" },
      { heading: "Development", level: 2, path: "Project/Development" },
    ];

    const result = formatSectionList(sections);

    expect(result).toBe(
      [
        "",
        "Sections:",
        "  Project",
        "  Project/Setup",
        "  Project/Setup/Database",
        "  Project/Setup/Redis",
        "  Project/Development",
        "",
      ].join("\n"),
    );
  });

  it("should handle empty sections", () => {
    const result = formatSectionList([]);
    expect(result).toBe("\nSections:\n\n");
  });
});

describe("formatDryRun", () => {
  it("should format code blocks with section and language", () => {
    const codeBlocks: readonly CodeBlock[] = [
      {
        code: "createdb myapp",
        language: "bash",
        section: { heading: "Database", level: 3, path: "Setup/Database" },
      },
      {
        code: "redis-server",
        language: "bash",
        section: { heading: "Redis", level: 3, path: "Setup/Redis" },
      },
    ];

    const result = formatDryRun(codeBlocks);

    expect(result).toBe(
      [
        "",
        "Section: Setup/Database",
        "Language: bash",
        "---",
        "createdb myapp",
        "---",
        "",
        "Section: Setup/Redis",
        "Language: bash",
        "---",
        "redis-server",
        "---",
        "",
      ].join("\n"),
    );
  });

  it("should show 'unknown' for blocks without language", () => {
    const codeBlocks: readonly CodeBlock[] = [
      {
        code: "echo hello",
        language: undefined,
        section: { heading: "Test", level: 1, path: "Test" },
      },
    ];

    const result = formatDryRun(codeBlocks);
    expect(result).toContain("Language: unknown");
  });

  it("should return empty string for empty code blocks", () => {
    const result = formatDryRun([]);
    expect(result).toBe("");
  });
});
