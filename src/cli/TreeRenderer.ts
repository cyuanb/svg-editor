import type { GroupShape } from "../core/GroupShape.js";
import type { Shape } from "../core/Shape.js";
import type { SvgDocument } from "../core/SvgDocument.js";

/** Renders the tree display with inline geometry (lab section 5.1). */
export class TreeRenderer {
  renderDocument(doc: SvgDocument): string[] {
    const lines = [`svg (${doc.width}x${doc.height})`];
    this.renderChildren(doc.root.children, "", lines);
    return lines;
  }

  renderShape(shape: Shape): string[] {
    const lines: string[] = [];
    const description = shape.describe();
    lines.push(description.length > 0 ? `${shape.kind}#${shape.id} ${description}` : `${shape.kind}#${shape.id}`);
    if (shape.isContainer) {
      this.renderChildren((shape as GroupShape).children, "", lines);
    }
    return lines;
  }

  private renderChildren(children: Shape[], prefix: string, lines: string[]): void {
    if (children.length === 0) {
      return;
    }
    const labels = children.map((child) => `${child.kind}#${child.id}`);
    const width = Math.max(...labels.map((label) => label.length)) + 2;
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const description = child.describe();
      const label = labels[index] as string;
      const padded = description.length > 0 ? label.padEnd(width) : label;
      lines.push(`${prefix}${connector}${padded}${description}`);
      if (child.isContainer) {
        this.renderChildren((child as GroupShape).children, prefix + (isLast ? "    " : "│   "), lines);
      }
    });
  }
}
