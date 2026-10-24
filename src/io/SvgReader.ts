import { CircleShape } from "../core/CircleShape.js";
import { EllipseShape } from "../core/EllipseShape.js";
import { GroupShape } from "../core/GroupShape.js";
import { LineShape } from "../core/LineShape.js";
import { RectShape } from "../core/RectShape.js";
import type { Shape } from "../core/Shape.js";
import { SvgDocument } from "../core/SvgDocument.js";
import { TextShape } from "../core/TextShape.js";
import { EditorError } from "../errors/EditorError.js";
import { parseNumber } from "../parsing/Tokenizer.js";
import { type XmlNode, XmlParser } from "./XmlParser.js";

const SUPPORTED_TAGS = new Set(["rect", "circle", "ellipse", "line", "text", "g"]);

export interface SvgReadResult {
  document: SvgDocument;
  warnings: string[];
}

/**
 * Parses SVG text into an SvgDocument. Unknown elements (defs, metadata,
 * gradients, ...) are skipped together with their subtrees; elements
 * without an id get `tagN` assigned per-tag and produce a warning line.
 */
export class SvgReader {
  read(content: string): SvgReadResult {
    const root = new XmlParser(content).parse();
    if (root.tag !== "svg") {
      throw new EditorError("malformed svg: root element must be <svg>");
    }
    const doc = new SvgDocument(
      this.dimension(root, "width", 800),
      this.dimension(root, "height", 600)
    );
    const warnings: string[] = [];
    this.importChildren(root, doc, doc.root, new Map(), warnings);
    return { document: doc, warnings };
  }

  private dimension(node: XmlNode, attr: "width" | "height", fallback: number): number {
    const direct = node.attrs.get(attr);
    if (direct !== undefined) {
      return parseNumber(direct);
    }
    const viewBox = node.attrs.get("viewBox");
    if (viewBox !== undefined) {
      const parts = viewBox.trim().split(/\s+/);
      const raw = attr === "width" ? parts[2] : parts[3];
      if (raw !== undefined) {
        return parseNumber(raw);
      }
    }
    return fallback;
  }

  /** Attaches each supported child, then recurses into containers top-down. */
  private importChildren(
    node: XmlNode,
    doc: SvgDocument,
    parent: GroupShape,
    counters: Map<string, number>,
    warnings: string[]
  ): void {
    for (const child of node.children) {
      if (!SUPPORTED_TAGS.has(child.tag)) {
        continue; // unknown element: skip together with its whole subtree
      }
      const id = this.resolveId(child, doc, counters, warnings);
      const shape = this.buildShape(child.tag, id, child.attrs, child.text);
      this.applyStyle(shape, child.attrs, "fill");
      this.applyStyle(shape, child.attrs, "stroke");
      this.applyStyle(shape, child.attrs, "stroke-width");
      doc.attach(shape, parent);
      if (shape instanceof GroupShape) {
        this.importChildren(child, doc, shape, counters, warnings);
      }
    }
  }

  private resolveId(
    node: XmlNode,
    doc: SvgDocument,
    counters: Map<string, number>,
    warnings: string[]
  ): string {
    const explicit = node.attrs.get("id");
    if (explicit !== undefined) {
      return explicit;
    }
    let count = (counters.get(node.tag) ?? 0) + 1;
    let candidate = `${node.tag}${count}`;
    while (doc.findById(candidate) !== undefined) {
      count += 1;
      candidate = `${node.tag}${count}`;
    }
    counters.set(node.tag, count);
    warnings.push(`warning: assigned id ${candidate} to unnamed <${node.tag}>`);
    return candidate;
  }

  private buildShape(tag: string, id: string, attrs: Map<string, string>, text: string): Shape {
    const num = (name: string): number => {
      const raw = attrs.get(name);
      return raw === undefined ? 0 : parseNumber(raw);
    };
    const fill = attrs.get("fill");

    switch (tag) {
      case "rect":
        return new RectShape(id, num("x"), num("y"), num("width"), num("height"), fill);
      case "circle":
        return new CircleShape(id, num("cx"), num("cy"), num("r"), fill);
      case "ellipse":
        return new EllipseShape(id, num("cx"), num("cy"), num("rx"), num("ry"), fill);
      case "line":
        return new LineShape(id, num("x1"), num("y1"), num("x2"), num("y2"));
      case "text":
        return new TextShape(id, num("x"), num("y"), text);
      default:
        return new GroupShape(id);
    }
  }

  private applyStyle(shape: Shape, attrs: Map<string, string>, attr: string): void {
    const value = attrs.get(attr);
    if (value !== undefined) {
      shape.setAttribute(attr, value);
    }
  }
}
