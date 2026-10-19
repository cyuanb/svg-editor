import type { GroupShape } from "../core/GroupShape.js";
import type { SvgDocument } from "../core/SvgDocument.js";
import type { Shape } from "../core/Shape.js";
import { EditorError } from "../errors/EditorError.js";
import { EditCommand } from "./EditCommand.js";

export class DeleteCommand extends EditCommand {
  private shape: Shape | null = null;
  private parent: GroupShape | null = null;
  private index = -1;
  private parentLabel = "";

  constructor(private readonly id: string) {
    super();
  }

  execute(doc: SvgDocument): string {
    const shape = doc.requireShape(this.id);
    const parent = shape.parent;
    if (parent === null) {
      throw new EditorError(`shape is not attached: ${this.id}`);
    }
    this.shape = shape;
    this.parent = parent;
    this.index = parent.children.indexOf(shape);
    this.parentLabel = parent === doc.root ? "svg" : `g#${parent.id}`;
    doc.detach(shape);
    return `${shape.kind}#${this.id} deleted`;
  }

  undo(doc: SvgDocument): string {
    if (this.shape === null || this.parent === null || this.index < 0) {
      throw new EditorError(`cannot undo delete: ${this.id}`);
    }
    doc.insert(this.shape, this.parent, this.index);
    return `${this.shape.kind}#${this.shape.id} restored into ${this.parentLabel}`;
  }
}
