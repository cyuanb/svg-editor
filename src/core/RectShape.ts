import { escapeXmlAttr, formatNumber, Shape, xmlIndent } from "./Shape.js";

export class RectShape extends Shape {
  private _x: number;
  private _y: number;
  private _width: number;
  private _height: number;

  constructor(id: string, x: number, y: number, width: number, height: number, fill?: string) {
    super(id);
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
    this.fill = fill;
  }

  get kind(): string {
    return "rect";
  }

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get width(): number { return this._width; }
  get height(): number { return this._height; }

  translate(dx: number, dy: number): void {
    this._x += dx;
    this._y += dy;
  }

  scaleBy(factor: number): void {
    this._x *= factor;
    this._y *= factor;
    this._width *= factor;
    this._height *= factor;
  }

  override canSet(attr: string): boolean {
    return (
      super.canSet(attr) ||
      attr === "x" || attr === "y" || attr === "width" || attr === "height"
    );
  }

  override setAttribute(attr: string, value: string): void {
    switch (attr) {
      case "x": this._x = this.parseNumber(attr, value); return;
      case "y": this._y = this.parseNumber(attr, value); return;
      case "width": this._width = this.parseNumber(attr, value); return;
      case "height": this._height = this.parseNumber(attr, value); return;
      default: super.setAttribute(attr, value); return;
    }
  }

  describe(): string {
    return this.describeWithStyles(
      `x=${formatNumber(this._x)} y=${formatNumber(this._y)} w=${formatNumber(this._width)} h=${formatNumber(this._height)}`
    );
  }

  protected detailGeometry(): string {
    return `x=${formatNumber(this._x)} y=${formatNumber(this._y)} width=${formatNumber(this._width)} height=${formatNumber(this._height)}`;
  }

  toXml(indent: number): string {
    return `${xmlIndent(indent)}<rect id="${escapeXmlAttr(this.id)}" x="${formatNumber(this._x)}" y="${formatNumber(this._y)}" width="${formatNumber(this._width)}" height="${formatNumber(this._height)}"${this.styleXml()}/>`;
  }
}
