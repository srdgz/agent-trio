import { parse } from "node-html-parser";
import { resolveInternalPath } from "@/domain/workspace";
import type { Workspace } from "@/domain/types";

export const PREVIEW_MESSAGE = "agent-trio-preview-navigate";

const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:; form-action 'none'; base-uri 'none'";

const NAVIGATION_SCRIPT = `<script>
document.addEventListener("click", function (event) {
  var target = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!target) return;
  var href = target.getAttribute("href") || "";
  if (href.charAt(0) === "#") return;
  event.preventDefault();
  parent.postMessage({ type: "${PREVIEW_MESSAGE}", href: href }, "*");
});
</script>`;

export function buildPreview(files: Workspace, page: string) {
  const source = files[page];
  if (source === undefined) return "";
  const root = parse(source, { comment: false });

  for (const link of root.querySelectorAll("link[rel=stylesheet]")) {
    const path = resolveInternalPath(page, link.getAttribute("href") ?? "");
    const css = path ? files[path] : undefined;
    if (css === undefined) link.remove();
    else link.replaceWith(`<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`);
  }

  for (const script of root.querySelectorAll("script[src]")) {
    const path = resolveInternalPath(page, script.getAttribute("src") ?? "");
    const code = path ? files[path] : undefined;
    if (code === undefined) script.remove();
    else script.replaceWith(`<script>${code.replace(/<\/script/gi, "<\\/script")}</script>`);
  }

  const meta = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
  const head = root.querySelector("head");
  if (head) head.insertAdjacentHTML("afterbegin", meta);
  else root.insertAdjacentHTML("afterbegin", meta);

  const body = root.querySelector("body");
  if (body) body.insertAdjacentHTML("beforeend", NAVIGATION_SCRIPT);
  else root.insertAdjacentHTML("beforeend", NAVIGATION_SCRIPT);

  return root.toString();
}
