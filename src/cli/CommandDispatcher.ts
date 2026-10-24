import { readFileSync, writeFileSync } from "node:fs";
import { AddToCommand } from "../commands/AddToCommand.js";
import { BackCommand } from "../commands/BackCommand.js";
import { CreateCommand } from "../commands/CreateCommand.js";
import { DeleteCommand } from "../commands/DeleteCommand.js";
import { FrontCommand } from "../commands/FrontCommand.js";
import { GroupCommand } from "../commands/GroupCommand.js";
import { MoveCommand } from "../commands/MoveCommand.js";
import { ScaleCommand } from "../commands/ScaleCommand.js";
import { SetCommand } from "../commands/SetCommand.js";
import { UngroupCommand } from "../commands/UngroupCommand.js";
import type { GroupShape } from "../core/GroupShape.js";
import { SvgDocument } from "../core/SvgDocument.js";
import { EditorError } from "../errors/EditorError.js";
import { HistoryManager } from "../history/HistoryManager.js";
import { SvgReader } from "../io/SvgReader.js";
import { SvgWriter } from "../io/SvgWriter.js";
import type { ParsedCommand } from "../parsing/ParsedCommand.js";
import { parseNumber } from "../parsing/Tokenizer.js";
import { ShapeFactory } from "../factory/ShapeFactory.js";
import { TreeRenderer } from "./TreeRenderer.js";

/**
 * Allowed by-name dispatch point #2 (command name -> handler).
 * Owns the session state: current document, its source path and history.
 */
export class CommandDispatcher {
  private document: SvgDocument | null = null;
  private sourcePath: string | null = null;
  private readonly history = new HistoryManager();
  private readonly factory = new ShapeFactory();
  private readonly renderer = new TreeRenderer();

  constructor(
    private readonly readFile: (path: string) => string = (path) => readFileSync(path, "utf8"),
    private readonly writeFile: (path: string, content: string) => void = (path, content) => {
      writeFileSync(path, content, "utf8");
    },
    private readonly svgReader = new SvgReader(),
    private readonly svgWriter = new SvgWriter()
  ) {}

  dispatch(cmd: ParsedCommand): string[] {
    switch (cmd.name) {
      case "init": return this.init(cmd.args);
      case "read": return this.read(cmd.args);
      case "save": return this.save(cmd.args);
      case "canvas": return this.canvas(cmd.args);
      case "create": return this.create(cmd);
      case "delete": return this.runEdit(cmd.args, 1, "delete <id>", (a) => new DeleteCommand(a[0] as string));
      case "move": return this.runEdit(cmd.args, 3, "move <id> <dx> <dy>", (a) => new MoveCommand(a[0] as string, a[1] as string, a[2] as string));
      case "scale": return this.runEdit(cmd.args, 2, "scale <id> <factor>", (a) => new ScaleCommand(a[0] as string, a[1] as string));
      case "set": return this.runEdit(cmd.args, 3, "set <id> <attr> <value>", (a) => new SetCommand(a[0] as string, a[1] as string, a[2] as string));
      case "group": return this.group(cmd.args);
      case "ungroup": return this.runEdit(cmd.args, 1, "ungroup <gid>", (a) => new UngroupCommand(a[0] as string));
      case "addto": return this.runEdit(cmd.args, 2, "addto <gid> <id>", (a) => new AddToCommand(a[0] as string, a[1] as string));
      case "front": return this.runEdit(cmd.args, 1, "front <id>", (a) => new FrontCommand(a[0] as string));
      case "back": return this.runEdit(cmd.args, 1, "back <id>", (a) => new BackCommand(a[0] as string));
      case "undo": return this.historyCommand(cmd.args, (doc) => this.history.undo(doc));
      case "redo": return this.historyCommand(cmd.args, (doc) => this.history.redo(doc));
      case "tree": return this.tree(cmd.args);
      case "show": return this.show(cmd.args);
      case "help": return this.help(cmd.args);
      default:
        throw new EditorError(`unknown command: ${cmd.name} (type 'help' for usage)`);
    }
  }

  private init(args: readonly string[]): string[] {
    if (args.length > 2) this.usage("init [w] [h]");
    const width = parseNumber(args[0] ?? "800");
    const height = parseNumber(args[1] ?? "600");
    this.document = new SvgDocument(width, height);
    this.sourcePath = null;
    this.history.notifyIoCommand(true);
    return [`canvas ${width}x${height} created`];
  }

  private read(args: readonly string[]): string[] {
    if (args.length !== 1) this.usage("read <file.svg>");
    const path = args[0] as string;
    let content: string;
    try {
      content = this.readFile(path);
    } catch {
      throw new EditorError(`cannot read file: ${path}`);
    }
    const result = this.svgReader.read(content);
    this.document = result.document;
    this.sourcePath = path;
    this.history.notifyIoCommand(true);
    return [...result.warnings, `read ${path} (${result.document.countElements()} elements)`];
  }

  private save(args: readonly string[]): string[] {
    if (args.length > 1) this.usage("save [file.svg]");
    const doc = this.requireDocument();
    const path = args[0] ?? this.sourcePath;
    if (path === null || path === undefined) {
      throw new EditorError("no file specified");
    }
    const content = this.svgWriter.write(doc);
    try {
      this.writeFile(path, content);
    } catch {
      throw new EditorError(`cannot write file: ${path}`);
    }
    this.history.notifyIoCommand(false);
    return [`saved to ${path} (${doc.countElements()} elements)`];
  }

  private canvas(args: readonly string[]): string[] {
    if (args.length > 2) this.usage("canvas [w] [h]");
    const doc = this.requireDocument();
    if (args.length === 0) {
      return [`canvas ${doc.width}x${doc.height}`];
    }
    if (args.length === 1) this.usage("canvas [w] [h]");
    const width = parseNumber(args[0] as string);
    const height = parseNumber(args[1] as string);
    doc.resize(width, height);
    this.history.notifyIoCommand(false);
    return [`canvas ${width}x${height} set`];
  }

  private create(cmd: ParsedCommand): string[] {
    const doc = this.requireDocument();
    if (cmd.args.length < 2) this.usage("create <type> <id> [params…] [in <containerId>]");
    const type = cmd.args[0] as string;
    const id = cmd.args[1] as string;
    const params = cmd.args.slice(2);
    return [this.history.run(new CreateCommand(this.factory, type, id, params, cmd.containerId), doc)];
  }

  private group(args: readonly string[]): string[] {
    const doc = this.requireDocument();
    if (args.length < 2) this.usage("group <newGid> <id> [id…]");
    const newId = args[0] as string;
    const members = args.slice(1);
    return [this.history.run(new GroupCommand(newId, members), doc)];
  }

  private historyCommand(args: readonly string[], invoke: (doc: SvgDocument) => string): string[] {
    if (args.length !== 0) this.usage("undo | redo");
    return [invoke(this.requireDocument())];
  }

  private tree(args: readonly string[]): string[] {
    if (args.length > 1) this.usage("tree [id]");
    const doc = this.requireDocument();
    if (args.length === 0) {
      return this.renderer.renderDocument(doc);
    }
    return this.renderer.renderShape(doc.requireShape(args[0] as string));
  }

  private show(args: readonly string[]): string[] {
    if (args.length !== 1) this.usage("show <id>");
    const doc = this.requireDocument();
    const shape = doc.requireShape(args[0] as string);
    const parentId = shape.parent === doc.root ? null : `g#${(shape.parent as GroupShape).id}`;
    return shape.detail(parentId).split("\n");
  }

  private help(args: readonly string[]): string[] {
    if (args.length !== 0) this.usage("help");
    return [
      "commands:",
      "  init [w] [h]                     create canvas (default 800x600)",
      "  read <file.svg>                  load an SVG file as current document",
      "  save [file.svg]                  save document (default: last read path)",
      "  canvas [w] [h]                   show or resize the canvas",
      "  create <type> <id> [params…] [in <gid>]",
      "                                   create rect/circle/ellipse/line/text/g",
      "  delete <id>                      delete shape (containers with subtree)",
      "  move <id> <dx> <dy>              translate shape or container",
      "  scale <id> <factor>              scale geometry uniformly",
      "  set <id> <attr> <value>          set whitelisted attribute or text",
      "  group <newGid> <id> [id…]        collect shapes into a new container",
      "  ungroup <gid>                    lift children to the container's parent",
      "  addto <gid> <id>                 move shape into container as last child",
      "  front <id> | back <id>           change z-order among siblings",
      "  tree [id]                        show structure tree with inline attrs",
      "  show <id>                        show attribute detail of one shape",
      "  undo | redo                      edit history (display commands skip)",
      "  help                             show this help",
      "  exit | quit                      leave the editor",
    ];
  }

  private runEdit(
    args: readonly string[],
    expected: number,
    syntax: string,
    build: (args: readonly string[]) => import("../commands/EditCommand.js").EditCommand
  ): string[] {
    const doc = this.requireDocument();
    if (args.length !== expected) this.usage(syntax);
    return [this.history.run(build(args), doc)];
  }

  private requireDocument(): SvgDocument {
    if (this.document === null) {
      throw new EditorError("no document. use 'init' or 'read' first");
    }
    return this.document;
  }

  private usage(syntax: string): never {
    throw new EditorError(`usage: ${syntax}`);
  }
}
