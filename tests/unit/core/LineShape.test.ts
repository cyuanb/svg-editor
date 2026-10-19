import { describe, expect, it } from "vitest";
import { LineShape } from "../../../src/core/LineShape.js";

describe("LineShape", () => {
  it("translates both endpoints", () => {
    const line = new LineShape("e", 280, 130, 520, 130);
    line.translate(10, 20);
    expect([line.x1, line.y1, line.x2, line.y2]).toEqual([290, 150, 530, 150]);
  });

  it("scales all endpoint coordinates", () => {
    const line = new LineShape("e", 10, 20, 30, 40);
    line.scaleBy(3);
    expect([line.x1, line.y1, line.x2, line.y2]).toEqual([30, 60, 90, 120]);
  });

  it("describes endpoints in lab tree format", () => {
    const line = new LineShape("arrow1", 280, 130, 520, 130, "black");
    expect(line.describe()).toBe("(280,130) -> (520,130)");
  });

  it("serializes stroke and renders detail", () => {
    const line = new LineShape("e", 280, 130, 520, 130, "black");
    expect(line.toXml(0)).toBe('<line id="e" x1="280" y1="130" x2="520" y2="130" stroke="black"/>');
    expect(line.detail(null)).toBe(
      ["line#e  parent=svg", "  x1=280 y1=130 x2=520 y2=130", "  stroke=black"].join("\n")
    );
  });

  it("sets stroke-width with numeric validation", () => {
    const line = new LineShape("e", 0, 0, 1, 1);
    line.setAttribute("stroke-width", "2.5");
    expect(() => line.setAttribute("stroke-width", "fat")).toThrowError(/invalid number/);
  });
});
