import type { SvgDocument } from "../core/SvgDocument.js";
import { EditorError } from "../errors/EditorError.js";
import type { EditCommand } from "../commands/EditCommand.js";

/**
 * Undo/redo history with lab IO-lock semantics (design decision D4):
 *
 * - One editing command = one undo unit; a failed command changes nothing.
 * - A new successful edit clears the redo stack and re-enables undo/redo.
 * - Document commands lock undo/redo afterwards:
 *   - init/read replace the whole document object, so old command objects
 *     would reference a stale document -> both stacks are cleared as well;
 *   - save/canvas only touch the current document -> stacks are preserved,
 *     and after the next edit undo may reach commands issued before the IO.
 */
export class HistoryManager {
  private undoStack: EditCommand[] = [];
  private redoStack: EditCommand[] = [];
  private ioLocked = false;

  /** Executes an editing command; returns its success feedback line. */
  run(cmd: EditCommand, doc: SvgDocument): string {
    const message = cmd.execute(doc); // throws EditorError -> no stack change
    this.undoStack.push(cmd);
    this.redoStack = [];
    this.ioLocked = false;
    return message;
  }

  undo(doc: SvgDocument): string {
    this.assertIoUnlocked();
    const cmd = this.undoStack.pop();
    if (cmd === undefined) {
      throw new EditorError("nothing to undo");
    }
    const message = cmd.undo(doc);
    this.redoStack.push(cmd);
    return message;
  }

  redo(doc: SvgDocument): string {
    this.assertIoUnlocked();
    const cmd = this.redoStack.pop();
    if (cmd === undefined) {
      throw new EditorError("nothing to redo");
    }
    const message = cmd.execute(doc);
    this.undoStack.push(cmd);
    return message;
  }

  /**
   * Called after a document command. replacesDocument is true for
   * init/read (whole document object swapped) and false for save/canvas.
   */
  notifyIoCommand(replacesDocument: boolean): void {
    this.ioLocked = true;
    if (replacesDocument) {
      this.undoStack = [];
      this.redoStack = [];
    }
  }

  private assertIoUnlocked(): void {
    if (this.ioLocked) {
      throw new EditorError("undo not allowed after io command");
    }
  }
}
