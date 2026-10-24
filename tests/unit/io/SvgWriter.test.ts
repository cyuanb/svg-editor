import { describe, expect, it } from "vitest";
import { CircleShape } from "../../../src/core/CircleShape.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { LineShape } from "../../../src/core/LineShape.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";
import { SvgWriter } from "../../../src/io/SvgWriter.js";

describe("SvgWriter", () => {
  it("writes an empty canvas", () => {
    const writer = new SvgWriter();
    expect(writer.write(new SvgDocument(400, 200))).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">',
        "</svg>",
        "",
      ].join("\n")
    );
  });

  it("writes the minimal two-rects-and-line document from the lab", () => {
    const doc = new SvgDocument(400, 200);
    const flow = new GroupShape("flow");
    doc.attach(flow);
    doc.attach(new RectShape("start", 30, 70, 120, 60, "#4a90d9"), flow);
    doc.attach(new LineShape("edge", 150, 100, 250, 100, "black"), flow);
    doc.attach(new RectShape("end", 250, 70, 120, 60, "#f5a623"), flow);

    expect(new SvgWriter().write(doc)).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">',
        '  <g id="flow">',
        '    <rect id="start" x="30" y="70" width="120" height="60" fill="#4a90d9"/>',
        '    <line id="edge" x1="150" y1="100" x2="250" y2="100" stroke="black"/>',
        '    <rect id="end" x="250" y="70" width="120" height="60" fill="#f5a623"/>',
        "  </g>",
        "</svg>",
        "",
      ].join("\n")
    );
  });

  it("writes nested groups recursively", () => {
    const doc = new SvgDocument(100, 100);
    const outer = new GroupShape("outer");
    doc.attach(outer);
    doc.attach(new CircleShape("c1", 5, 5, 2), outer);
    expect(new SvgWriter().write(doc)).toContain(
      '  <g id="outer">\n    <circle id="c1" cx="5" cy="5" r="2"/>\n  </g>'
    );
  });
});
