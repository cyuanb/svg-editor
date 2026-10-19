import { describe, expect, it } from "vitest";
import { DeleteCommand } from "../../../src/commands/DeleteCommand.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";

describe("DeleteCommand", () => {
  it("deletes a leaf and reports the lab message", () => {
    const doc = new SvgDocument();
    doc.attach(new RectShape("box", 200, 80, 60, 60, "#3366ff"));
    const cmd = new DeleteCommand("box");
    expect(cmd.execute(doc)).toBe("rect#box deleted");
    expect(doc.findById("box")).toBeUndefined();
  });

  it("rejects unknown ids", () => {
    const doc = new SvgDocument();
    expect(() => new DeleteCommand("r9").execute(doc)).toThrowError("no such shape: r9");
  });

  it("undo restores the shape into its parent at the original index", () => {
    const doc = new SvgDocument();
    const markers = new GroupShape("markers");
    doc.attach(markers);
    doc.attach(new RectShape("a", 0, 0, 1, 1), markers);
    doc.attach(new RectShape("b", 0, 0, 1, 1), markers);
    doc.attach(new RectShape("c", 0, 0, 1, 1), markers);

    const cmd = new DeleteCommand("b");
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("rect#b restored into g#markers");
    expect(markers.children.map((s) => s.id)).toEqual(["a", "b", "c"]);
    expect(doc.findById("b")).toBeDefined();
  });

  it("deletes a container with its whole subtree; undo restores everything", () => {
    const doc = new SvgDocument();
    const markers = new GroupShape("markers");
    const box = new RectShape("box", 0, 0, 1, 1);
    doc.attach(markers);
    doc.attach(box, markers);
    expect(doc.countElements()).toBe(2);

    const cmd = new DeleteCommand("markers");
    expect(cmd.execute(doc)).toBe("g#markers deleted");
    expect(doc.countElements()).toBe(0);

    expect(cmd.undo(doc)).toBe("g#markers restored into svg");
    expect(doc.countElements()).toBe(2);
    expect(doc.findById("box")).toBe(box);
  });
});
