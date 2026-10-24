import { describe, expect, it } from "vitest";
import { UngroupCommand } from "../../../src/commands/UngroupCommand.js";
import { CircleShape } from "../../../src/core/CircleShape.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";

describe("UngroupCommand", () => {
  function nestedDoc(): SvgDocument {
    const doc = new SvgDocument();
    const flow = new GroupShape("flow");
    const inner = new GroupShape("inner");
    const x = new RectShape("x", 0, 0, 1, 1);
    const a = new CircleShape("a", 0, 0, 1);
    const b = new CircleShape("b", 0, 0, 1);
    doc.attach(flow);
    doc.attach(x, flow);
    doc.attach(inner, flow);
    doc.attach(a, inner);
    doc.attach(b, inner);
    return doc;
  }

  it("lifts children to the grandparent at the group's position", () => {
    const doc = nestedDoc();
    const cmd = new UngroupCommand("inner");
    expect(cmd.execute(doc)).toBe("g#inner ungrouped (2 children)");
    expect(doc.requireContainer("flow").children.map((s) => s.id)).toEqual(["x", "a", "b"]);
    expect(doc.findById("inner")).toBeUndefined();
    expect(doc.countElements()).toBe(4);
  });

  it("rejects top-level containers with the lab message", () => {
    const doc = nestedDoc();
    doc.attach(new GroupShape("scene"));
    expect(() => new UngroupCommand("scene").execute(doc)).toThrowError(
      "cannot ungroup top-level container: scene"
    );
  });

  it("rejects leaves and missing shapes", () => {
    const doc = nestedDoc();
    expect(() => new UngroupCommand("x").execute(doc)).toThrowError("not a container: x");
    expect(() => new UngroupCommand("nope").execute(doc)).toThrowError("no such shape: nope");
  });

  it("undo restores the group with its children at the original position", () => {
    const doc = nestedDoc();
    const cmd = new UngroupCommand("inner");
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("g#inner restored with 2 children");
    expect(doc.requireContainer("flow").children.map((s) => s.id)).toEqual(["x", "inner"]);
    expect(doc.requireContainer("inner").children.map((s) => s.id)).toEqual(["a", "b"]);
    expect(doc.countElements()).toBe(5);
  });

  it("redo dissolves the group again", () => {
    const doc = nestedDoc();
    const cmd = new UngroupCommand("inner");
    cmd.execute(doc);
    cmd.undo(doc);
    expect(cmd.execute(doc)).toBe("g#inner ungrouped (2 children)");
    expect(doc.findById("inner")).toBeUndefined();
  });
});
