import { describe, expect, it } from "vitest";
import { ScaleCommand } from "../../../src/commands/ScaleCommand.js";
import { CircleShape } from "../../../src/core/CircleShape.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";

describe("ScaleCommand", () => {
  it("scales a leaf uniformly", () => {
    const doc = new SvgDocument();
    doc.attach(new RectShape("r1", 10, 20, 100, 50));
    const cmd = new ScaleCommand("r1", "2");
    expect(cmd.execute(doc)).toBe("rect#r1 scaled by 2");
    expect(doc.requireShape("r1").describe()).toBe("x=20 y=40 w=200 h=100");
  });

  it("undo restores exact original values without float drift", () => {
    const doc = new SvgDocument();
    doc.attach(new RectShape("r1", 10, 20, 100, 50));
    const cmd = new ScaleCommand("r1", "3");
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("rect#r1 scale undone");
    expect(doc.requireShape("r1").describe()).toBe("x=10 y=20 w=100 h=50");
  });

  it("scales a whole subtree and undo restores every member", () => {
    const doc = new SvgDocument();
    const group = new GroupShape("g1");
    const rect = new RectShape("r1", 10, 20, 100, 50, "red");
    const circle = new CircleShape("c1", 5, 5, 2);
    doc.attach(group);
    doc.attach(rect, group);
    doc.attach(circle, group);

    const cmd = new ScaleCommand("g1", "2");
    expect(cmd.execute(doc)).toBe("g#g1 scaled by 2");
    expect(rect.describe()).toBe("x=20 y=40 w=200 h=100 fill=red");
    expect(circle.describe()).toBe("cx=10 cy=10 r=4");

    cmd.undo(doc);
    expect(rect.describe()).toBe("x=10 y=20 w=100 h=50 fill=red");
    expect(circle.describe()).toBe("cx=5 cy=5 r=2");
  });

  it("rejects non-positive factors and invalid numbers", () => {
    const doc = new SvgDocument();
    doc.attach(new CircleShape("c1", 0, 0, 1));
    expect(() => new ScaleCommand("c1", "0").execute(doc)).toThrowError("scale factor must be positive");
    expect(() => new ScaleCommand("c1", "-2").execute(doc)).toThrowError("scale factor must be positive");
    expect(() => new ScaleCommand("c1", "big").execute(doc)).toThrowError("invalid number: big");
  });

  it("rejects unknown shapes", () => {
    const doc = new SvgDocument();
    expect(() => new ScaleCommand("nope", "2").execute(doc)).toThrowError("no such shape: nope");
  });
});
