import { describe, expect, it } from "vitest";
import { SEED_FILES } from "@/domain/seed";
import { buildPreview } from "./preview";

const ORIGIN = "https://agent-trio.test";

describe("buildPreview", () => {
  it("adds a restrictive CSP and the runtime", () => {
    const html = buildPreview(SEED_FILES, "/", ORIGIN);
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("form-action 'none'");
    expect(html).toContain(`${ORIGIN}/preview-runtime.js`);
    expect(html).not.toContain("connect-src");
  });

  it("prevents file contents from closing the data script", () => {
    const files = { ...SEED_FILES, "lib/data.ts": 'export const a = "</script><img src=x>";' };
    expect(buildPreview(files, "/", ORIGIN)).not.toContain("</script><img");
  });
});
