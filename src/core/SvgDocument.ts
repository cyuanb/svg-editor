import { EditorError } from "../errors/EditorError.js";
import { GroupShape } from "./GroupShape.js";
import { CANVAS_ROOT_ID, Shape } from "./Shape.js";

/**
 * Aggregate root: canvas size + logical root container + global id index.
 * attach/detach keep the id index in sync for whole subtrees (Composite).
 */
export class SvgDocument {
  private _width: number;
  private _height: number;
  readonly root: GroupShape;
  private readonly shapesById = new Map<string, Shape>();

  constructor(width = 800, height = 600) {
    this._width = width;
    this._height = height;
    this.root = new GroupShape(CANVAS_ROOT_ID);
  }

  get width(): number { return this._width; }
  get height(): number { return this._height; }

  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
  }

  findById(id: string): Shape | undefined {
    return this.shapesById.get(id);
  }

  requireShape(id: string): Shape {
    const shape = this.shapesById.get(id);
    if (shape === undefined) {
      throw new EditorError(`no such shape: ${id}`);
    }
    return shape;
  }

  requireContainer(id: string): GroupShape {
    const shape = this.requireShape(id);
    if (!(shape instanceof GroupShape)) {
      throw new EditorError(`not a container: ${id}`);
    }
    return shape;
  }

  assertUniqueId(id: string): void {
    if (id === CANVAS_ROOT_ID || this.shapesById.has(id)) {
      throw new EditorError(`id already exists: ${id}`);
    }
  }

  attach(shape: Shape, parent: GroupShape = this.root): void {
    if (shape === this.root) {
      throw new EditorError("cannot attach the canvas root");
    }
    const subtree: Shape[] = [];
    this.collectSubtree(shape, subtree);
    for (const member of subtree) {
      this.shapesById.set(member.id, member);
    }
    parent.children.push(shape);
    shape.parent = parent;
  }

  detach(shape: Shape): void {
    if (shape === this.root) {
      throw new EditorError("cannot detach the canvas root");
    }
    const parent = shape.parent;
    if (parent === null) {
      throw new EditorError(`shape is not attached: ${shape.id}`);
    }
    const index = parent.children.indexOf(shape);
    if (index < 0) {
      throw new EditorError(`shape is not attached: ${shape.id}`);
    }
    parent.children.splice(index, 1);
    shape.parent = null;
    this.unregisterSubtree(shape);
  }

  countElements(): number {
    return this.shapesById.size;
  }

  allShapes(): Shape[] {
    return [...this.shapesById.values()];
  }

  private collectSubtree(shape: Shape, acc: Shape[]): void {
    this.assertUniqueId(shape.id);
    if (acc.some((member) => member.id === shape.id)) {
      throw new EditorError(`id already exists: ${shape.id}`);
    }
    acc.push(shape);
    if (shape instanceof GroupShape) {
      for (const child of shape.children) {
        this.collectSubtree(child, acc);
      }
    }
  }

  private unregisterSubtree(shape: Shape): void {
    this.shapesById.delete(shape.id);
    if (shape instanceof GroupShape) {
      for (const child of shape.children) {
        this.unregisterSubtree(child);
      }
    }
  }
}
