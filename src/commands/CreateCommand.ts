import type { SvgDocument } from "../core/SvgDocument.js";
import { ShapeFactory } from "../factory/ShapeFactory.js";
import { EditCommand } from "./EditCommand.js";

export class CreateCommand extends EditCommand {
  constructor(
    private readonly factory: ShapeFactory,
    private readonly type: string,
    private readonly id: string,
    private readonly params: readonly string[],
    private readonly containerId: string | null
  ) {
    super();
  }

  execute(doc: SvgDocument): string {
    doc.assertUniqueId(this.id);
    const shape = this.factory.create(this.type, this.id, this.params);
    const parent = this.containerId === null ? doc.root : doc.requireContainer(this.containerId);
    doc.attach(shape, parent);
    return this.containerId === null
      ? `${shape.kind}#${this.id} created`
      : `${shape.kind}#${this.id} created in g#${this.containerId}`;
  }

  undo(doc: SvgDocument): string {
    const shape = doc.requireShape(this.id);
    doc.detach(shape);
    return `${shape.kind}#${this.id} removed`;
  }
}
