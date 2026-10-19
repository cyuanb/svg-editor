import { describe, expect, it } from "vitest";
import { CircleShape } from "../../../src/core/CircleShape.js";

describe("CircleShape", () => {
  it("translates center", () => {
    const circle = new CircleShape("c1", 100, 100, 20);
    circle.translate(30, 0);
    expect(circle.cx).toBe(130);
    expect(circle.cy).toBe(100);
    expect(circle.r).toBe(20);
  });

  it("scales center and radius", () => {
    const circle = new CircleShape("c1", 100, 100, 20);
    circle.scaleBy(0.5);
    expect(circle.cx).toBe(50);
    expect(circle.cy).toBe(50);
    expect(circle.r).toBe(10);
  });

  it("supports its geometry whitelist", () => {
    const circle = new CircleShape("c1", 0, 0, 1);
    expect(circle.canSet("cx")).toBe(true);
    expect(circle.canSet("rx")).toBe(false);
    circle.setAttribute("r", "5");
    expect(circle.r).toBe(5);
  });

  it("describes and serializes in lab format", () => {
    const circle = new CircleShape("c1", 100, 100, 20, "red");
    expect(circle.describe()).toBe("cx=100 cy=100 r=20 fill=red");
    expect(circle.toXml(0)).toBe('<circle id="c1" cx="100" cy="100" r="20" fill="red"/>');
  });

  it("renders show detail with parent", () => {
    const circle = new CircleShape("c1", 100, 100, 20, "red");
    expect(circle.detail("g#markers")).toBe(
      ["circle#c1  parent=g#markers", "  cx=100 cy=100 r=20", "  fill=red"].join("\n")
    );
  });
});
