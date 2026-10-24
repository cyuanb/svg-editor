import { describe, expect, it } from "vitest";
import { FrontCommand } from "../../../src/commands/FrontCommand.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";

describe("FrontCommand", () => {
  it("moves the shape to the end of its siblings (rendered on top)", () => {
    const doc = new SvgDocument();
    for (const id of ["a", "b", "c"]) doc.attach(new RectShape(id, 0, 0, 1, 1));
    const cmd = new FrontCommand("a");
    expect(cmd.execute(doc)).toBe("rect#a moved to front");
    expect(doc.root.children.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("undo restores the original z-order", () => {
    const doc = new SvgDocument();
    for (const id of ["a", "b", "c"]) doc.attach(new RectShape(id, 0, 0, 1, 1));
    const cmd = new FrontCommand("a");
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("rect#a z-order restored");
    expect(doc.root.children.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("rejects unknown shapes", () => {
    const doc = new SvgDocument();
    expect(() => new FrontCommand("nope").execute(doc)).toThrowError("no such shape: nope");
  });
});
