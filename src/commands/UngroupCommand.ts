import { GroupShape } from "../core/GroupShape.js";
import type { SvgDocument } from "../core/SvgDocument.js";
import type { Shape } from "../core/Shape.js";
import { EditorError } from "../errors/EditorError.js";
import { EditCommand } from "./EditCommand.js";

export class UngroupCommand extends EditCommand {
  private group: GroupShape | null = null;
  private parent: GroupShape | null = null;
  private index = -1;
  private children: Shape[] = [];

  constructor(private readonly id: string) {
    super();
  }

  execute(doc: SvgDocument): string {
    const shape = doc.requireShape(this.id);
    if (!(shape instanceof GroupShape)) {
      throw new EditorError(`not a container: ${this.id}`);
    }
    const group = shape;
    const parent = group.parent;
    if (parent === null) {
      throw new EditorError(`shape is not attached: ${this.id}`);
    }
    if (parent === doc.root) {
      throw new EditorError(`cannot ungroup top-level container: ${this.id}`);
    }
    const index = parent.children.indexOf(group);
    const children = [...group.children];

    for (const child of children) {
      doc.detach(child);
    }
    doc.detach(group);
    let offset = 0;
    for (const child of children) {
      doc.insert(child, parent, index + offset);
      offset += 1;
    }

    this.group = group;
    this.parent = parent;
    this.index = index;
    this.children = children;
    return `g#${this.id} ungrouped (${children.length} children)`;
  }

  undo(doc: SvgDocument): string {
    if (this.group === null || this.parent === null) {
      throw new EditorError(`cannot undo ungroup: ${this.id}`);
    }
    for (const child of this.children) {
      doc.detach(child);
    }
    doc.insert(this.group, this.parent, this.index);
    for (const child of this.children) {
      doc.attach(child, this.group);
    }
    return `g#${this.id} restored with ${this.children.length} children`;
  }
}
