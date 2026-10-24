import type { SvgDocument } from "../core/SvgDocument.js";
import { EditorError } from "../errors/EditorError.js";
import { EditCommand } from "./EditCommand.js";

export class BackCommand extends EditCommand {
  private originalIndex = -1;

  constructor(private readonly id: string) {
    super();
  }

  execute(doc: SvgDocument): string {
    const shape = doc.requireShape(this.id);
    const parent = shape.parent;
    if (parent === null) {
      throw new EditorError(`shape is not attached: ${this.id}`);
    }
    this.originalIndex = parent.children.indexOf(shape);
    parent.children.splice(this.originalIndex, 1);
    parent.children.unshift(shape);
    return `${shape.kind}#${this.id} moved to back`;
  }

  undo(doc: SvgDocument): string {
    const shape = doc.requireShape(this.id);
    const parent = shape.parent;
    if (parent === null || this.originalIndex < 0) {
      throw new EditorError(`cannot undo back: ${this.id}`);
    }
    const current = parent.children.indexOf(shape);
    parent.children.splice(current, 1);
    parent.children.splice(this.originalIndex, 0, shape);
    return `${shape.kind}#${this.id} z-order restored`;
  }
}
