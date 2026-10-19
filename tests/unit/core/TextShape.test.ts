import { describe, expect, it } from "vitest";
import { TextShape } from "../../../src/core/TextShape.js";

describe("TextShape", () => {
  it("describes position and content in lab format", () => {
    const text = new TextShape("title", 20, 40, "My Diagram");
    expect(text.describe()).toBe('(20,40) "My Diagram"');
    expect(text.toXml(0)).toBe('<text id="title" x="20" y="40">My Diagram</text>');
  });

  it("sets text content through the attribute whitelist", () => {
    const text = new TextShape("title", 20, 40, "My Diagram");
    expect(text.canSet("text")).toBe(true);
    text.setAttribute("text", "My Diagram v2");
    expect(text.content).toBe("My Diagram v2");
    expect(text.describe()).toBe('(20,40) "My Diagram v2"');
  });

  it("translates and scales position only", () => {
    const text = new TextShape("t", 10, 20, "x");
    text.translate(1, 2);
    text.scaleBy(2);
    expect(text.x).toBe(22);
    expect(text.y).toBe(44);
  });

  it("escapes XML special characters in content", () => {
    const text = new TextShape("t", 0, 0, "<a&b>");
    expect(text.toXml(0)).toBe('<text id="t" x="0" y="0">&lt;a&amp;b&gt;</text>');
  });

  it("rejects non-text attributes", () => {
    const text = new TextShape("t", 0, 0, "x");
    expect(text.canSet("content")).toBe(false);
    expect(() => text.setAttribute("content", "y")).toThrowError(/unknown attribute/);
  });
});
