import { describe, expect, it } from "vitest";
import { RectShape } from "../../../src/core/RectShape.js";

describe("RectShape", () => {
  it("exposes id, kind and leaf role", () => {
    const rect = new RectShape("r1", 10, 20, 100, 50);
    expect(rect.id).toBe("r1");
    expect(rect.kind).toBe("rect");
    expect(rect.isContainer).toBe(false);
  });

  it("translates x and y only", () => {
    const rect = new RectShape("r1", 10, 20, 100, 50);
    rect.translate(5, -3);
    expect(rect.x).toBe(15);
    expect(rect.y).toBe(17);
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(50);
  });

  it("scales position and size uniformly", () => {
    const rect = new RectShape("r1", 10, 20, 100, 50);
    rect.scaleBy(2);
    expect(rect.x).toBe(20);
    expect(rect.y).toBe(40);
    expect(rect.width).toBe(200);
    expect(rect.height).toBe(100);
  });

  it("accepts whitelisted geometry and style attributes", () => {
    const rect = new RectShape("r1", 0, 0, 1, 1);
    expect(rect.canSet("x")).toBe(true);
    expect(rect.canSet("width")).toBe(true);
    expect(rect.canSet("fill")).toBe(true);
    rect.setAttribute("x", "42");
    rect.setAttribute("fill", "red");
    expect(rect.x).toBe(42);
    expect(rect.describe()).toBe("x=42 y=0 w=1 h=1 fill=red");
  });

  it("rejects unknown or invalid attributes", () => {
    const rect = new RectShape("r1", 0, 0, 1, 1);
    expect(rect.canSet("cx")).toBe(false);
    expect(() => rect.setAttribute("cx", "1")).toThrowError(/unknown attribute: cx/);
    expect(() => rect.setAttribute("x", "abc")).toThrowError(/invalid number/);
    expect(() => rect.setAttribute("x", "")).toThrowError(/invalid number for x: /);
    expect(() => rect.setAttribute("x", "0x10")).toThrowError(/invalid number for x: 0x10/);
  });

  it("serializes to xml and omits absent fill", () => {
    const rect = new RectShape("r1", 10, 20, 100, 50, "#eee");
    expect(rect.toXml(1)).toBe('  <rect id="r1" x="10" y="20" width="100" height="50" fill="#eee"/>');
    const bare = new RectShape("r2", 0, 0, 5, 5);
    expect(bare.toXml(0)).toBe('<rect id="r2" x="0" y="0" width="5" height="5"/>');
  });

  it("renders show detail against the canvas root", () => {
    const rect = new RectShape("bg", 0, 0, 800, 600, "#ffffff");
    expect(rect.detail(null)).toBe(
      ["rect#bg  parent=svg", "  x=0 y=0 width=800 height=600", "  fill=#ffffff"].join("\n")
    );
  });
});
