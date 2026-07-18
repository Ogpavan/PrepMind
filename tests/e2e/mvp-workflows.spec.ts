import { expect, test } from "@playwright/test";
import postgres from "postgres";

async function login(page: import("@playwright/test").Page, email: string, password: string, redirectTo: string) {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(redirectTo)}`);
  await page.getByLabel("Email").fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${redirectTo.replaceAll("/", "\\/")}$`), { timeout: 30_000 });
}

test.afterAll(async () => {
  if (!process.env.DATABASE_URL) return;
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try { await sql`delete from questions where source = 'E2E test' and id not in (select question_id from attempts)`; } finally { await sql.end(); }
});

test("admin can sign in and create a valid question", async ({ page }) => {
  await login(page, "admin@prepmind.local", "Admin@12345", "/admin/dashboard");
  await page.getByRole("link", { name: "Questions" }).click();
  await page.getByRole("link", { name: "New question" }).click();
  await page.getByTestId("question-subject").click();
  await page.getByRole("option").first().click();
  await page.getByTestId("question-topic").click();
  await page.getByRole("option").first().click();
  await page.getByRole("textbox", { name: /Question/ }).fill(`E2E arithmetic check ${Date.now()}?`);
  await page.getByRole("textbox", { name: /Option 1/ }).fill("Correct option");
  await page.getByRole("textbox", { name: /Option 2/ }).fill("Incorrect option");
  await page.getByLabel("Explanation").fill("Created by the rollback-safe browser workflow.");
  await page.getByLabel("Source").fill("E2E test");
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(page).toHaveURL(/\/admin\/questions\/[0-9a-f-]+$/, { timeout: 30_000 });
  await expect(page.getByText("Classification", { exact: true })).toBeVisible({ timeout: 20_000 });
});

test("student completes a session and sees summary and progress", async ({ page }) => {
  await login(page, "student@prepmind.local", "Student@12345", "/dashboard");
  await page.getByRole("link", { name: "Study", exact: true }).click();
  await page.getByTestId("study-subject").click();
  await page.getByRole("option").first().click();
  await page.getByLabel("Number of questions").fill("1");
  await page.getByRole("button", { name: "Start session", exact: true }).click();
  await expect(page).toHaveURL(/\/study\/session\/[0-9a-f-]+$/, { timeout: 30_000 });
  await expect(page.locator(".app-header")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toHaveCount(0);
  await expect(page.getByText(/Question 1 of 1/)).toBeVisible({ timeout: 20_000 });
  await page.locator('[role="button"]').filter({ has: page.locator('input[type="radio"]') }).first().click();
  await expect(page.getByText(/Correct answer|Not quite/)).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Finish session" }).click();
  await expect(page.getByRole("heading", { name: "Session summary" })).toBeVisible({ timeout: 20_000 });
  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Progress" })).toBeVisible({ timeout: 20_000 });
});

test("student cannot access admin routes", async ({ page }) => {
  await login(page, "student@prepmind.local", "Student@12345", "/dashboard");
  await page.goto("/admin/questions");
  await expect(page).toHaveURL(/\/forbidden/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
});
