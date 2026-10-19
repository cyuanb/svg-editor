import { afterEach, describe, expect, it, vi } from "vitest";
import { start } from "../../src/app/App.js";

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints the startup banner", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    start();
    expect(log).toHaveBeenCalledWith("svg-editor 0.1 — type 'help' for commands");
  });
});
