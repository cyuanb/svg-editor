import { pathToFileURL } from "node:url";

export const BANNER = "svg-editor 0.1 — type 'help' for commands";

export function start(): void {
  console.log(BANNER);
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  start();
}
