import { cp, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];
const from = "node_modules/@electric-sql/pglite/dist";
const roots = process.env.NETLIFY
  ? [
      ".netlify/functions-internal",
      ".netlify/functions-internal/server",
      ".netlify/functions-internal/_libs",
      ".netlify/functions-internal/server/_libs",
    ]
  : [".vercel/output/functions/__server.func/_libs"];

async function exists(path) {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
}

for (const dir of roots) {
  if (!(await exists(dir)) && !dir.endsWith("_libs")) continue;
  await mkdir(dir, { recursive: true });
  for (const file of files) {
    await cp(join(from, file), join(dir, file));
  }
}
