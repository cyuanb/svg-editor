import { describe, expect, it } from "vitest";
import { ParsedCommand } from "../../../src/parsing/ParsedCommand.js";
import { parseNumber, tokenize } from "../../../src/parsing/Tokenizer.js";

describe("tokenize", () => {
  it("splits on spaces and tabs", () => {
    expect(tokenize("init\t800  600")).toEqual(["init", "800", "600"]);
  });

  it("keeps quoted sections as single tokens", () => {
    expect(tokenize('create text t1 20 40 "My Diagram v2"')).toEqual([
      "create", "text", "t1", "20", "40", "My Diagram v2",
    ]);
  });

  it("supports quoted Chinese content with spaces", () => {
    expect(tokenize('set t1 text "处理数据 v2"')).toEqual([
      "set", "t1", "text", "处理数据 v2",
    ]);
  });

  it("treats an empty quoted string as one empty token", () => {
    expect(tokenize('set t1 text ""')).toEqual(["set", "t1", "text", ""]);
  });

  it("does not treat # inside a line as a comment", () => {
    expect(tokenize("create rect r1 0 0 1 1 #4a90d9")).toEqual([
      "create", "rect", "r1", "0", "0", "1", "1", "#4a90d9",
    ]);
  });

  it("rejects unterminated quotes", () => {
    expect(() => tokenize('set t1 text "oops')).toThrowError("unterminated quote");
  });
});

describe("parseNumber", () => {
  it("accepts integers and floats", () => {
    expect(parseNumber("42")).toBe(42);
    expect(parseNumber("-3.5")).toBe(-3.5);
  });

  it("rejects non-numeric input with the error prefix message", () => {
    expect(() => parseNumber("abc")).toThrowError("invalid number: abc");
  });
});

describe("ParsedCommand.parse", () => {
  it("returns null for blank lines and comments", () => {
    expect(ParsedCommand.parse("")).toBeNull();
    expect(ParsedCommand.parse("   ")).toBeNull();
    expect(ParsedCommand.parse("# this is a comment")).toBeNull();
  });

  it("parses name and args without an in-clause", () => {
    const cmd = ParsedCommand.parse("move r1 30 0");
    expect(cmd?.name).toBe("move");
    expect(cmd?.args).toEqual(["r1", "30", "0"]);
    expect(cmd?.containerId).toBeNull();
  });

  it("extracts the trailing in-clause", () => {
    const cmd = ParsedCommand.parse("create rect start 120 100 160 60 #4a90d9 in node1");
    expect(cmd?.name).toBe("create");
    expect(cmd?.args).toEqual(["rect", "start", "120", "100", "160", "60", "#4a90d9"]);
    expect(cmd?.containerId).toBe("node1");
  });

  it("keeps a lone trailing in for command-level validation", () => {
    const cmd = ParsedCommand.parse("create g node1 in");
    expect(cmd?.containerId).toBeNull();
    expect(cmd?.args).toEqual(["g", "node1", "in"]);
  });

  it("keeps quoted args containing the word in", () => {
    const cmd = ParsedCommand.parse('set t1 text "put it in the box"');
    expect(cmd?.args).toEqual(["t1", "text", "put it in the box"]);
  });
});
