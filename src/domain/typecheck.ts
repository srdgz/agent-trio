import ts from "typescript";
import type { Workspace } from "./types";

const ROOT = "/workspace";
const MAX_DIAGNOSTICS = 5;

const NEXT_TYPES = `
declare module "next" {
  export type Metadata = { title?: string | { default: string; template?: string }; description?: string };
}
declare module "next/link" {
  import type { AnchorHTMLAttributes, ForwardRefExoticComponent, RefAttributes } from "react";
  export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string; prefetch?: boolean; replace?: boolean; scroll?: boolean;
  };
  const Link: ForwardRefExoticComponent<LinkProps & RefAttributes<HTMLAnchorElement>>;
  export default Link;
}
declare module "next/image" {
  import type { ImgHTMLAttributes } from "react";
  export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
    src: string; alt: string; fill?: boolean; priority?: boolean; quality?: number;
  };
  export default function Image(props: ImageProps): React.JSX.Element;
}
declare module "next/navigation" {
  export function useRouter(): { push(href: string): void; replace(href: string): void; refresh(): void; back(): void; forward(): void; prefetch(href: string): void };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams(): Record<string, string>;
}
declare module "*.css" {}
`;

const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  isolatedModules: true,
  esModuleInterop: true,
  types: [],
  paths: {
    "@/*": [`${ROOT}/*`],
    react: ["/node_modules/@types/react/index.d.ts"],
    "react/jsx-runtime": ["/node_modules/@types/react/jsx-runtime.d.ts"],
    "react/jsx-dev-runtime": ["/node_modules/@types/react/jsx-dev-runtime.d.ts"],
    csstype: ["/node_modules/csstype/index.d.ts"],
  },
};

let libraries: Record<string, string> | undefined;

async function loadLibraries() {
  if (!libraries) {
    const generated = await import("@/generated/typecheck-libs.json");
    libraries = generated.default as Record<string, string>;
  }
  return libraries;
}

export async function typecheckWorkspace(files: Workspace) {
  const libs = await loadLibraries();
  const virtual = new Map<string, string>(Object.entries(libs));
  virtual.set(`${ROOT}/next-env.d.ts`, NEXT_TYPES);
  for (const [path, content] of Object.entries(files)) {
    if (/\.tsx?$/.test(path)) virtual.set(`${ROOT}/${path}`, content);
  }

  const sources = new Map<string, ts.SourceFile | undefined>();
  const host: ts.CompilerHost = {
    fileExists: (path) => virtual.has(path),
    readFile: (path) => virtual.get(path),
    directoryExists: () => true,
    getDirectories: () => [],
    getCanonicalFileName: (path) => path,
    getCurrentDirectory: () => ROOT,
    getDefaultLibFileName: () => "/lib/lib.es2022.d.ts",
    getDefaultLibLocation: () => "/lib",
    getNewLine: () => "\n",
    useCaseSensitiveFileNames: () => true,
    writeFile: () => undefined,
    getSourceFile(path, languageVersion) {
      if (!sources.has(path)) {
        const content = virtual.get(path);
        sources.set(path, content === undefined ? undefined : ts.createSourceFile(path, content, languageVersion, true));
      }
      return sources.get(path);
    },
  };

  const rootNames = [...virtual.keys()].filter((path) => path.startsWith(`${ROOT}/`));
  const program = ts.createProgram({ rootNames, options: COMPILER_OPTIONS, host });

  return ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .slice(0, MAX_DIAGNOSTICS)
    .map((diagnostic) => {
      const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
      if (!diagnostic.file || diagnostic.start === undefined) return text;
      const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      return `${diagnostic.file.fileName.replace(`${ROOT}/`, "")}:${line + 1} ${text}`;
    });
}
