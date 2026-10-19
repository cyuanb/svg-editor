import type { SvgDocument } from "../core/SvgDocument.js";

/**
 * Command pattern: one editing command = one undo unit.
 * execute() mutates the document and returns the success feedback line;
 * undo() restores the previous state and returns the undo feedback line.
 * Redo re-executes the command with its captured arguments - undo has
 * already restored the pre-state, so the replay is safe.
 */
export abstract class EditCommand {
  abstract execute(doc: SvgDocument): string;
  abstract undo(doc: SvgDocument): string;
}
