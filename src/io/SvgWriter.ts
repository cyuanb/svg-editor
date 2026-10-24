import { SvgDocument } from "../core/SvgDocument.js";

/** Serializes a document to the canonical SVG text format (2-space indent). */
export class SvgWriter {
  write(doc: SvgDocument): string {
    const header = '<?xml version="1.0" encoding="UTF-8"?>';
    const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${doc.width}" height="${doc.height}" viewBox="0 0 ${doc.width} ${doc.height}">`;
    const body = doc.root.children.map((child) => child.toXml(1)).join("\n");
    const close = "</svg>";
    if (body.length === 0) {
      return `${header}\n${open}\n${close}\n`;
    }
    return `${header}\n${open}\n${body}\n${close}\n`;
  }
}
