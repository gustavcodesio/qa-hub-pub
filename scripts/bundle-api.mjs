import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  absWorkingDir: projectRoot,
  entryPoints: ["server/vercel-handler.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "api/index.js",
  packages: "external",
  logLevel: "info",
});
