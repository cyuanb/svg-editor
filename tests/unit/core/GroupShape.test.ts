import { describe, expect, it } from "vitest";
import { CircleShape } from "../../../src/core/CircleShape.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { RectShape } from "../../../src/core/RectShape.js";

describe("GroupShape", () => {
  it("serializes an empty group as self-closing", () => {
    const group = new GroupShape("scene");
    expect(group.kind).toBe("g");
    expect(group.isContainer).toBe(true);
    expect(group.toXml(0)).toBe('<g id="scene"/>');
  });

  it("translates and scales children recursively", () => {
    const group = new GroupShape("g1");
    const rect = new RectShape("r1", 10, 20, 100, 50);
    const circle = new CircleShape("c1", 5, 5, 2);
    group.children.push(rect, circle);

    group.translate(10, 20);
    expect(rect.x).toBe(20);
    expect(rect.y).toBe(40);
    expect(circle.cx).toBe(15);
    expect(circle.cy).toBe(25);

    group.scaleBy(2);
    expect(rect.width).toBe(200);
    expect(circle.r).toBe(4);
  });

  it("accepts only generic style attributes", () => {
    const group = new GroupShape("g1");
    expect(group.canSet("fill")).toBe(true);
    expect(group.canSet("x")).toBe(false);
    group.setAttribute("fill", "red");
    expect(group.describe()).toBe("fill=red");
    expect(() => group.setAttribute("x", "1")).toThrowError(/unknown attribute: x/);
  });

  it("serializes nested children with indentation", () => {
    const group = new GroupShape("g1");
    group.children.push(new RectShape("r2", 0, 0, 10, 10));
    group.children.push(new CircleShape("c2", 5, 5, 2));
    expect(group.toXml(0)).toBe(
      [
        '<g id="g1">',
        '  <rect id="r2" x="0" y="0" width="10" height="10"/>',
        '  <circle id="c2" cx="5" cy="5" r="2"/>',
        "</g>",
      ].join("\n")
    );
  });

  it("renders detail with child count", () => {
    const group = new GroupShape("g1");
    group.children.push(new RectShape("r2", 0, 0, 10, 10));
    expect(group.detail(null)).toBe(
      ["g#g1  parent=svg", "  children=1"].join("\n")
    );
  });
});
