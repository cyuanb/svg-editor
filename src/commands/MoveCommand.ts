import type { SvgDocument } from "../core/SvgDocument.js";
import { formatNumber } from "../core/Shape.js";
import { parseNumber } from "../parsing/Tokenizer.js";
import { EditCommand } from "./EditCommand.js";

export class MoveCommand extends EditCommand {
  constructor(
    private readonly id: string,
    private readonly dxRaw: string,
    private readonly dyRaw: string
  ) {
    super();
  }

  execute(doc: SvgDocument): string {
    const shape = doc.requireShape(this.id);
    const dx = parseNumber(this.dxRaw);
    const dy = parseNumber(this.dyRaw);
    shape.translate(dx, dy);
    if (shape.isContainer) {
      return `${shape.kind}#${this.id} moved by (${formatNumber(dx)},${formatNumber(dy)})`;
    }
    return `${shape.kind}#${this.id} moved to ${shape.positionLabel()}`;
  }

  undo(doc: SvgDocument): string {
    const shape = doc.requireShape(this.id);
    const dx = parseNumber(this.dxRaw);
    const dy = parseNumber(this.dyRaw);
    shape.translate(-dx, -dy);
    if (shape.isContainer) {
      return `${shape.kind}#${this.id} moved back by (${formatNumber(-dx)},${formatNumber(-dy)})`;
    }
    return `${shape.kind}#${this.id} moved back to ${shape.positionLabel()}`;
  }
}
