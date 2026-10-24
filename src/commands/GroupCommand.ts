import { GroupShape } from "../core/GroupShape.js";
import type { SvgDocument } from "../core/SvgDocument.js";
import type { Shape } from "../core/Shape.js";
import { EditorError } from "../errors/EditorError.js";
import { EditCommand } from "./EditCommand.js";

interface MemberOrigin {
  shape: Shape;
  parent: GroupShape;
  index: number;
}

export class GroupCommand extends EditCommand {
  private group: GroupShape | null = null;
  private origins: MemberOrigin[] = [];

  constructor(
    private readonly newId: string,
    private readonly memberIds: readonly string[]
  ) {
    super();
  }

  execute(doc: SvgDocument): string {
    if (this.memberIds.length === 0) {
      throw new EditorError("group requires at least one shape");
    }
    doc.assertUniqueId(this.newId);

    const seen = new Set<string>();
    const members: Shape[] = [];
    for (const id of this.memberIds) {
      if (seen.has(id)) {
        throw new EditorError(`duplicate shape in group: ${id}`);
      }
      seen.add(id);
      members.push(doc.requireShape(id));
    }

    for (const outer of members) {
      for (const inner of members) {
        if (outer !== inner && outer.isAncestorOf(inner)) {
          throw new EditorError(`cannot group a container into its own descendant: ${outer.id}`);
        }
      }
    }

    const origins: MemberOrigin[] = [];
    for (const shape of members) {
      const parent = shape.parent;
      if (parent === null) {
        throw new EditorError(`shape is not attached: ${shape.id}`);
      }
      origins.push({ shape, parent, index: parent.children.indexOf(shape) });
    }

    const group = new GroupShape(this.newId);
    for (const shape of members) {
      doc.detach(shape);
    }
    doc.attach(group);
    for (const shape of members) {
      doc.attach(shape, group);
    }

    this.group = group;
    this.origins = origins;
    return `g#${this.newId} created with ${members.length} children`;
  }

  undo(doc: SvgDocument): string {
    if (this.group === null) {
      throw new EditorError(`cannot undo group: ${this.newId}`);
    }
    for (const origin of this.origins) {
      doc.detach(origin.shape);
    }
    doc.detach(this.group);

    // Restore in ascending original-index order per parent so that the
    // recorded indexes remain valid while members are re-inserted.
    const sorted = [...this.origins].sort((a, b) =>
      a.parent === b.parent ? a.index - b.index : a.parent.id.localeCompare(b.parent.id)
    );
    for (const origin of sorted) {
      doc.insert(origin.shape, origin.parent, origin.index);
    }
    return `g#${this.newId} removed with ${this.origins.length} children restored`;
  }
}
