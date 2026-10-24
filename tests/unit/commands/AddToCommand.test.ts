import { describe, expect, it } from "vitest";
import { AddToCommand } from "../../../src/commands/AddToCommand.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";

describe("AddToCommand", () => {
  function doc3(): SvgDocument {
    const doc = new SvgDocument();
    doc.attach(new RectShape("a", 0, 0, 1, 1));
    doc.attach(new RectShape("b", 0, 0, 1, 1));
    doc.attach(new GroupShape("g1"));
    return doc;
  }

  it("moves a shape into the container as its last child", () => {
    const doc = doc3();
    doc.attach(new RectShape("z", 0, 0, 1, 1), doc.requireContainer("g1"));
    const cmd = new AddToCommand("g1", "a");
    expect(cmd.execute(doc)).toBe("rect#a added to g#g1");
    expect(doc.root.children.map((s) => s.id)).toEqual(["b", "g1"]);
    expect(doc.requireContainer("g1").children.map((s) => s.id)).toEqual(["z", "a"]);
  });

  it("rejects missing shapes and non-container targets", () => {
    const doc = doc3();
    expect(() => new AddToCommand("nope", "a").execute(doc)).toThrowError("no such shape: nope");
    expect(() => new AddToCommand("a", "b").execute(doc)).toThrowError("not a container: a");
    expect(() => new AddToCommand("g1", "nope").execute(doc)).toThrowError("no such shape: nope");
  });

  it("rejects adding a shape to itself and into its own descendant", () => {
    const doc = doc3();
    const g1 = doc.requireContainer("g1");
    const g2 = new GroupShape("g2");
    doc.attach(g2, g1);
    expect(() => new AddToCommand("g1", "g1").execute(doc)).toThrowError(
      "cannot add a shape to itself: g1"
    );
    expect(() => new AddToCommand("g2", "g1").execute(doc)).toThrowError(
      "cannot add a container into its own descendant: g2"
    );
  });

  it("undo restores the original parent and index", () => {
    const doc = doc3();
    const cmd = new AddToCommand("g1", "b");
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("rect#b restored into svg");
    expect(doc.root.children.map((s) => s.id)).toEqual(["a", "b", "g1"]);
  });
});
