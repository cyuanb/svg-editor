import { describe, expect, it } from "vitest";
import { BackCommand } from "../../../src/commands/BackCommand.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";

describe("BackCommand", () => {
  it("moves the shape to the start of its siblings (rendered below)", () => {
    const doc = new SvgDocument();
    for (const id of ["a", "b", "c"]) doc.attach(new RectShape(id, 0, 0, 1, 1));
    const cmd = new BackCommand("c");
    expect(cmd.execute(doc)).toBe("rect#c moved to back");
    expect(doc.root.children.map((s) => s.id)).toEqual(["c", "a", "b"]);
  });

  it("undo restores the original z-order", () => {
    const doc = new SvgDocument();
    for (const id of ["a", "b", "c"]) doc.attach(new RectShape(id, 0, 0, 1, 1));
    const cmd = new BackCommand("c");
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("rect#c z-order restored");
    expect(doc.root.children.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("rejects unknown shapes", () => {
    const doc = new SvgDocument();
    expect(() => new BackCommand("nope").execute(doc)).toThrowError("no such shape: nope");
  });
});
