import { describe, expect, it } from "vitest";
import { SEED_FILES } from "@/domain/seed";
import { buildPreview } from "./preview";

describe("buildPreview", () => {
  it("inlines assets and adds a restrictive CSP", () => {
    const html = buildPreview(SEED_FILES, "index.html");
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("--accent");
    expect(html).not.toContain('href="styles.css"');
    expect(html).not.toContain('src="main.js"');
  });

  it("prevents assets from closing their inline tag", () => {
    const files = { ...SEED_FILES, "main.js": 'var a = "</script><img src=x>";' };
    expect(buildPreview(files, "index.html")).not.toContain('"</script><img');
  });

  it("returns an empty document for unknown pages", () => {
    expect(buildPreview(SEED_FILES, "missing.html")).toBe("");
  });
});
