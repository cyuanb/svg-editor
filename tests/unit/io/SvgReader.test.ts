import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SvgReader } from "../../../src/io/SvgReader.js";

const FIXTURE = readFileSync(join(process.cwd(), "tests", "fixtures", "other.svg"), "utf8");

describe("SvgReader", () => {
  it("reads the lab sample: warns once, counts 7 elements, rebuilds the tree", () => {
    const { document: doc, warnings } = new SvgReader().read(FIXTURE);
    expect(warnings).toEqual(["warning: assigned id rect1 to unnamed <rect>"]);
    expect(doc.countElements()).toBe(7);
    expect(doc.width).toBe(400);
    expect(doc.height).toBe(300);

    expect(doc.root.children.map((s) => `${s.kind}#${s.id}`)).toEqual([
      "rect#rect1", "text#t1", "circle#c1", "g#g1", "ellipse#e1",
    ]);
    expect(doc.requireShape("rect1").describe()).toBe("x=0 y=0 w=400 h=300 fill=#ffffff");
    expect(doc.requireShape("t1").describe()).toBe('(10,290) "imported"');
    expect(doc.requireShape("e1").describe()).toBe("cx=1 cy=2 rx=3 ry=4");
    expect(doc.requireContainer("g1").children.map((s) => s.id)).toEqual(["r2", "c2"]);
  });

  it("assigns increasing per-tag ids to multiple unnamed elements", () => {
    const svg = [
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">',
      '  <rect x="0" y="0" width="1" height="1"/>',
      '  <rect x="1" y="0" width="1" height="1"/>',
      "</svg>",
    ].join("\n");
    const { document: doc, warnings } = new SvgReader().read(svg);
    expect(warnings).toEqual([
      "warning: assigned id rect1 to unnamed <rect>",
      "warning: assigned id rect2 to unnamed <rect>",
    ]);
    expect(doc.findById("rect1")).toBeDefined();
    expect(doc.findById("rect2")).toBeDefined();
  });

  it("rejects duplicate explicit ids", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">' +
      '<rect id="r" x="0" y="0" width="1" height="1"/>' +
      '<circle id="r" cx="0" cy="0" r="1"/>' +
      "</svg>";
    expect(() => new SvgReader().read(svg)).toThrowError("id already exists: r");
  });

  it("skips unknown elements together with their subtrees", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">',
      "  <!-- a comment -->",
      '  <defs><linearGradient id="lg"><stop offset="0"/></linearGradient></defs>',
      '  <rect id="r" x="0" y="0" width="1" height="1"/>',
      "</svg>",
    ].join("\n");
    const { document: doc, warnings } = new SvgReader().read(svg);
    expect(warnings).toEqual([]);
    expect(doc.countElements()).toBe(1);
    expect(doc.findById("lg")).toBeUndefined();
  });

  it("unescapes entities in attribute values and text content", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">',
      '  <text id="t" x="0" y="0">a &amp; b &lt;3</text>',
      '  <line id="e" x1="0" y1="0" x2="1" y2="1" stroke="&quot;q&quot;"/>',
      "</svg>",
    ].join("\n");
    const { document: doc } = new SvgReader().read(svg);
    expect(doc.requireShape("t").describe()).toBe('(0,0) "a & b <3"');
    expect(doc.requireShape("e").toXml(0)).toContain('stroke="&quot;q&quot;"');
  });

  it("falls back to viewBox dimensions and then to 800x600", () => {
    const viewBoxOnly =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect id="r" x="0" y="0" width="1" height="1"/></svg>';
    expect(new SvgReader().read(viewBoxOnly).document.width).toBe(320);
    expect(new SvgReader().read(viewBoxOnly).document.height).toBe(240);

    const bare =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect id="r" x="0" y="0" width="1" height="1"/></svg>';
    const doc = new SvgReader().read(bare).document;
    expect(doc.width).toBe(800);
    expect(doc.height).toBe(600);
  });

  it("rejects non-svg roots and malformed xml", () => {
    expect(() => new SvgReader().read('<rect id="r" x="0" y="0" width="1" height="1"/>')).toThrowError(
      /root element must be <svg>/
    );
    expect(() => new SvgReader().read('<svg><rect id="r"></svg>')).toThrowError(/malformed/);
    expect(() => new SvgReader().read('<svg><rect id="r" x="0" y="0" width="1" height="1">')).toThrowError(
      /unclosed|end of input/
    );
  });

  it("rejects malformed numbers in geometry attributes", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">' +
      '<rect id="r" x="abc" y="0" width="1" height="1"/>' +
      "</svg>";
    expect(() => new SvgReader().read(svg)).toThrowError("invalid number: abc");
  });
});
