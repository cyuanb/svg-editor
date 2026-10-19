import { describe, expect, it } from "vitest";
import { EllipseShape } from "../../../src/core/EllipseShape.js";

describe("EllipseShape", () => {
  it("translates and scales all geometry", () => {
    const ellipse = new EllipseShape("e1", 1, 2, 3, 4);
    ellipse.translate(10, 20);
    expect([ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry]).toEqual([11, 22, 3, 4]);
    ellipse.scaleBy(2);
    expect([ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry]).toEqual([22, 44, 6, 8]);
  });

  it("describes and serializes in lab format", () => {
    const ellipse = new EllipseShape("e1", 1, 2, 3, 4);
    expect(ellipse.describe()).toBe("cx=1 cy=2 rx=3 ry=4");
    expect(ellipse.toXml(0)).toBe('<ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>');
  });

  it("rejects rect-only attributes", () => {
    const ellipse = new EllipseShape("e1", 0, 0, 1, 1);
    expect(ellipse.canSet("width")).toBe(false);
    expect(() => ellipse.setAttribute("width", "1")).toThrowError(/unknown attribute/);
  });
});
