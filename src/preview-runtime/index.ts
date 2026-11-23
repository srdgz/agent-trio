import * as React from "react";
import { createRoot } from "react-dom/client";
import { transform } from "sucrase";

type PreviewData = {
  files: Record<string, string>;
  route: string;
  message: string;
};

type LoadedModule = { exports: Record<string, unknown> };
type Props = Record<string, unknown> & { children?: React.ReactNode };

declare global {
  interface Window {
    __PREVIEW__: PreviewData;
  }
}

const { files, route, message } = window.__PREVIEW__;
const cache = new Map<string, LoadedModule>();

function navigate(href: string) {
  parent.postMessage({ type: message, href }, "*");
}

function isHash(href: string) {
  return href.startsWith("#");
}

function createPreviewElement(type: React.ElementType | string, props: Props | null, ...children: React.ReactNode[]) {
  if (type === "html") return React.createElement(React.Fragment, null, ...children);
  if (type === "head") return null;
  if (type === "body") return React.createElement("div", props, ...children);
  return React.createElement(type as React.ElementType, props, ...children);
}

function omit(props: Props, keys: string[]) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !keys.includes(key)));
}

function PreviewLink({ href, onClick, ...props }: Props) {
  const target = String(href ?? "");
  return React.createElement("a", {
    ...omit(props, ["prefetch", "replace", "scroll"]),
    href: target,
    onClick(event: React.MouseEvent) {
      (onClick as ((event: React.MouseEvent) => void) | undefined)?.(event);
      if (event.defaultPrevented || isHash(target)) return;
      event.preventDefault();
      navigate(target);
    },
  });
}

function PreviewImage(props: Props) {
  return React.createElement("img", omit(props, ["priority", "fill", "quality", "placeholder"]));
}

const router = {
  push: navigate,
  replace: navigate,
  refresh() {},
  back() {},
  forward() {},
  prefetch() {},
};

const externals: Record<string, Record<string, unknown>> = {
  react: { ...React, default: React },
  next: {},
  "next/link": { default: PreviewLink, __esModule: true },
  "next/image": { default: PreviewImage, __esModule: true },
  "next/navigation": {
    useRouter: () => router,
    usePathname: () => route,
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
  },
};

function resolveLocal(specifier: string, from: string) {
  const base = specifier.startsWith("@/")
    ? specifier.slice(2)
    : new URL(specifier, `https://preview.invalid/${from}`).pathname.slice(1);
  return [base, `${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`].find(
    (candidate) => candidate in files,
  );
}

function injectStyles(path: string) {
  const style = document.createElement("style");
  style.dataset.source = path;
  style.textContent = files[path];
  document.head.append(style);
}

function load(path: string): Record<string, unknown> {
  const cached = cache.get(path);
  if (cached) return cached.exports;

  const loaded: LoadedModule = { exports: {} };
  cache.set(path, loaded);

  if (path.endsWith(".css")) {
    injectStyles(path);
    return loaded.exports;
  }

  const { code } = transform(files[path], {
    transforms: ["typescript", "jsx", "imports"],
    jsxPragma: "__h",
    jsxFragmentPragma: "__Fragment",
    production: true,
    filePath: path,
  });
  const requireModule = (specifier: string) => {
    if (specifier in externals) return externals[specifier];
    const target = resolveLocal(specifier, path);
    if (!target) throw new Error(`No se encuentra ${specifier} desde ${path}`);
    return load(target);
  };
  const run = new Function("require", "module", "exports", "__h", "__Fragment", code);
  run(requireModule, loaded, loaded.exports, createPreviewElement, React.Fragment);
  return loaded.exports;
}

function defaultExport(path: string) {
  const component = load(path).default;
  if (typeof component !== "function") throw new Error(`${path} no exporta un componente`);
  return component as React.ComponentType<Props>;
}

function pagePath() {
  return route === "/" ? "app/page.tsx" : `app${route}/page.tsx`;
}

function layoutPaths(page: string) {
  const segments = page.split("/").slice(0, -1);
  return segments
    .map((_, index) => `${segments.slice(0, index + 1).join("/")}/layout.tsx`)
    .filter((path) => path in files);
}

class PreviewBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    return this.state.error ? errorView(this.state.error) : this.props.children;
  }
}

function errorView(error: unknown) {
  return React.createElement(
    "div",
    { role: "alert", style: { padding: "1.5rem", fontFamily: "system-ui", color: "#8f1d17" } },
    React.createElement("strong", null, "No se ha podido renderizar la vista previa"),
    React.createElement("p", null, error instanceof Error ? error.message : String(error)),
  );
}

document.addEventListener("click", (event) => {
  const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!anchor || event.defaultPrevented) return;
  const href = anchor.getAttribute("href") ?? "";
  if (isHash(href)) return;
  event.preventDefault();
  navigate(href);
});

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  try {
    const page = pagePath();
    const Page = defaultExport(page);
    const tree = layoutPaths(page)
      .reverse()
      .reduce<React.ReactNode>(
        (children, path) => React.createElement(defaultExport(path), null, children),
        React.createElement(Page),
      );
    root.render(React.createElement(PreviewBoundary, null, tree));
  } catch (error) {
    root.render(errorView(error));
  }
}
