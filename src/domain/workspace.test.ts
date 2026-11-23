import { describe, expect, it } from "vitest";
import { LIMITS } from "./limits";
import {
  WorkspaceError,
  applyChanges,
  changedFiles,
  listRoutes,
  pagePathFromRoute,
  resolveInternalRoute,
  routeFromPagePath,
} from "./workspace";

describe("applyChanges", () => {
  it("adds and replaces files without mutating the source", () => {
    const base = { "app/page.tsx": "old" };
    const next = applyChanges(base, [
      { path: "app/page.tsx", content: "new" },
      { path: "app/contacto/page.tsx", content: "page" },
    ]);
    expect(next).toEqual({ "app/page.tsx": "new", "app/contacto/page.tsx": "page" });
    expect(base).toEqual({ "app/page.tsx": "old" });
  });

  it.each(["../x.tsx", "/app/x.tsx", "app/x.php", "app/X.tsx", "app//b.css", ".env", "index.html", "public/a.ts"])(
    "rejects %s",
    (path) => {
      expect(() => applyChanges({}, [{ path, content: "x" }])).toThrow(WorkspaceError);
    },
  );

  it("rejects empty and oversized changes", () => {
    expect(() => applyChanges({}, [])).toThrow(WorkspaceError);
    const content = "x".repeat(LIMITS.maxFileBytes + 1);
    expect(() => applyChanges({}, [{ path: "app/page.tsx", content }])).toThrow(WorkspaceError);
  });
});

describe("routes", () => {
  it("maps pages and routes", () => {
    expect(routeFromPagePath("app/page.tsx")).toBe("/");
    expect(routeFromPagePath("app/contacto/page.tsx")).toBe("/contacto");
    expect(routeFromPagePath("app/layout.tsx")).toBeNull();
    expect(pagePathFromRoute("/contacto")).toBe("app/contacto/page.tsx");
    expect(listRoutes({ "app/page.tsx": "", "app/b/page.tsx": "", "components/a.tsx": "" })).toEqual(["/", "/b"]);
  });

  it.each([
    ["/", "/contacto", "/contacto"],
    ["/", "/contacto/?a=1#b", "/contacto"],
    ["/blog", "../", "/"],
    ["/", "/", "/"],
  ])("resolves from %s to %s", (from, href, expected) => {
    expect(resolveInternalRoute(from, href)).toBe(expected);
  });

  it.each(["#top", "https://example.com", "mailto:a@example.com", "tel:600000000", "//example.com"])(
    "ignores %s",
    (href) => {
      expect(resolveInternalRoute("/", href)).toBeNull();
    },
  );
});

describe("changedFiles", () => {
  it("classifies changes", () => {
    const result = changedFiles(
      { "app/a.tsx": "1", "app/b.tsx": "2" },
      { "app/a.tsx": "1", "app/b.tsx": "3", "app/c.tsx": "4" },
    );
    expect(result.map((item) => item.change)).toEqual(["unchanged", "modified", "added"]);
  });
});
