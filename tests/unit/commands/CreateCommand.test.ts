import { describe, expect, it } from "vitest";
import { CreateCommand } from "../../../src/commands/CreateCommand.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";
import { ShapeFactory } from "../../../src/factory/ShapeFactory.js";

describe("CreateCommand", () => {
  const factory = new ShapeFactory();

  it("creates a shape at the canvas root", () => {
    const doc = new SvgDocument();
    const cmd = new CreateCommand(factory, "rect", "r1", ["10", "20", "100", "50", "#eee"], null);
    expect(cmd.execute(doc)).toBe("rect#r1 created");
    expect(doc.findById("r1")?.describe()).toBe("x=10 y=20 w=100 h=50 fill=#eee");
  });

  it("creates a shape inside an existing container", () => {
    const doc = new SvgDocument();
    doc.attach(factory.create("g", "node1", []));
    const cmd = new CreateCommand(factory, "rect", "start", ["120", "100", "160", "60", "#4a90d9"], "node1");
    expect(cmd.execute(doc)).toBe("rect#start created in g#node1");
    expect(doc.requireContainer("node1").children.map((c) => c.id)).toEqual(["start"]);
  });

  it("undo removes the created shape and frees its id", () => {
    const doc = new SvgDocument();
    const cmd = new CreateCommand(factory, "circle", "c1", ["100", "100", "20"], null);
    cmd.execute(doc);
    expect(cmd.undo(doc)).toBe("circle#c1 removed");
    expect(doc.findById("c1")).toBeUndefined();
    expect(doc.countElements()).toBe(0);
  });

  it("redo re-creates the shape", () => {
    const doc = new SvgDocument();
    const cmd = new CreateCommand(factory, "circle", "c1", ["1", "2", "3"], null);
    cmd.execute(doc);
    cmd.undo(doc);
    expect(cmd.execute(doc)).toBe("circle#c1 created");
    expect(doc.findById("c1")).toBeDefined();
  });

  it("rejects duplicate ids without changing state", () => {
    const doc = new SvgDocument();
    doc.attach(factory.create("rect", "r1", ["0", "0", "1", "1"]));
    const cmd = new CreateCommand(factory, "rect", "r1", ["0", "0", "2", "2"], null);
    expect(() => cmd.execute(doc)).toThrowError("id already exists: r1");
    expect(doc.countElements()).toBe(1);
  });

  it("reports unknown types with the lab message", () => {
    const doc = new SvgDocument();
    const cmd = new CreateCommand(factory, "box", "n1", ["0", "0", "1", "1", "x"], null);
    expect(() => cmd.execute(doc)).toThrowError("unknown shape type: box (is the plugin loaded?)");
  });

  it("reports missing and non-container in targets", () => {
    const doc = new SvgDocument();
    doc.attach(factory.create("rect", "start", ["0", "0", "1", "1"]));
    const missing = new CreateCommand(factory, "g", "g1", [], "node9");
    expect(() => missing.execute(doc)).toThrowError("no such container: node9");
    const leaf = new CreateCommand(factory, "g", "g1", [], "start");
    expect(() => leaf.execute(doc)).toThrowError("not a container: start");
  });
});
