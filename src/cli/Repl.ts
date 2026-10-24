import { createInterface } from "node:readline";
import { EditorError } from "../errors/EditorError.js";
import { ParsedCommand } from "../parsing/ParsedCommand.js";
import { CommandDispatcher } from "./CommandDispatcher.js";

export const BANNER = "svg-editor 0.1 — type 'help' for commands";
const PROMPT = "svg> ";

/** Line-oriented REPL: prompt, parse, dispatch, print; EOF or exit quits. */
export class Repl {
  constructor(
    private readonly dispatcher: CommandDispatcher,
    private readonly input: NodeJS.ReadableStream = process.stdin,
    private readonly output: NodeJS.WritableStream = process.stdout,
    private readonly banner: string = BANNER
  ) {}

  async start(): Promise<void> {
    this.output.write(`${this.banner}\n`);
    const rl = createInterface({ input: this.input, terminal: false });
    this.output.write(PROMPT);
    return new Promise<void>((resolve) => {
      rl.on("line", (line: string) => {
        const parsed = ParsedCommand.parse(line);
        if (parsed !== null && (parsed.name === "exit" || parsed.name === "quit")) {
          rl.close();
          return;
        }
        if (parsed !== null) {
          try {
            for (const outLine of this.dispatcher.dispatch(parsed)) {
              this.output.write(`${outLine}\n`);
            }
          } catch (error) {
            const message = error instanceof EditorError ? error.message : "internal error";
            this.output.write(`error: ${message}\n`);
          }
        }
        this.output.write(PROMPT);
      });
      rl.on("close", () => resolve());
    });
  }
}
