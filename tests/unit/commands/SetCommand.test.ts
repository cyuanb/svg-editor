import { describe, expect, it } from "vitest";
import { SetCommand } from "../../../src/commands/SetCommand.js";
import { CircleShape } from "../../../src/core/CircleShape.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";
import { TextShape } from "../../../src/core/TextShape.js";

describe("SetCommand", () => {
  it("sets a style attribute and reports the lab message", () => {
    const doc = new SvgDocument();
    doc.attach(new CircleShape("c1", 100, 100, 20));
    const cmd = new SetCommand("c1", "fill", "red");
    expect(cmd.execute(doc)).toBe("circle#c1 updated: fill=red");
    expect(doc.requireShape("c1").describe()).toBe("cx=100 cy=100 r=20 fill=red");
  });

  it("sets text content with quoted display", () => {
    const doc = new SvgDocument();
    doc.attach(new TextShape("title", 20, 40, "My Diagram"));
    const cmd = new SetCommand("title", "text", "My Diagram v2");
    expect(cmd.execute(doc)).toBe('text#title updated: text="My Diagram v2"');
    expect(cmd.undo(doc)).toBe('text#title updated: text="My Diagram"');
  });

  it("undo restores the previous attribute value", () => {
    const doc = new SvgDocument();
    doc.attach(new RectShape("r1", 0, 0, 1, 1, "blue"));
    const cmd = new SetCommand("r1", "fill", "red");
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("rect#r1 updated: fill=blue");
    expect(doc.requireShape("r1").describe()).toBe("x=0 y=0 w=1 h=1 fill=blue");
  });

  it("undo of a newly set attribute reports unset and removes it", () => {
    const doc = new SvgDocument();
    doc.attach(new RectShape("r1", 0, 0, 1, 1));
    const cmd = new SetCommand("r1", "fill", "red");
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("rect#r1 fill unset");
    expect(doc.requireShape("r1").describe()).toBe("x=0 y=0 w=1 h=1");
  });

  it("undo restores geometry values exactly", () => {
    const doc = new SvgDocument();
    doc.attach(new CircleShape("c1", 10, 20, 5));
    const cmd = new SetCommand("c1", "cx", "99");
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("circle#c1 updated: cx=10");
    expect(doc.requireShape("c1").describe()).toBe("cx=10 cy=20 r=5");
  });

  it("containers accept style attributes but reject geometry", () => {
    const doc = new SvgDocument();
    doc.attach(new GroupShape("g1"));
    expect(new SetCommand("g1", "fill", "red").execute(doc)).toBe("g#g1 updated: fill=red");
    expect(() => new SetCommand("g1", "x", "1").execute(doc)).toThrowError("unknown attribute: x");
  });

  it("rejects unknown shapes and unknown attributes", () => {
    const doc = new SvgDocument();
    expect(() => new SetCommand("r9", "fill", "red").execute(doc)).toThrowError("no such shape: r9");
    doc.attach(new RectShape("r1", 0, 0, 1, 1));
    expect(() => new SetCommand("r1", "cx", "1").execute(doc)).toThrowError("unknown attribute: cx");
  });

  it("rejects invalid geometry numbers without mutation", () => {
    const doc = new SvgDocument();
    doc.attach(new RectShape("r1", 0, 0, 1, 1));
    expect(() => new SetCommand("r1", "width", "abc").execute(doc)).toThrowError(/invalid number/);
    expect(doc.requireShape("r1").describe()).toBe("x=0 y=0 w=1 h=1");
  });
});
