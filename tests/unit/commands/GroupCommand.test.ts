import { describe, expect, it } from "vitest";
import { GroupCommand } from "../../../src/commands/GroupCommand.js";
import { CircleShape } from "../../../src/core/CircleShape.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";

describe("GroupCommand", () => {
  function demoDoc(): SvgDocument {
    const doc = new SvgDocument();
    doc.attach(new RectShape("bg", 0, 0, 800, 600, "#ffffff"));
    doc.attach(new CircleShape("c1", 100, 100, 20, "red"));
    doc.attach(new RectShape("box", 200, 80, 60, 60, "#3366ff"));
    return doc;
  }

  it("groups existing shapes into a new root container in argument order", () => {
    const doc = demoDoc();
    const cmd = new GroupCommand("markers", ["c1", "box"]);
    expect(cmd.execute(doc)).toBe("g#markers created with 2 children");
    expect(doc.root.children.map((s) => s.id)).toEqual(["bg", "markers"]);
    expect(doc.requireContainer("markers").children.map((s) => s.id)).toEqual(["c1", "box"]);
    expect(doc.countElements()).toBe(4);
  });

  it("rejects duplicate new ids", () => {
    const doc = demoDoc();
    doc.attach(new GroupShape("markers"));
    expect(() => new GroupCommand("markers", ["c1"]).execute(doc)).toThrowError(
      "id already exists: markers"
    );
  });

  it("rejects missing members without changing state", () => {
    const doc = demoDoc();
    expect(() => new GroupCommand("g1", ["c1", "nope"]).execute(doc)).toThrowError(
      "no such shape: nope"
    );
    expect(doc.countElements()).toBe(3);
  });

  it("rejects grouping a container together with its descendant (lab case)", () => {
    const doc = demoDoc();
    const markers = new GroupShape("markers");
    doc.attach(markers);
    const c1 = doc.requireShape("c1");
    doc.detach(c1);
    doc.attach(c1, markers);

    expect(() => new GroupCommand("bad", ["c1", "markers"]).execute(doc)).toThrowError(
      "cannot group a container into its own descendant: markers"
    );
  });

  it("rejects duplicate members", () => {
    const doc = demoDoc();
    expect(() => new GroupCommand("g1", ["c1", "c1"]).execute(doc)).toThrowError(
      "duplicate shape in group: c1"
    );
  });

  it("requires at least one member", () => {
    const doc = demoDoc();
    expect(() => new GroupCommand("g1", []).execute(doc)).toThrowError(
      "group requires at least one shape"
    );
  });

  it("undo restores every member to its original parent and index", () => {
    const doc = new SvgDocument();
    const a = new RectShape("a", 0, 0, 1, 1);
    const b = new RectShape("b", 0, 0, 1, 1);
    const c = new RectShape("c", 0, 0, 1, 1);
    const d = new RectShape("d", 0, 0, 1, 1);
    for (const s of [a, b, c, d]) doc.attach(s);

    const cmd = new GroupCommand("g1", ["c", "a"]);
    cmd.execute(doc);
    expect(doc.root.children.map((s) => s.id)).toEqual(["b", "d", "g1"]);

    expect(cmd.undo(doc)).toBe("g#g1 removed with 2 children restored");
    expect(doc.root.children.map((s) => s.id)).toEqual(["a", "b", "c", "d"]);
    expect(doc.findById("g1")).toBeUndefined();
    expect(doc.countElements()).toBe(4);
  });

  it("undo restores members coming from different parents", () => {
    const doc = demoDoc();
    const other = new GroupShape("other");
    doc.attach(other);
    const box = doc.requireShape("box");
    doc.detach(box);
    doc.attach(box, other);

    const cmd = new GroupCommand("pair", ["c1", "box"]);
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("g#pair removed with 2 children restored");
    expect(doc.root.children.map((s) => s.id)).toEqual(["bg", "c1", "other"]);
    expect(other.children.map((s) => s.id)).toEqual(["box"]);
  });

  it("redo recreates the group after undo", () => {
    const doc = demoDoc();
    const cmd = new GroupCommand("markers", ["c1", "box"]);
    cmd.execute(doc);
    cmd.undo(doc);
    expect(cmd.execute(doc)).toBe("g#markers created with 2 children");
    expect(doc.requireContainer("markers").children.map((s) => s.id)).toEqual(["c1", "box"]);
  });
});
