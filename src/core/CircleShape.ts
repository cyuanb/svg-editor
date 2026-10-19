import { escapeXmlAttr, formatNumber, Shape, xmlIndent } from "./Shape.js";

export class CircleShape extends Shape {
  private _cx: number;
  private _cy: number;
  private _r: number;

  constructor(id: string, cx: number, cy: number, r: number, fill?: string) {
    super(id);
    this._cx = cx;
    this._cy = cy;
    this._r = r;
    this.fill = fill;
  }

  get kind(): string {
    return "circle";
  }

  get cx(): number { return this._cx; }
  get cy(): number { return this._cy; }
  get r(): number { return this._r; }

  translate(dx: number, dy: number): void {
    this._cx += dx;
    this._cy += dy;
  }

  scaleBy(factor: number): void {
    this._cx *= factor;
    this._cy *= factor;
    this._r *= factor;
  }

  override canSet(attr: string): boolean {
    return super.canSet(attr) || attr === "cx" || attr === "cy" || attr === "r";
  }

  override setAttribute(attr: string, value: string): void {
    switch (attr) {
      case "cx": this._cx = this.parseNumber(attr, value); return;
      case "cy": this._cy = this.parseNumber(attr, value); return;
      case "r": this._r = this.parseNumber(attr, value); return;
      default: super.setAttribute(attr, value); return;
    }
  }

  describe(): string {
    return this.describeWithStyles(
      `cx=${formatNumber(this._cx)} cy=${formatNumber(this._cy)} r=${formatNumber(this._r)}`
    );
  }

  protected detailGeometry(): string {
    return `cx=${formatNumber(this._cx)} cy=${formatNumber(this._cy)} r=${formatNumber(this._r)}`;
  }

  toXml(indent: number): string {
    return `${xmlIndent(indent)}<circle id="${escapeXmlAttr(this.id)}" cx="${formatNumber(this._cx)}" cy="${formatNumber(this._cy)}" r="${formatNumber(this._r)}"${this.styleXml()}/>`;
  }
}
