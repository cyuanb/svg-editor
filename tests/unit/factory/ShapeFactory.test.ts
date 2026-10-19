import { describe, expect, it } from "vitest";
import { CircleShape } from "../../../src/core/CircleShape.js";
import { EllipseShape } from "../../../src/core/EllipseShape.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { LineShape } from "../../../src/core/LineShape.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { TextShape } from "../../../src/core/TextShape.js";
import { ShapeFactory } from "../../../src/factory/ShapeFactory.js";

describe("ShapeFactory", () => {
  const factory = new ShapeFactory();

  it("creates a rect with optional fill", () => {
    const rect = factory.create("rect", "r1", ["10", "20", "100", "50", "#eee"]);
    expect(rect).toBeInstanceOf(RectShape);
    expect((rect as RectShape).x).toBe(10);
    expect((rect as RectShape).describe()).toBe("x=10 y=20 w=100 h=50 fill=#eee");

    const bare = factory.create("rect", "r2", ["0", "0", "5", "5"]);
    expect(bare.describe()).toBe("x=0 y=0 w=5 h=5");
  });

  it("creates a circle with optional fill", () => {
    const circle = factory.create("circle", "c1", ["100", "100", "20", "red"]);
    expect(circle).toBeInstanceOf(CircleShape);
    expect(circle.describe()).toBe("cx=100 cy=100 r=20 fill=red");
  });

  it("creates an ellipse", () => {
    const ellipse = factory.create("ellipse", "e1", ["1", "2", "3", "4"]);
    expect(ellipse).toBeInstanceOf(EllipseShape);
    expect(ellipse.describe()).toBe("cx=1 cy=2 rx=3 ry=4");
  });

  it("creates a line with optional stroke", () => {
    const line = factory.create("line", "edge", ["150", "100", "250", "100", "black"]);
    expect(line).toBeInstanceOf(LineShape);
    expect((line as LineShape).x1).toBe(150);
    expect((line as LineShape).detail(null)).toContain("  stroke=black");
  });

  it("creates text with a quoted content token", () => {
    const text = factory.create("text", "t1", ["20", "40", "My Diagram"]);
    expect(text).toBeInstanceOf(TextShape);
    expect((text as TextShape).content).toBe("My Diagram");
  });

  it("creates an empty group", () => {
    const group = factory.create("g", "scene", []);
    expect(group).toBeInstanceOf(GroupShape);
    expect(group.isContainer).toBe(true);
  });

  it("rejects wrong parameter counts", () => {
    expect(() => factory.create("rect", "r1", ["0", "0", "1"])).toThrowError(
      /invalid arguments for rect/
    );
    expect(() => factory.create("g", "g1", ["extra"])).toThrowError(
      /invalid arguments for g/
    );
  });

  it("rejects non-numeric geometry", () => {
    expect(() => factory.create("circle", "c1", ["a", "0", "1"])).toThrowError(
      "invalid number: a"
    );
  });

  it("reports unknown types with the lab message, including box", () => {
    expect(() => factory.create("hexagon", "h1", [])).toThrowError(
      "unknown shape type: hexagon (is the plugin loaded?)"
    );
    expect(() => factory.create("box", "n1", ["0", "0", "1", "1", "x"])).toThrowError(
      "unknown shape type: box (is the plugin loaded?)"
    );
  });
});
