import { mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const modules = join(root, "node_modules");

await build({
  entryPoints: [join(root, "src/preview-runtime/index.ts")],
  outfile: join(root, "public/preview-runtime.js"),
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  legalComments: "none",
  define: { "process.env.NODE_ENV": '"production"' },
});

const libs = {};
const typescriptLib = join(realpathSync(join(modules, "typescript")), "lib");
for (const file of readdirSync(typescriptLib)) {
  if (/^lib\.(es|decorators|dom)[a-z0-9.]*\.d\.ts$/.test(file) && !file.includes("asynciterable")) {
    libs[`/lib/${file}`] = readFileSync(join(typescriptLib, file), "utf8");
  }
}

const reactTypes = realpathSync(join(modules, "@types/react"));
for (const file of ["index.d.ts", "global.d.ts", "jsx-runtime.d.ts", "jsx-dev-runtime.d.ts"]) {
  libs[`/node_modules/@types/react/${file}`] = readFileSync(join(reactTypes, file), "utf8");
}
libs["/node_modules/csstype/index.d.ts"] = readFileSync(
  join(reactTypes, "..", "..", "csstype", "index.d.ts"),
  "utf8",
);

mkdirSync(join(root, "src/generated"), { recursive: true });
writeFileSync(join(root, "src/generated/typecheck-libs.json"), JSON.stringify(libs));
