import { describe, expect, it } from "vitest";

import { filterCodeBlocks } from "./filter.js";
import type { CodeBlock } from "./types.js";

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
