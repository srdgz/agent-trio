import { describe, expect, it } from "vitest";
import { LIMITS } from "./limits";
import { WorkspaceError, applyChanges, changedFiles, resolveInternalPath } from "./workspace";

describe("applyChanges", () => {
  it("adds and replaces files without mutating the source", () => {
    const base = { "index.html": "old" };
    const next = applyChanges(base, [
      { path: "index.html", content: "new" },
      { path: "contacto.html", content: "page" },
    ]);
    expect(next).toEqual({ "index.html": "new", "contacto.html": "page" });
    expect(base).toEqual({ "index.html": "old" });
  });

  it.each(["../x.html", "/x.html", "x.php", "X.html", "a//b.css", ".env"])("rejects %s", (path) => {
    expect(() => applyChanges({}, [{ path, content: "x" }])).toThrow(WorkspaceError);
  });

  it("rejects empty and oversized changes", () => {
    expect(() => applyChanges({}, [])).toThrow(WorkspaceError);
    const content = "x".repeat(LIMITS.maxFileBytes + 1);
    expect(() => applyChanges({}, [{ path: "a.html", content }])).toThrow(WorkspaceError);
  });
});

describe("resolveInternalPath", () => {
  it.each([
    ["index.html", "contacto.html", "contacto.html"],
    ["index.html", "./contacto.html?a=1#b", "contacto.html"],
    ["blog/post.html", "../index.html", "index.html"],
    ["index.html", "/", "index.html"],
  ])("resolves from %s to %s", (from, href, expected) => {
    expect(resolveInternalPath(from, href)).toBe(expected);
  });

  it.each(["#top", "https://example.com", "mailto:a@example.com", "tel:600000000", "//example.com"])(
    "ignores %s",
    (href) => {
      expect(resolveInternalPath("index.html", href)).toBeNull();
    },
  );
});

describe("changedFiles", () => {
  it("classifies changes", () => {
    const result = changedFiles({ "a.html": "1", "b.html": "2" }, { "a.html": "1", "b.html": "3", "c.html": "4" });
    expect(result.map((item) => item.change)).toEqual(["unchanged", "modified", "added"]);
  });
});
