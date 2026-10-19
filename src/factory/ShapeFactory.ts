import { CircleShape } from "../core/CircleShape.js";
import { EllipseShape } from "../core/EllipseShape.js";
import { GroupShape } from "../core/GroupShape.js";
import { LineShape } from "../core/LineShape.js";
import { RectShape } from "../core/RectShape.js";
import type { Shape } from "../core/Shape.js";
import { TextShape } from "../core/TextShape.js";
import { EditorError } from "../errors/EditorError.js";
import { parseNumber } from "../parsing/Tokenizer.js";

/**
 * Creates built-in shapes from CLI parameters.
 *
 * NOTE: this is allowed by-name dispatch point #1 (type name -> class).
 * It is the single place where shape types are enumerated and is the
 * designated refactoring seam for the Phase 2 ShapeProvider plugin
 * registry (box etc.) - the kernel will then hold zero type knowledge.
 */
export class ShapeFactory {
  create(type: string, id: string, params: readonly string[]): Shape {
    switch (type) {
      case "rect":
        this.assertParamCount(type, params, 4, 5);
        return new RectShape(
          id,
          parseNumber(params[0] as string),
          parseNumber(params[1] as string),
          parseNumber(params[2] as string),
          parseNumber(params[3] as string),
          params[4]
        );

      case "circle":
        this.assertParamCount(type, params, 3, 4);
        return new CircleShape(
          id,
          parseNumber(params[0] as string),
          parseNumber(params[1] as string),
          parseNumber(params[2] as string),
          params[3]
        );

      case "ellipse":
        this.assertParamCount(type, params, 4, 5);
        return new EllipseShape(
          id,
          parseNumber(params[0] as string),
          parseNumber(params[1] as string),
          parseNumber(params[2] as string),
          parseNumber(params[3] as string),
          params[4]
        );

      case "line":
        this.assertParamCount(type, params, 4, 5);
        return new LineShape(
          id,
          parseNumber(params[0] as string),
          parseNumber(params[1] as string),
          parseNumber(params[2] as string),
          parseNumber(params[3] as string),
          params[4]
        );

      case "text":
        this.assertParamCount(type, params, 3, 3);
        return new TextShape(
          id,
          parseNumber(params[0] as string),
          parseNumber(params[1] as string),
          params[2] as string
        );

      case "g":
        this.assertParamCount(type, params, 0, 0);
        return new GroupShape(id);

      default:
        throw new EditorError(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
  }

  private assertParamCount(type: string, params: readonly string[], min: number, max: number): void {
    if (params.length < min || params.length > max) {
      const required = min === max ? `${min}` : `${min}-${max}`;
      throw new EditorError(`invalid arguments for ${type}: expected ${required} parameter(s)`);
    }
  }
}
