import { escapeXmlAttr, formatNumber, Shape, xmlIndent } from "./Shape.js";

export class EllipseShape extends Shape {
  private _cx: number;
  private _cy: number;
  private _rx: number;
  private _ry: number;

  constructor(id: string, cx: number, cy: number, rx: number, ry: number, fill?: string) {
    super(id);
    this._cx = cx;
    this._cy = cy;
    this._rx = rx;
    this._ry = ry;
    this.fill = fill;
  }

  get kind(): string {
    return "ellipse";
  }

  get cx(): number { return this._cx; }
  get cy(): number { return this._cy; }
  get rx(): number { return this._rx; }
  get ry(): number { return this._ry; }

  translate(dx: number, dy: number): void {
    this._cx += dx;
    this._cy += dy;
  }

  scaleBy(factor: number): void {
    this._cx *= factor;
    this._cy *= factor;
    this._rx *= factor;
    this._ry *= factor;
  }

  override canSet(attr: string): boolean {
    return (
      super.canSet(attr) ||
      attr === "cx" || attr === "cy" || attr === "rx" || attr === "ry"
    );
  }

  override setAttribute(attr: string, value: string): void {
    switch (attr) {
      case "cx": this._cx = this.parseNumber(attr, value); return;
      case "cy": this._cy = this.parseNumber(attr, value); return;
      case "rx": this._rx = this.parseNumber(attr, value); return;
      case "ry": this._ry = this.parseNumber(attr, value); return;
      default: super.setAttribute(attr, value); return;
    }
  }

  describe(): string {
    return this.describeWithStyles(
      `cx=${formatNumber(this._cx)} cy=${formatNumber(this._cy)} rx=${formatNumber(this._rx)} ry=${formatNumber(this._ry)}`
    );
  }

  protected detailGeometry(): string {
    return `cx=${formatNumber(this._cx)} cy=${formatNumber(this._cy)} rx=${formatNumber(this._rx)} ry=${formatNumber(this._ry)}`;
  }

  toXml(indent: number): string {
    return `${xmlIndent(indent)}<ellipse id="${escapeXmlAttr(this.id)}" cx="${formatNumber(this._cx)}" cy="${formatNumber(this._cy)}" rx="${formatNumber(this._rx)}" ry="${formatNumber(this._ry)}"${this.styleXml()}/>`;
  }
}
