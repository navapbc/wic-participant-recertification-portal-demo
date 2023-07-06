// index.spec.ts - tests for the index page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// test("index has no automatically detectable accessibility errors", async ({
//   page,
// }) => {
//   await page.goto("/recertifications");
//   const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
//   expect(accessibilityScanResults.violations).toEqual([]);
// });

test("has title", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByText("WIC Demonstration Staff Portal").waitFor();
  await expect(page).toHaveScreenshot();
});
