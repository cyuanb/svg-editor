import { escapeXmlAttr, Shape, xmlIndent } from "./Shape.js";

/** Composite container: children are addressed and transformed uniformly. */
export class GroupShape extends Shape {
  readonly children: Shape[] = [];

  constructor(id: string) {
    super(id);
  }

  get kind(): string {
    return "g";
  }

  override get isContainer(): boolean {
    return true;
  }

  translate(dx: number, dy: number): void {
    for (const child of this.children) {
      child.translate(dx, dy);
    }
  }

  scaleBy(factor: number): void {
    for (const child of this.children) {
      child.scaleBy(factor);
    }
  }

  describe(): string {
    return this.fill !== undefined ? `fill=${this.fill}` : "";
  }

  protected detailGeometry(): string {
    return `children=${this.children.length}`;
  }

  toXml(indent: number): string {
    const pad = xmlIndent(indent);
    const open = `${pad}<g id="${escapeXmlAttr(this.id)}"${this.styleXml()}`;
    if (this.children.length === 0) {
      return `${open}/>`;
    }
    const inner = this.children.map((child) => child.toXml(indent + 1)).join("\n");
    return `${open}>\n${inner}\n${pad}</g>`;
  }
}
