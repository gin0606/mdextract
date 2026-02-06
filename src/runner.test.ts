import { describe, expect, it, vi } from "vitest";

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
