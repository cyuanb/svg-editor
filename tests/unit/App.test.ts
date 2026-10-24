import { describe, expect, it } from "vitest";
import { BANNER } from "../../src/cli/Repl.js";
import { start } from "../../src/app/App.js";

describe("App", () => {
  it("keeps the lab startup banner", () => {
    expect(BANNER).toBe("svg-editor 0.1 — type 'help' for commands");
  });

  it("exposes an async composition root", () => {
    expect(typeof start).toBe("function");
  });
});
