import { describe, expect, it } from "vitest";
import { CircleShape } from "../../../src/core/CircleShape.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { LineShape } from "../../../src/core/LineShape.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";
import { TextShape } from "../../../src/core/TextShape.js";
import { SvgReader } from "../../../src/io/SvgReader.js";
import { SvgWriter } from "../../../src/io/SvgWriter.js";

describe("SVG round-trip", () => {
  function sampleDoc(): SvgDocument {
    const doc = new SvgDocument(800, 600);
    const flow = new GroupShape("flow");
    doc.attach(flow);
    doc.attach(new RectShape("bg", 0, 0, 800, 600, "#ffffff"));
    doc.attach(new TextShape("title", 20, 40, "My & Diagram <v2>"), flow);
    doc.attach(new CircleShape("c1", 100.5, 100, 20, "red"), flow);
    doc.attach(new LineShape("edge", 10, 20, 30, 40, "black"), flow);
    return doc;
  }

  it("save -> read -> save produces byte-identical output", () => {
    const writer = new SvgWriter();
    const first = writer.write(sampleDoc());

    const { document: reread, warnings } = new SvgReader().read(first);
    expect(warnings).toEqual([]);

    const second = writer.write(reread);
    expect(second).toBe(first);
  });

  it("preserves geometry, styles, text content and nesting", () => {
    const first = new SvgWriter().write(sampleDoc());
    const { document: doc } = new SvgReader().read(first);

    expect(doc.countElements()).toBe(5);
    expect(doc.requireShape("title").describe()).toBe('(20,40) "My & Diagram <v2>"');
    expect(doc.requireShape("c1").describe()).toBe("cx=100.5 cy=100 r=20 fill=red");
    expect(doc.requireContainer("flow").children.map((s) => s.id)).toEqual(["title", "c1", "edge"]);
  });

  it("round-trips documents containing g style attributes", () => {
    const doc = new SvgDocument(10, 10);
    const group = new GroupShape("g1");
    group.setAttribute("fill", "blue");
    group.setAttribute("stroke-width", "2");
    doc.attach(group);
    doc.attach(new RectShape("r", 0, 0, 1, 1), group);

    const text = new SvgWriter().write(doc);
    const { document: reread } = new SvgReader().read(text);
    expect(new SvgWriter().write(reread)).toBe(text);
    expect(reread.requireShape("g1").detail(null)).toContain("  fill=blue");
    expect(reread.requireShape("g1").detail(null)).toContain("  stroke-width=2");
  });
});
