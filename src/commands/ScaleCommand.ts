import type { SvgDocument } from "../core/SvgDocument.js";
import type { Shape, ShapeStateSnapshot } from "../core/Shape.js";
import { formatNumber } from "../core/Shape.js";
import { EditorError } from "../errors/EditorError.js";
import { parseNumber } from "../parsing/Tokenizer.js";
import { EditCommand } from "./EditCommand.js";

interface AffectedShape {
  shape: Shape;
  snapshot: ShapeStateSnapshot;
}

export class ScaleCommand extends EditCommand {
  private affected: AffectedShape[] = [];

  constructor(
    private readonly id: string,
    private readonly factorRaw: string
  ) {
    super();
  }

  execute(doc: SvgDocument): string {
    const shape = doc.requireShape(this.id);
    const factor = parseNumber(this.factorRaw);
    if (factor <= 0) {
      throw new EditorError("scale factor must be positive");
    }
    const affected: AffectedShape[] = [];
    shape.visitSubtree((member) => {
      affected.push({ shape: member, snapshot: member.captureState() });
    });
    shape.scaleBy(factor);
    this.affected = affected;
    return `${shape.kind}#${this.id} scaled by ${formatNumber(factor)}`;
  }

  undo(doc: SvgDocument): string {
    const shape = doc.requireShape(this.id);
    if (this.affected.length === 0) {
      throw new EditorError(`cannot undo scale: ${this.id}`);
    }
    for (const entry of this.affected) {
      entry.shape.restoreState(entry.snapshot);
    }
    return `${shape.kind}#${this.id} scale undone`;
  }
}
