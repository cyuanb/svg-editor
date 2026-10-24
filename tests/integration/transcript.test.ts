import { readFileSync } from "node:fs";
import { Readable, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { CommandDispatcher } from "../../src/cli/CommandDispatcher.js";
import { Repl } from "../../src/cli/Repl.js";

/**
 * Replays whole lab transcripts through the real REPL and compares the
 * full output byte-for-byte, prompts included. File writes go to an
 * in-memory map; reads use the real fixture files.
 */
async function replay(commands: string[]): Promise<{ output: string; files: Map<string, string> }> {
  const files = new Map<string, string>();
  const dispatcher = new CommandDispatcher(
    (path) => readFileSync(path, "utf8"),
    (path, content) => {
      files.set(path, content);
    }
  );
  const chunks: string[] = [];
  const output = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  const repl = new Repl(
    dispatcher,
    Readable.from([...commands, "exit"].map((line) => `${line}\n`)),
    output
  );
  await repl.start();
  return { output: chunks.join(""), files };
}

function transcript(blocks: string[][]): string {
  const banner = "svg-editor 0.1 — type 'help' for commands\n";
  const body = blocks.map((block) => `svg> ${block.join("\n")}\n`).join("");
  return `${banner}${body}svg> `;
}

describe("lab transcript replay", () => {
  it("session 6: demo.svg with group, undo/redo, io lock", async () => {
    const { output, files } = await replay([
      "init 800 600",
      "create rect bg 0 0 800 600 #ffffff",
      'create text title 20 40 "My Diagram"',
      "create circle c1 100 100 20 red",
      "create rect box 200 80 60 60 #3366ff",
      "group markers c1 box",
      "tree",
      "move c1 30 0",
      "undo",
      "redo",
      'set title text "My Diagram v2"',
      "undo",
      "group bad c1 markers",
      "delete box",
      "undo",
      "save demo.svg",
      "undo",
    ]);

    expect(output).toBe(
      transcript([
        ["canvas 800x600 created"],
        ["rect#bg created"],
        ["text#title created"],
        ["circle#c1 created"],
        ["rect#box created"],
        ["g#markers created with 2 children"],
        [
          "svg (800x600)",
          "├── rect#bg     x=0 y=0 w=800 h=600 fill=#ffffff",
          '├── text#title  (20,40) "My Diagram"',
          "└── g#markers",
          "    ├── circle#c1  cx=100 cy=100 r=20 fill=red",
          "    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff",
        ],
        ["circle#c1 moved to (130,100)"],
        ["circle#c1 moved back to (100,100)"],
        ["circle#c1 moved to (130,100)"],
        ['text#title updated: text="My Diagram v2"'],
        ['text#title updated: text="My Diagram"'],
        ["error: cannot group a container into its own descendant: markers"],
        ["rect#box deleted"],
        ["rect#box restored into g#markers"],
        ["saved to demo.svg (5 elements)"],
        ["error: undo not allowed after io command"],
      ])
    );

    expect(files.get("demo.svg")).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">',
        '  <rect id="bg" x="0" y="0" width="800" height="600" fill="#ffffff"/>',
        '  <text id="title" x="20" y="40">My Diagram</text>',
        '  <g id="markers">',
        '    <circle id="c1" cx="130" cy="100" r="20" fill="red"/>',
        '    <rect id="box" x="200" y="80" width="60" height="60" fill="#3366ff"/>',
        "  </g>",
        "</svg>",
        "",
      ].join("\n")
    );
  });

  it("session read: external file with a missing id and nested groups", async () => {
    const { output } = await replay([
      "read tests/fixtures/other.svg",
      "tree",
      "show c1",
    ]);

    expect(output).toBe(
      transcript([
        ["warning: assigned id rect1 to unnamed <rect>", "read tests/fixtures/other.svg (7 elements)"],
        [
          "svg (400x300)",
          "├── rect#rect1  x=0 y=0 w=400 h=300 fill=#ffffff",
          '├── text#t1     (10,290) "imported"',
          "├── circle#c1   cx=50 cy=50 r=10",
          "├── g#g1",
          "│   ├── rect#r2    x=0 y=0 w=10 h=10",
          "│   └── circle#c2  cx=5 cy=5 r=2",
          "└── ellipse#e1  cx=1 cy=2 rx=3 ry=4",
        ],
        ["circle#c1  parent=svg", "  cx=50 cy=50 r=10"],
      ])
    );
  });

  it("session 6.1 version A: flowchart with Chinese labels and in-clauses", async () => {
    const { output, files } = await replay([
      "init 800 600",
      "create g flowchart",
      "create g node1 in flowchart",
      "create rect start 120 100 160 60 #4a90d9 in node1",
      'create text start-label 155 135 "开始" in node1',
      "create g node2 in flowchart",
      "create rect process 520 100 160 60 #f5a623 in node2",
      'create text process-label 545 135 "处理数据" in node2',
      "create line arrow1 280 130 520 130 black in flowchart",
      "tree",
      "move node2 0 100",
      "undo",
      'set process-label text "处理数据 v2"',
      "save flowchart.svg",
    ]);

    expect(output).toBe(
      transcript([
        ["canvas 800x600 created"],
        ["g#flowchart created"],
        ["g#node1 created in g#flowchart"],
        ["rect#start created in g#node1"],
        ["text#start-label created in g#node1"],
        ["g#node2 created in g#flowchart"],
        ["rect#process created in g#node2"],
        ["text#process-label created in g#node2"],
        ["line#arrow1 created in g#flowchart"],
        [
          "svg (800x600)",
          "└── g#flowchart",
          "    ├── g#node1",
          "    │   ├── rect#start        x=120 y=100 w=160 h=60 fill=#4a90d9",
          '    │   └── text#start-label  (155,135) "开始"',
          "    ├── g#node2",
          "    │   ├── rect#process        x=520 y=100 w=160 h=60 fill=#f5a623",
          '    │   └── text#process-label  (545,135) "处理数据"',
          "    └── line#arrow1  (280,130) -> (520,130)",
        ],
        ["g#node2 moved by (0,100)"],
        ["g#node2 moved back by (0,-100)"],
        ['text#process-label updated: text="处理数据 v2"'],
        ["saved to flowchart.svg (8 elements)"],
      ])
    );

    expect(files.get("flowchart.svg")).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">',
        '  <g id="flowchart">',
        '    <g id="node1">',
        '      <rect id="start" x="120" y="100" width="160" height="60" fill="#4a90d9"/>',
        '      <text id="start-label" x="155" y="135">开始</text>',
        "    </g>",
        '    <g id="node2">',
        '      <rect id="process" x="520" y="100" width="160" height="60" fill="#f5a623"/>',
        '      <text id="process-label" x="545" y="135">处理数据 v2</text>',
        "    </g>",
        '    <line id="arrow1" x1="280" y1="130" x2="520" y2="130" stroke="black"/>',
        "  </g>",
        "</svg>",
        "",
      ].join("\n")
    );
  });

  it("error table conformance through the CLI", async () => {
    const { output } = await replay([
      "tree",
      "init 10 10",
      "create rect r1 0 0 1 1",
      "create rect r1 0 0 1 1",
      "move r9 1 1",
      "create rect r2 0 0 1 1 in nope",
      "create box n1 0 0 1 1 x",
      "scale r1 0",
      "set r1 cx 5",
      "create g g1",
      "ungroup g1",
    ]);

    expect(output).toBe(
      transcript([
        ["error: no document. use 'init' or 'read' first"],
        ["canvas 10x10 created"],
        ["rect#r1 created"],
        ["error: id already exists: r1"],
        ["error: no such shape: r9"],
        ["error: no such container: nope"],
        ["error: unknown shape type: box (is the plugin loaded?)"],
        ["error: scale factor must be positive"],
        ["error: unknown attribute: cx"],
        ["g#g1 created"],
        ["error: cannot ungroup top-level container: g1"],
      ])
    );
  });
});
