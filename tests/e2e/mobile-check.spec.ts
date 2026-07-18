import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

async function login(page: import("@playwright/test").Page, email: string, password: string, redirectTo: string) {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(redirectTo)}`);
  await page.getByLabel("Email").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${redirectTo.replaceAll("/", "\\/")}$`), { timeout: 30_000 });
}

test("admin mobile navigation", async ({ page }) => {
  await login(page, "admin@prepmind.local", "Admin@12345", "/admin/dashboard");
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await page.getByRole("button", { name: "More navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("link", { name: "Subjects", exact: true })).toBeVisible();
});

test("student mobile navigation", async ({ page }) => {
  await login(page, "student@prepmind.local", "Student@12345", "/dashboard");
  const navigation = page.getByRole("navigation", { name: "Primary navigation" });
  const study = page.getByRole("link", { name: "Study", exact: true });
  await expect(navigation).toBeVisible();
  await expect(study).toBeVisible();
  await expect(study).toHaveClass(/mobile-bottom-nav-item-study/);

  const links = navigation.getByRole("link");
  await expect(links.nth(2)).toHaveText("Study");
  await expect(study.locator(".mobile-nav-icon")).toHaveCSS("background-color", "rgb(32, 107, 196)");
  await expect(study.locator(".mobile-nav-icon")).toHaveCSS("color", "rgb(255, 255, 255)");
});
