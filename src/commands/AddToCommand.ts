import { GroupShape } from "../core/GroupShape.js";
import type { SvgDocument } from "../core/SvgDocument.js";
import { EditorError } from "../errors/EditorError.js";
import { EditCommand } from "./EditCommand.js";

export class AddToCommand extends EditCommand {
  private originalParent: GroupShape | null = null;
  private originalIndex = -1;

  constructor(
    private readonly containerId: string,
    private readonly shapeId: string
  ) {
    super();
  }

  execute(doc: SvgDocument): string {
    const container = this.requireTargetContainer(doc);
    const shape = doc.requireShape(this.shapeId);
    if (shape === container) {
      throw new EditorError(`cannot add a shape to itself: ${this.shapeId}`);
    }
    if (shape.isAncestorOf(container)) {
      throw new EditorError(`cannot add a container into its own descendant: ${this.containerId}`);
    }
    const parent = shape.parent;
    if (parent === null) {
      throw new EditorError(`shape is not attached: ${this.shapeId}`);
    }
    this.originalParent = parent;
    this.originalIndex = parent.children.indexOf(shape);
    doc.detach(shape);
    doc.attach(shape, container);
    return `${shape.kind}#${this.shapeId} added to g#${this.containerId}`;
  }

  undo(doc: SvgDocument): string {
    if (this.originalParent === null) {
      throw new EditorError(`cannot undo addto: ${this.shapeId}`);
    }
    const shape = doc.requireShape(this.shapeId);
    doc.detach(shape);
    doc.insert(shape, this.originalParent, this.originalIndex);
    const label = this.originalParent === doc.root ? "svg" : `g#${this.originalParent.id}`;
    return `${shape.kind}#${this.shapeId} restored into ${label}`;
  }

  private requireTargetContainer(doc: SvgDocument): GroupShape {
    const target = doc.requireShape(this.containerId);
    if (!(target instanceof GroupShape)) {
      throw new EditorError(`not a container: ${this.containerId}`);
    }
    return target;
  }
}
