import { EditorError } from "../errors/EditorError.js";

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

/** Parses a CLI numeric argument (integers and floats are both legal). */
export function parseNumber(raw: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new EditorError(`invalid number: ${raw}`);
  }
  return value;
}
