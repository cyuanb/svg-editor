import { EditorError } from "../errors/EditorError.js";

/** Strict decimal number: sign, digits, optional fraction and exponent. */
const NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Quote-aware tokenizer: whitespace splits tokens, double-quoted sections
 * (which may contain spaces) become a single token with quotes stripped.
 */
export function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;
  let hasToken = false;

  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      hasToken = true;
    } else if (!inQuotes && (ch === " " || ch === "\t")) {
      if (hasToken) {
        tokens.push(current);
        current = "";
        hasToken = false;
      }
    } else {
      current += ch;
      hasToken = true;
    }
  }

  if (inQuotes) {
    throw new EditorError("unterminated quote");
  }
  if (hasToken) {
    tokens.push(current);
  }
  return tokens;
}

/**
 * Parses a CLI numeric argument: integers and decimal floats are legal.
 * Empty strings, hex, Infinity and NaN are rejected.
 */
export function parseNumber(raw: string): number {
  if (!NUMBER_PATTERN.test(raw)) {
    throw new EditorError(`invalid number: ${raw}`);
  }
  return Number(raw);
}
