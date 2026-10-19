import { escapeXmlAttr, escapeXmlText, formatNumber, Shape, xmlIndent } from "./Shape.js";

export class TextShape extends Shape {
  private _x: number;
  private _y: number;
  private _content: string;

  constructor(id: string, x: number, y: number, content: string) {
    super(id);
    this._x = x;
    this._y = y;
    this._content = content;
  }

  get kind(): string {
    return "text";
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get content(): string { return this._content; }

  translate(dx: number, dy: number): void {
    this._x += dx;
    this._y += dy;
  }

  scaleBy(factor: number): void {
    this._x *= factor;
    this._y *= factor;
  }

  override canSet(attr: string): boolean {
    return super.canSet(attr) || attr === "x" || attr === "y" || attr === "text";
  }

  override setAttribute(attr: string, value: string): void {
    switch (attr) {
      case "x": this._x = this.parseNumber(attr, value); return;
      case "y": this._y = this.parseNumber(attr, value); return;
      case "text": this._content = value; return;
      default: super.setAttribute(attr, value); return;
    }
  }

  describe(): string {
    return this.describeWithStyles(
      `(${formatNumber(this._x)},${formatNumber(this._y)}) "${this._content}"`
    );
  }

  protected detailGeometry(): string {
    return `x=${formatNumber(this._x)} y=${formatNumber(this._y)} text="${this._content}"`;
  }

  toXml(indent: number): string {
    return `${xmlIndent(indent)}<text id="${escapeXmlAttr(this.id)}" x="${formatNumber(this._x)}" y="${formatNumber(this._y)}"${this.styleXml()}>${escapeXmlText(this._content)}</text>`;
  }
}
