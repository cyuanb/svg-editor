import { Readable, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { CommandDispatcher } from "../../../src/cli/CommandDispatcher.js";
import { Repl } from "../../../src/cli/Repl.js";

async function runSession(lines: string[]): Promise<string> {
  const dispatcher = new CommandDispatcher(
    () => {
      throw new Error("ENOENT");
    },
    () => undefined
  );
  const chunks: string[] = [];
  const output = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  const repl = new Repl(dispatcher, Readable.from([...lines, "exit"].map((line) => `${line}\n`)), output);
  await repl.start();
  return chunks.join("");
}

describe("Repl", () => {
  it("prints the banner and prompt, then processes commands until exit", async () => {
    const output = await runSession(["init 400 200", "tree"]);
    expect(output).toContain("svg-editor 0.1 — type 'help' for commands");
    expect(output).toContain("svg> canvas 400x200 created");
    expect(output).toContain("svg> svg (400x200)");
    expect(output.endsWith("svg> ")).toBe(true);
  });

  it("ignores blank lines and comments", async () => {
    const output = await runSession(["# a comment", "   ", "init 100 50"]);
    expect(output).toContain("canvas 100x50 created");
    expect(output).not.toContain("comment");
  });

  it("prints errors with the unified prefix", async () => {
    const output = await runSession(["create rect r 0 0 1 1"]);
    expect(output).toContain("svg> error: no document. use 'init' or 'read' first");
  });

  it("supports quit as an alias for exit", async () => {
    const output = await runSession(["quit"]);
    expect(output).toContain("svg-editor 0.1");
  });
});
