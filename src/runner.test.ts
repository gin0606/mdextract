import { describe, expect, it, vi } from "vitest";

import type { CodeBlock } from "./types.js";

const mockDollar = vi.fn();
const mockFactory = Object.assign(
  vi.fn(() => mockDollar),
  { _inner: mockDollar },
);

vi.mock("zx", () => ({ $: mockFactory }));

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
