import { describe, expect, it } from "vitest";
import { CircleShape } from "../../../src/core/CircleShape.js";
import { GroupShape } from "../../../src/core/GroupShape.js";
import { RectShape } from "../../../src/core/RectShape.js";
import { SvgDocument } from "../../../src/core/SvgDocument.js";

describe("SvgDocument", () => {
  it("defaults to 800x600 and resizes", () => {
    const doc = new SvgDocument();
    expect(doc.width).toBe(800);
    expect(doc.height).toBe(600);
    doc.resize(400, 300);
    expect(doc.width).toBe(400);
    expect(doc.height).toBe(300);
  });

  it("indexes attached shapes including nested descendants", () => {
    const doc = new SvgDocument();
    const group = new GroupShape("g1");
    const rect = new RectShape("r2", 0, 0, 10, 10);
    const circle = new CircleShape("c2", 5, 5, 2);

    doc.attach(group);
    doc.attach(rect, group);
    doc.attach(circle, group);

    expect(doc.findById("g1")).toBe(group);
    expect(doc.findById("r2")).toBe(rect);
    expect(doc.findById("c2")).toBe(circle);
    expect(doc.countElements()).toBe(3);
    expect(rect.parent).toBe(group);
  });

  it("rejects duplicate ids with the lab error message", () => {
    const doc = new SvgDocument();
    doc.attach(new RectShape("r1", 0, 0, 1, 1));
    expect(() => doc.attach(new CircleShape("r1", 0, 0, 1))).toThrowError(
      "id already exists: r1"
    );
  });

  it("rejects duplicates inside an incoming subtree", () => {
    const doc = new SvgDocument();
    const group = new GroupShape("g1");
    group.children.push(new RectShape("dup", 0, 0, 1, 1), new CircleShape("dup", 0, 0, 1));
    expect(() => doc.attach(group)).toThrowError("id already exists: dup");
    expect(doc.countElements()).toBe(0);
  });

  it("detach removes the whole subtree from the index and re-attach restores it", () => {
    const doc = new SvgDocument();
    const group = new GroupShape("g1");
    const rect = new RectShape("r2", 0, 0, 10, 10);
    doc.attach(group);
    doc.attach(rect, group);

    doc.detach(group);
    expect(doc.findById("g1")).toBeUndefined();
    expect(doc.findById("r2")).toBeUndefined();
    expect(doc.countElements()).toBe(0);
    expect(group.parent).toBeNull();

    doc.attach(group);
    expect(doc.countElements()).toBe(2);
    expect(doc.findById("r2")).toBe(rect);
  });

  it("requireShape and requireContainer produce lab errors", () => {
    const doc = new SvgDocument();
    expect(() => doc.requireShape("nope")).toThrowError("no such shape: nope");
    expect(() => doc.requireContainer("nope")).toThrowError("no such container: nope");
    doc.attach(new RectShape("r1", 0, 0, 1, 1));
    expect(() => doc.requireContainer("r1")).toThrowError("not a container: r1");
  });

  it("reserves the canvas root id", () => {
    const doc = new SvgDocument();
    expect(() => doc.assertUniqueId("__canvas__")).toThrowError(
      "id already exists: __canvas__"
    );
  });
});
