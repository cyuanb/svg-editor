import { EditorError } from "../errors/EditorError.js";

export interface XmlNode {
  tag: string;
  attrs: Map<string, string>;
  children: XmlNode[];
  text: string;
}

export function unescapeXmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Minimal strict XML parser covering the editor's needs: prolog and
 * comments, nested elements, double-quoted attributes, self-closing tags,
 * text content and the standard escape entities.
 */
export class XmlParser {
  private pos = 0;

  constructor(private readonly source: string) {}

  parse(): XmlNode {
    this.skipProlog();
    const root = this.parseElement();
    this.skipProlog();
    if (this.pos !== this.source.length) {
      throw new EditorError("malformed xml: trailing content after root element");
    }
    return root;
  }

  private skipProlog(): void {
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.source.startsWith("<!--", this.pos)) {
        this.skipUntil("-->", "unterminated comment");
      } else if (this.source.startsWith("<?", this.pos)) {
        this.skipUntil("?>", "unterminated processing instruction");
      } else if (this.source.startsWith("<!", this.pos)) {
        this.skipUntil(">", "unterminated declaration");
      } else {
        return;
      }
    }
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length && " \t\r\n".includes(this.source.charAt(this.pos))) {
      this.pos += 1;
    }
  }

  private skipUntil(marker: string, problem: string): void {
    const end = this.source.indexOf(marker, this.pos);
    if (end < 0) {
      throw new EditorError(`malformed xml: ${problem}`);
    }
    this.pos = end + marker.length;
  }

  private parseElement(): XmlNode {
    if (this.source.charAt(this.pos) !== "<") {
      throw new EditorError("malformed xml: expected element");
    }
    this.pos += 1;
    this.skipWhitespace();
    const tag = this.readName();
    const attrs = new Map<string, string>();
    const children: XmlNode[] = [];
    let text = "";
    let selfClosing = false;

    for (;;) {
      this.skipWhitespace();
      const ch = this.source.charAt(this.pos);
      if (ch === "") {
        throw new EditorError(`malformed xml: unexpected end of input in <${tag}>`);
      }
      if (this.source.startsWith("/>", this.pos)) {
        this.pos += 2;
        selfClosing = true;
        break;
      }
      if (ch === ">") {
        this.pos += 1;
        break;
      }
      const name = this.readName();
      this.skipWhitespace();
      if (this.source.charAt(this.pos) !== "=") {
        throw new EditorError(`malformed xml: attribute ${name} has no value`);
      }
      this.pos += 1;
      this.skipWhitespace();
      if (this.source.charAt(this.pos) !== '"') {
        throw new EditorError("malformed xml: attribute values must be double-quoted");
      }
      this.pos += 1;
      const end = this.source.indexOf('"', this.pos);
      if (end < 0) {
        throw new EditorError("malformed xml: unterminated attribute value");
      }
      attrs.set(name, unescapeXmlEntities(this.source.slice(this.pos, end)));
      this.pos = end + 1;
    }

    if (selfClosing) {
      return { tag, attrs, children, text };
    }

    for (;;) {
      if (this.pos >= this.source.length) {
        throw new EditorError(`malformed xml: unclosed element <${tag}>`);
      }
      if (this.source.startsWith("</", this.pos)) {
        this.pos += 2;
        this.skipWhitespace();
        const closeTag = this.readName();
        this.skipWhitespace();
        if (this.source.charAt(this.pos) !== ">") {
          throw new EditorError("malformed xml: malformed closing tag");
        }
        this.pos += 1;
        if (closeTag !== tag) {
          throw new EditorError(`malformed xml: mismatched closing tag </${closeTag}>`);
        }
        return { tag, attrs, children, text: unescapeXmlEntities(text) };
      }
      if (this.source.startsWith("<!--", this.pos)) {
        this.skipUntil("-->", "unterminated comment");
        continue;
      }
      if (this.source.startsWith("<?", this.pos)) {
        this.skipUntil("?>", "unterminated processing instruction");
        continue;
      }
      if (this.source.charAt(this.pos) === "<") {
        children.push(this.parseElement());
        continue;
      }
      const next = this.source.indexOf("<", this.pos);
      const end = next < 0 ? this.source.length : next;
      text += this.source.slice(this.pos, end);
      this.pos = end;
    }
  }

  private readName(): string {
    const start = this.pos;
    while (this.pos < this.source.length && !" \t\r\n=/>".includes(this.source.charAt(this.pos))) {
      this.pos += 1;
    }
    if (this.pos === start) {
      throw new EditorError("malformed xml: expected name");
    }
    return this.source.slice(start, this.pos);
  }
}
