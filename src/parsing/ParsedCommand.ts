import { EditorError } from "../errors/EditorError.js";
import { tokenize } from "./Tokenizer.js";

/**
 * A parsed REPL line: command name, positional args and the optional
 * trailing `in <containerId>` clause used by `create`.
 */
export class ParsedCommand {
  constructor(
    readonly name: string,
    readonly args: readonly string[],
    readonly containerId: string | null
  ) {}

  /**
   * Returns null for blank lines and full-line comments (`# ...`);
   * throws only for a lexically broken line (unterminated quote).
   */
  static parse(line: string): ParsedCommand | null {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      return null;
    }
    const tokens = tokenize(trimmed);
    if (tokens.length === 0) {
      return null;
    }
    const name = tokens[0] as string;
    const rest = tokens.slice(1);
    const { args, containerId } = ParsedCommand.extractInClause(rest);
    return new ParsedCommand(name, args, containerId);
  }

  /**
   * Detects a trailing `in <id>` clause. A lone trailing `in` without a
   * follower is left in place so command-level validation reports it.
   */
  private static extractInClause(args: readonly string[]): {
    args: string[];
    containerId: string | null;
  } {
    if (args.length >= 2 && args[args.length - 2] === "in") {
      const containerId = args[args.length - 1] as string;
      return { args: args.slice(0, -2), containerId };
    }
    return { args: [...args], containerId: null };
  }
}
