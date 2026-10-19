import { describe, expect, it } from "vitest";
import { MoveCommand } from "../../../src/commands/MoveCommand.js";
import { CircleShape } from "../../../src/core/CircleShape.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";

describe("MoveCommand", () => {
  it("moves a leaf and reports its new anchor position", () => {
    const doc = new SvgDocument();
    doc.attach(new CircleShape("c1", 100, 100, 20));
    const cmd = new MoveCommand("c1", "30", "0");
    expect(cmd.execute(doc)).toBe("circle#c1 moved to (130,100)");
  });

  it("undo moves the leaf back to the original position", () => {
    const doc = new SvgDocument();
    doc.attach(new CircleShape("c1", 100, 100, 20));
    const cmd = new MoveCommand("c1", "30", "0");
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("circle#c1 moved back to (100,100)");
    expect(doc.requireShape("c1").describe()).toBe("cx=100 cy=100 r=20");
  });

  it("moves a container by delta and translates all descendants", () => {
    const doc = new SvgDocument();
    const node = new GroupShape("node2");
    const rect = new RectShape("process", 520, 100, 160, 60);
    doc.attach(node);
    doc.attach(rect, node);

    const cmd = new MoveCommand("node2", "0", "100");
    expect(cmd.execute(doc)).toBe("g#node2 moved by (0,100)");
    expect(rect.x).toBe(520);
    expect(rect.y).toBe(200);

    expect(cmd.undo(doc)).toBe("g#node2 moved back by (0,-100)");
    expect(rect.y).toBe(100);
  });

  it("rejects unknown shapes and invalid numbers", () => {
    const doc = new SvgDocument();
    expect(() => new MoveCommand("r9", "1", "2").execute(doc)).toThrowError("no such shape: r9");
    doc.attach(new CircleShape("c1", 0, 0, 1));
    expect(() => new MoveCommand("c1", "abc", "2").execute(doc)).toThrowError("invalid number: abc");
  });
});
