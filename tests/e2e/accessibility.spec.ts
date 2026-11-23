import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { config } from "dotenv";
import { SignJWT } from "jose";

config({ path: ".env.local", quiet: true });

const VIEWPORTS = [
  { name: "320", width: 320, height: 640 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];
const SCHEMES = ["light", "dark"] as const;
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function authenticate(context: BrowserContext, baseURL: string) {
  const token = await new SignJWT({ sub: process.env.DEMO_USER })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET));
  await context.addCookies([{ name: "agent_trio_session", value: token, url: baseURL }]);
}

async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).exclude("iframe").analyze();
  const summary = violations.map((item) => ({
    id: item.id,
    targets: item.nodes.slice(0, 3).map((node) => node.target.join(" ")),
    message: item.nodes[0]?.failureSummary,
  }));
  expect(summary).toEqual([]);
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function openFirstProject(page: Page) {
  await page.goto("/");
  await page.locator('h3 a[href^="/projects/"]').first().click();
  await expect(page.getByRole("tab", { name: "Cambios" })).toBeVisible();
}

for (const viewport of VIEWPORTS) {
  for (const colorScheme of SCHEMES) {
    test.describe(`${viewport.name}px ${colorScheme}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height }, colorScheme });

      test("login", async ({ page }) => {
        await page.goto("/login");
        await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
        await expectAccessible(page);
        await expectNoHorizontalScroll(page);
      });

      test("portfolio and project workspace", async ({ page, context, baseURL }) => {
        await authenticate(context, baseURL!);
        await page.goto("/");
        await expect(page.getByRole("heading", { name: "Proyectos", level: 1 })).toBeVisible();
        await expect(page.locator('h3 a[href^="/projects/"]')).toHaveCount(3);
        await expectAccessible(page);
        await expectNoHorizontalScroll(page);

        await openFirstProject(page);
        await expectAccessible(page);
        await expectNoHorizontalScroll(page);

        await page.getByRole("tab", { name: "Cambios" }).focus();
        await page.keyboard.press("ArrowRight");
        await expect(page.getByRole("tab", { name: "Código" })).toBeFocused();
        await expect(page.getByRole("tabpanel", { name: "Código" })).toBeVisible();
        await expectAccessible(page);
        await expectNoHorizontalScroll(page);
      });
    });
  }
}

test("anonymous users are redirected and the API is protected", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  expect((await request.post("/api/runs", { data: {} })).status()).toBe(401);
  expect((await request.post("/api/engine/tick")).status()).toBe(401);
  expect((await request.get("/api/portfolio")).status()).toBe(401);
});

test("login rejects bad credentials and accepts the test user", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill("nadie");
  await page.getByLabel("Contraseña", { exact: true }).fill("incorrecta");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "incorrectos" })).toBeVisible();
  await expectAccessible(page);

  await page.getByLabel("Usuario").fill(process.env.DEMO_USER ?? "");
  await page.getByLabel("Contraseña", { exact: true }).fill(process.env.DEMO_PASSWORD ?? "");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Proyectos", level: 1 })).toBeVisible();
});

test("password visibility is toggled inside the input", async ({ page }) => {
  await page.goto("/login");
  const input = page.getByLabel("Contraseña", { exact: true });
  await expect(input).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(input).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar contraseña" }).click();
  await expect(input).toHaveAttribute("type", "password");
});

test("preview renders the generated Next.js routes", async ({ page, context, baseURL }) => {
  await authenticate(context, baseURL!);
  await openFirstProject(page);
  await page.getByRole("tab", { name: "Vista previa" }).click();
  const preview = page.frameLocator('iframe[title^="Vista previa"]');
  await expect(preview.getByRole("heading", { level: 1 })).toContainText("Panel");
  const link = preview.getByRole("navigation").getByRole("link").nth(1);
  const label = (await link.textContent()) ?? "";
  await link.click();
  await expect(page.getByLabel("Ruta")).not.toHaveValue("/");
  await expect(page.frameLocator('iframe[title^="Vista previa"]').getByRole("heading", { level: 1 })).toHaveText(label);
});

test("skip link moves focus to the main content", async ({ page }) => {
  await page.goto("/login");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});
