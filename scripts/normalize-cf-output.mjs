import { readFile, writeFile } from "node:fs/promises";

const path = ".cloudflare/output/v0/workers/md-jooo-sh-api/worker.config.json";
const config = JSON.parse(await readFile(path, "utf8"));

// cf 0.4's Build Output parser does not yet accept Wrangler's root `type` key.
delete config.type;

await writeFile(path, `${JSON.stringify(config)}\n`);
