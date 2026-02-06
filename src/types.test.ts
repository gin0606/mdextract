import { describe, expect, it } from "vitest";

import type { Section } from "./types.js";

describe("types", () => {
  it("should create a valid Section", () => {
    const section: Section = {
      heading: "Setup",
      level: 2,
      path: "Project/Setup",
      startOffset: 0,
    };

    expect(section.heading).toBe("Setup");
    expect(section.level).toBe(2);
    expect(section.path).toBe("Project/Setup");
    expect(section.startOffset).toBe(0);
  });
});
