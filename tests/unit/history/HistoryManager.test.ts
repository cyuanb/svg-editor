import { describe, expect, it } from "vitest";
import { EditCommand } from "../../../src/commands/EditCommand.js";
import { HistoryManager } from "../../../src/history/HistoryManager.js";
import { CircleShape } from "../../../src/core/CircleShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";
import { EditorError } from "../../../src/errors/EditorError.js";

class CounterCommand extends EditCommand {
  executeCount = 0;
  undoCount = 0;

  constructor(
    private readonly execMessage: string,
    private readonly undoMessage: string,
    private readonly failExecute = false
  ) {
    super();
  }

  execute(_doc: SvgDocument): string {
    if (this.failExecute) {
      throw new EditorError("boom");
    }
    this.executeCount += 1;
    return this.execMessage;
  }

  undo(_doc: SvgDocument): string {
    this.undoCount += 1;
    return this.undoMessage;
  }
}

class FailingCommand extends CounterCommand {
  constructor() {
    super("never", "never", true);
  }
}

describe("HistoryManager", () => {
  function docWithCircle(): SvgDocument {
    const doc = new SvgDocument();
    doc.attach(new CircleShape("c1", 0, 0, 1));
    return doc;
  }

  it("executes commands, undoes them and redoes them by replaying", () => {
    const history = new HistoryManager();
    const doc = docWithCircle();
    const cmd = new CounterCommand("did", "undone");

    expect(history.run(cmd, doc)).toBe("did");
    expect(cmd.executeCount).toBe(1);

    expect(history.undo(doc)).toBe("undone");
    expect(cmd.undoCount).toBe(1);

    expect(history.redo(doc)).toBe("did");
    expect(cmd.executeCount).toBe(2);
  });

  it("a new edit after undo clears the redo stack", () => {
    const history = new HistoryManager();
    const doc = docWithCircle();
    const first = new CounterCommand("a", "a-undo");
    const second = new CounterCommand("b", "b-undo");

    history.run(first, doc);
    history.undo(doc);
    history.run(second, doc);

    expect(() => history.redo(doc)).toThrowError("nothing to redo");
    expect(history.undo(doc)).toBe("b-undo");
    // "first" was already undone before "second" ran; its redo entry was
    // cleared, so only "second" remains undoable.
    expect(() => history.undo(doc)).toThrowError("nothing to undo");
  });

  it("a failed command changes neither document state nor stacks", () => {
    const history = new HistoryManager();
    const doc = docWithCircle();
    const ok = new CounterCommand("ok", "ok-undo");
    history.run(ok, doc);

    const before = doc.countElements();
    expect(() => history.run(new FailingCommand(), doc)).toThrowError("boom");
    expect(doc.countElements()).toBe(before);

    // The successful command is still the only undo unit.
    expect(history.undo(doc)).toBe("ok-undo");
    expect(() => history.undo(doc)).toThrowError("nothing to undo");
  });

  it("save/canvas lock history but keep stacks; next edit re-enables undo", () => {
    const history = new HistoryManager();
    const doc = docWithCircle();
    const before = new CounterCommand("before", "before-undo");
    history.run(before, doc);

    history.notifyIoCommand(false); // save / canvas resize
    expect(() => history.undo(doc)).toThrowError("undo not allowed after io command");
    expect(() => history.redo(doc)).toThrowError("undo not allowed after io command");

    const after = new CounterCommand("after", "after-undo");
    history.run(after, doc);
    expect(history.undo(doc)).toBe("after-undo");
    // Reaches the command issued before the IO command.
    expect(history.undo(doc)).toBe("before-undo");
  });

  it("init/read lock history and clear both stacks (stale references)", () => {
    const history = new HistoryManager();
    const doc = docWithCircle();
    history.run(new CounterCommand("a", "a-undo"), doc);
    history.undo(doc);

    history.notifyIoCommand(true); // init / read replaced the document
    expect(() => history.undo(doc)).toThrowError("undo not allowed after io command");
    expect(() => history.redo(doc)).toThrowError("undo not allowed after io command");

    history.run(new CounterCommand("fresh", "fresh-undo"), doc);
    expect(history.undo(doc)).toBe("fresh-undo");
    expect(() => history.undo(doc)).toThrowError("nothing to undo");
    expect(history.redo(doc)).toBe("fresh");
  });

  it("a failed edit while locked stays locked", () => {
    const history = new HistoryManager();
    const doc = docWithCircle();
    history.notifyIoCommand(false);
    expect(() => history.run(new FailingCommand(), doc)).toThrowError("boom");
    expect(() => history.undo(doc)).toThrowError("undo not allowed after io command");
  });

  it("reports empty stacks with distinct messages", () => {
    const history = new HistoryManager();
    const doc = docWithCircle();
    expect(() => history.undo(doc)).toThrowError("nothing to undo");
    expect(() => history.redo(doc)).toThrowError("nothing to redo");
  });
});
