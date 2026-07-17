import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:3010", actionTimeout: 20_000, navigationTimeout: 45_000, trace: "retain-on-failure", screenshot: "only-on-failure", ...devices["Desktop Chrome"] },
  webServer: { command: "corepack pnpm dev:test", url: "http://127.0.0.1:3010/login", reuseExistingServer: false, timeout: 120_000 },
});
