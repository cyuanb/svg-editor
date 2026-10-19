import type { SvgDocument } from "../core/SvgDocument.js";
import type { ShapeStateSnapshot } from "../core/Shape.js";
import { EditorError } from "../errors/EditorError.js";
import { EditCommand } from "./EditCommand.js";

export class SetCommand extends EditCommand {
  private snapshot: ShapeStateSnapshot | null = null;
  private previousValue: string | undefined;

  constructor(
    private readonly id: string,
    private readonly attr: string,
    private readonly value: string
  ) {
    super();
  }

  execute(doc: SvgDocument): string {
    const shape = doc.requireShape(this.id);
    if (!shape.canSet(this.attr)) {
      throw new EditorError(`unknown attribute: ${this.attr}`);
    }
    this.previousValue = shape.getAttribute(this.attr);
    this.snapshot = shape.captureState();
    shape.setAttribute(this.attr, this.value);
    return `${shape.kind}#${this.id} updated: ${SetCommand.display(this.attr, this.value)}`;
  }

  undo(doc: SvgDocument): string {
    const shape = doc.requireShape(this.id);
    if (this.snapshot === null) {
      throw new EditorError(`cannot undo set: ${this.id}`);
    }
    shape.restoreState(this.snapshot);
    return this.previousValue === undefined
      ? `${shape.kind}#${this.id} ${this.attr} unset`
      : `${shape.kind}#${this.id} updated: ${SetCommand.display(this.attr, this.previousValue)}`;
  }

  private static display(attr: string, value: string): string {
    return attr === "text" ? `text="${value}"` : `${attr}=${value}`;
  }
}
