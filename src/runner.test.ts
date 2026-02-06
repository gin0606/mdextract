import { describe, expect, it, vi } from "vitest";

import type { CodeBlock } from "./types.js";

const mockDollar = vi.fn();
const mockFactory = Object.assign(
  vi.fn(() => mockDollar),
  { _inner: mockDollar },
);

vi.mock("zx", () => ({ $: mockFactory }));

const mockWriteFile = vi.fn();
const mockUnlink = vi.fn();

vi.mock("node:fs/promises", () => ({
  unlink: (...args: unknown[]) => mockUnlink(...args) as unknown,
  writeFile: (...args: unknown[]) => mockWriteFile(...args) as unknown,
}));

const makeBlock = (code: string, language?: string): CodeBlock => ({
  code,
  language,
  section: { heading: "Test", level: 1, path: "Test", startOffset: 0 },
});

describe("runCodeBlocks", () => {
  it("should execute shell code blocks", async () => {
    mockDollar.mockResolvedValue({ exitCode: 0, stderr: "", stdout: "" });

    const { runCodeBlocks } = await import("./runner.js");
    await runCodeBlocks([makeBlock("echo hello", "bash")]);

    expect(mockFactory).toHaveBeenCalledWith({ verbose: true });
    expect(mockDollar).toHaveBeenCalled();
  });

  it("should execute javascript code blocks with node", async () => {
    mockDollar.mockResolvedValue({ exitCode: 0, stderr: "", stdout: "" });

    const { runCodeBlocks } = await import("./runner.js");
    await runCodeBlocks([makeBlock("console.log('hi')", "javascript")]);

    expect(mockFactory).toHaveBeenCalledWith({ verbose: true });
  });

  it("should execute blocks without language as shell", async () => {
    mockDollar.mockResolvedValue({ exitCode: 0, stderr: "", stdout: "" });

    const { runCodeBlocks } = await import("./runner.js");
    const noLang: string | undefined = undefined;
    await runCodeBlocks([makeBlock("echo test", noLang)]);

    expect(mockFactory).toHaveBeenCalledWith({ verbose: true });
  });

  it("should execute multiple blocks in order", async () => {
    const callOrder: string[] = [];
    mockDollar.mockImplementation(() => {
      callOrder.push("called");
      return Promise.resolve({ exitCode: 0, stderr: "", stdout: "" });
    });

    const { runCodeBlocks } = await import("./runner.js");
    await runCodeBlocks([makeBlock("echo first", "bash"), makeBlock("echo second", "bash")]);

    expect(callOrder).toHaveLength(2);
  });

  it("should propagate errors from failed commands", async () => {
    mockDollar.mockRejectedValue(new Error("command failed"));

    const { runCodeBlocks } = await import("./runner.js");
    await expect(() => runCodeBlocks([makeBlock("exit 1", "bash")])).rejects.toThrow(
      'Failed to execute bash code block in section "Test"',
    );
  });
});

describe("runMarkdown", () => {
  it("should write markdown to temp file and execute with zx", async () => {
    // oxlint-disable-next-line eslint-plugin-unicorn/no-useless-undefined -- required by mock API
    mockWriteFile.mockResolvedValue(undefined);
    // oxlint-disable-next-line eslint-plugin-unicorn/no-useless-undefined -- required by mock API
    mockUnlink.mockResolvedValue(undefined);
    // $ is called as tagged template in runMarkdown
    mockFactory.mockResolvedValue({ exitCode: 0, stderr: "", stdout: "" });

    const { runMarkdown } = await import("./runner.js");
    await runMarkdown("# Test\n\n```bash\necho hello\n```\n");

    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining("mdrun-"),
      "# Test\n\n```bash\necho hello\n```\n",
      "utf-8",
    );
    expect(mockFactory).toHaveBeenCalled();
    expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining("mdrun-"));

    // Restore default behavior for other tests
    mockFactory.mockImplementation(() => mockDollar);
  });

  it("should clean up temp file even on execution failure", async () => {
    // oxlint-disable-next-line eslint-plugin-unicorn/no-useless-undefined -- required by mock API
    mockWriteFile.mockResolvedValue(undefined);
    // oxlint-disable-next-line eslint-plugin-unicorn/no-useless-undefined -- required by mock API
    mockUnlink.mockResolvedValue(undefined);
    // $ is called as tagged template in runMarkdown, so mockFactory itself must reject
    mockFactory.mockRejectedValue(new Error("zx failed"));

    const { runMarkdown } = await import("./runner.js");
    await expect(() => runMarkdown("# Test\n\n```bash\nexit 1\n```\n")).rejects.toThrow(
      "zx failed",
    );

    expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining("mdrun-"));

    // Restore default behavior for other tests
    mockFactory.mockImplementation(() => mockDollar);
  });
});
