import { pathToFileURL } from "node:url";
import { CommandDispatcher } from "../cli/CommandDispatcher.js";
import { Repl } from "../cli/Repl.js";

export async function start(): Promise<void> {
  const dispatcher = new CommandDispatcher();
  const repl = new Repl(dispatcher);
  await repl.start();
}

const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  void start();
}
