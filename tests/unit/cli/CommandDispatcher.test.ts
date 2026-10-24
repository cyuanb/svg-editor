import { describe, expect, it } from "vitest";
import { CommandDispatcher } from "../../../src/cli/CommandDispatcher.js";
import { ParsedCommand } from "../../../src/parsing/ParsedCommand.js";

function makeDispatcher(files = new Map<string, string>()): CommandDispatcher {
  return new CommandDispatcher(
    (path) => {
      if (!files.has(path)) {
        throw new Error("ENOENT");
      }
      return files.get(path) as string;
    },
    (path, content) => {
      files.set(path, content);
    }
  );
}

function run(dispatcher: CommandDispatcher, line: string): string[] {
  const parsed = ParsedCommand.parse(line);
  if (parsed === null) {
    throw new Error(`unparsed line: ${line}`);
  }
  return dispatcher.dispatch(parsed);
}

function expectError(dispatcher: CommandDispatcher, line: string, message: string): void {
  expect(() => run(dispatcher, line)).toThrowError(message);
}

describe("CommandDispatcher", () => {
  it("init creates a canvas with defaults and custom sizes", () => {
    const d = makeDispatcher();
    expect(run(d, "init")).toEqual(["canvas 800x600 created"]);
    expect(run(d, "init 400 200")).toEqual(["canvas 400x200 created"]);
  });

  it("guards non-help commands without a document", () => {
    const d = makeDispatcher();
    expectError(d, "create rect r 0 0 1 1", "no document. use 'init' or 'read' first");
    expectError(d, "tree", "no document. use 'init' or 'read' first");
    expectError(d, "save out.svg", "no document. use 'init' or 'read' first");
    expectError(d, "undo", "no document. use 'init' or 'read' first");
    expect(run(d, "help").length).toBeGreaterThan(10);
  });

  it("reads files: warnings first, then the summary line", () => {
    const files = new Map<string, string>([
      ["other.svg", '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">\n  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>\n</svg>\n'],
    ]);
    const d = makeDispatcher(files);
    expect(run(d, "read other.svg")).toEqual([
      "warning: assigned id rect1 to unnamed <rect>",
      "read other.svg (1 elements)",
    ]);
    expectError(makeDispatcher(), "read missing.svg", "cannot read file: missing.svg");
  });

  it("save uses the argument, then falls back to the source path", () => {
    const files = new Map<string, string>([
      ["in.svg", '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect id="r" x="0" y="0" width="1" height="1"/></svg>'],
    ]);
    const d = makeDispatcher(files);
    run(d, "read in.svg");
    expect(run(d, "save")).toEqual(["saved to in.svg (1 elements)"]);
    expect(run(d, "save out.svg")).toEqual(["saved to out.svg (1 elements)"]);
    expect(files.get("out.svg")).toContain('<rect id="r"');
  });

  it("save without any path errors clearly", () => {
    const d = makeDispatcher();
    run(d, "init");
    expectError(d, "save", "no file specified");
  });

  it("save and canvas lock undo until the next edit", () => {
    const d = makeDispatcher();
    run(d, "init");
    run(d, "create rect r 0 0 1 1");
    run(d, "save out.svg");
    expectError(d, "undo", "undo not allowed after io command");
    run(d, "create rect r2 0 0 1 1");
    expect(run(d, "undo")).toEqual(["rect#r2 removed"]);
    expect(run(d, "canvas")).toEqual(["canvas 800x600"]);
    run(d, "canvas 400 300");
    expectError(d, "undo", "undo not allowed after io command");
    expect(run(d, "canvas")).toEqual(["canvas 400x300"]);
  });

  it("dispatches editing commands through history with lab feedback", () => {
    const d = makeDispatcher();
    run(d, "init 800 600");
    expect(run(d, 'create rect bg 0 0 800 600 #ffffff')).toEqual(["rect#bg created"]);
    expect(run(d, 'create text title 20 40 "My Diagram"')).toEqual(["text#title created"]);
    expect(run(d, "create circle c1 100 100 20 red")).toEqual(["circle#c1 created"]);
    expect(run(d, "create rect box 200 80 60 60 #3366ff")).toEqual(["rect#box created"]);
    expect(run(d, "group markers c1 box")).toEqual(["g#markers created with 2 children"]);
    expect(run(d, "move c1 30 0")).toEqual(["circle#c1 moved to (130,100)"]);
    expect(run(d, "undo")).toEqual(["circle#c1 moved back to (100,100)"]);
    expect(run(d, "redo")).toEqual(["circle#c1 moved to (130,100)"]);
  });

  it("renders the full tree and a subtree with inline attributes", () => {
    const d = makeDispatcher();
    run(d, "init 800 600");
    run(d, "create rect bg 0 0 800 600 #ffffff");
    run(d, 'create text title 20 40 "My Diagram"');
    run(d, "create circle c1 100 100 20 red");
    run(d, "create rect box 200 80 60 60 #3366ff");
    run(d, "group markers c1 box");

    expect(run(d, "tree")).toEqual([
      "svg (800x600)",
      "├── rect#bg     x=0 y=0 w=800 h=600 fill=#ffffff",
      '├── text#title  (20,40) "My Diagram"',
      "└── g#markers",
      "    ├── circle#c1  cx=100 cy=100 r=20 fill=red",
      "    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff",
    ]);

    expect(run(d, "tree markers")).toEqual([
      "g#markers",
      "├── circle#c1  cx=100 cy=100 r=20 fill=red",
      "└── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff",
    ]);
  });

  it("shows a single shape with its parent", () => {
    const d = makeDispatcher();
    run(d, "init");
    run(d, "create circle c1 100 100 20 red");
    run(d, "create g markers");
    run(d, "addto markers c1");
    expect(run(d, "show c1")).toEqual([
      "circle#c1  parent=g#markers",
      "  cx=100 cy=100 r=20",
      "  fill=red",
    ]);
  });

  it("reports unknown commands and usage errors", () => {
    const d = makeDispatcher();
    expectError(d, "frobnicate", "unknown command: frobnicate (type 'help' for usage)");
    run(d, "init");
    expectError(d, "move r1", "usage: move <id> <dx> <dy>");
    expectError(d, "create rect", "usage: create <type> <id> [params…] [in <containerId>]");
  });
});
