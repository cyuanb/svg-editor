import { escapeXmlAttr, formatNumber, Shape, xmlIndent } from "./Shape.js";

export class LineShape extends Shape {
  private _x1: number;
  private _y1: number;
  private _x2: number;
  private _y2: number;

  constructor(id: string, x1: number, y1: number, x2: number, y2: number, stroke?: string) {
    super(id);
    this._x1 = x1;
    this._y1 = y1;
    this._x2 = x2;
    this._y2 = y2;
    this.stroke = stroke;
  }

  get kind(): string {
    return "line";
  }

  get x1(): number { return this._x1; }
  get y1(): number { return this._y1; }
  get x2(): number { return this._x2; }
  get y2(): number { return this._y2; }

  translate(dx: number, dy: number): void {
    this._x1 += dx;
    this._y1 += dy;
    this._x2 += dx;
    this._y2 += dy;
  }

  scaleBy(factor: number): void {
    this._x1 *= factor;
    this._y1 *= factor;
    this._x2 *= factor;
    this._y2 *= factor;
  }

  override canSet(attr: string): boolean {
    return (
      super.canSet(attr) ||
      attr === "x1" || attr === "y1" || attr === "x2" || attr === "y2"
    );
  }

  override setAttribute(attr: string, value: string): void {
    switch (attr) {
      case "x1": this._x1 = this.parseNumber(attr, value); return;
      case "y1": this._y1 = this.parseNumber(attr, value); return;
      case "x2": this._x2 = this.parseNumber(attr, value); return;
      case "y2": this._y2 = this.parseNumber(attr, value); return;
      default: super.setAttribute(attr, value); return;
    }
  }

  describe(): string {
    return this.describeWithStyles(
      `(${formatNumber(this._x1)},${formatNumber(this._y1)}) -> (${formatNumber(this._x2)},${formatNumber(this._y2)})`
    );
  }

  protected detailGeometry(): string {
    return `x1=${formatNumber(this._x1)} y1=${formatNumber(this._y1)} x2=${formatNumber(this._x2)} y2=${formatNumber(this._y2)}`;
  }

  toXml(indent: number): string {
    return `${xmlIndent(indent)}<line id="${escapeXmlAttr(this.id)}" x1="${formatNumber(this._x1)}" y1="${formatNumber(this._y1)}" x2="${formatNumber(this._x2)}" y2="${formatNumber(this._y2)}"${this.styleXml()}/>`;
  }
}
