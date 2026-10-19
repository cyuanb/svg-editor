import type { GroupShape } from "./GroupShape.js";
import { EditorError } from "../errors/EditorError.js";

/** Reserved logical id for the canvas root; never addressable from CLI. */
export const CANVAS_ROOT_ID = "__canvas__";

/** Number display: trim floating-point noise, keep integers clean. */
export function formatNumber(value: number): string {
  return String(Math.round(value * 1e6) / 1e6);
}

export function escapeXmlText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeXmlAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function xmlIndent(level: number): string {
  return " ".repeat(level * 2);
}

/**
 * Abstract base of the shape hierarchy (Composite).
 * Geometry operations, attribute whitelist, tree/show summaries and XML
 * serialization are all polymorphic - no switch on shape tag outside this
 * hierarchy. Attribute dispatch lives inside the class that owns the
 * attributes (base class: fill/stroke/stroke-width; subclasses: geometry).
 */
export abstract class Shape {
  readonly id: string;

  /** Logical parent container; maintained exclusively by SvgDocument. */
  parent: GroupShape | null = null;

  protected fill?: string;
  protected stroke?: string;
  protected strokeWidth?: string;

  protected constructor(id: string) {
    this.id = id;
  }

  abstract get kind(): string;

  get isContainer(): boolean {
    return false;
  }

  abstract translate(dx: number, dy: number): void;

  abstract scaleBy(factor: number): void;

  canSet(attr: string): boolean {
    return attr === "fill" || attr === "stroke" || attr === "stroke-width";
  }

  setAttribute(attr: string, value: string): void {
    if (attr === "fill") {
      this.fill = value;
      return;
    }
    if (attr === "stroke") {
      this.stroke = value;
      return;
    }
    if (attr === "stroke-width") {
      if (!Number.isFinite(Number(value))) {
        throw new EditorError(`invalid number for stroke-width: ${value}`);
      }
      this.strokeWidth = value;
      return;
    }
    throw new EditorError(`unknown attribute: ${attr}`);
  }

  /** Compact one-line summary for `tree` (geometry + fill only). */
  abstract describe(): string;

  /** Multi-line detail block for `show`. parentId null means canvas root. */
  detail(parentId: string | null): string {
    const lines = [
      `${this.kind}#${this.id}  parent=${parentId ?? "svg"}`,
      `  ${this.detailGeometry()}`,
    ];
    if (this.fill !== undefined) lines.push(`  fill=${this.fill}`);
    if (this.stroke !== undefined) lines.push(`  stroke=${this.stroke}`);
    if (this.strokeWidth !== undefined) lines.push(`  stroke-width=${this.strokeWidth}`);
    return lines.join("\n");
  }

  protected abstract detailGeometry(): string;

  abstract toXml(indent: number): string;

  protected styleParts(): string[] {
    const parts: string[] = [];
    if (this.fill !== undefined) parts.push(`fill=${this.fill}`);
    if (this.stroke !== undefined) parts.push(`stroke=${this.stroke}`);
    if (this.strokeWidth !== undefined) parts.push(`stroke-width=${this.strokeWidth}`);
    return parts;
  }

  protected styleXml(): string {
    let xml = "";
    if (this.fill !== undefined) xml += ` fill="${escapeXmlAttr(this.fill)}"`;
    if (this.stroke !== undefined) xml += ` stroke="${escapeXmlAttr(this.stroke)}"`;
    if (this.strokeWidth !== undefined) xml += ` stroke-width="${escapeXmlAttr(this.strokeWidth)}"`;
    return xml;
  }

  /** Tree style suffix: lab transcript shows fill only in tree lines. */
  protected describeWithStyles(geometry: string): string {
    return this.fill !== undefined ? `${geometry} fill=${this.fill}` : geometry;
  }

  protected parseNumber(attr: string, raw: string): number {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new EditorError(`invalid number for ${attr}: ${raw}`);
    }
    return value;
  }
}
