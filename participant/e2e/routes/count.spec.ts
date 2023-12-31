// count.spec.ts - tests for the count page
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { parseSubmissionID, validateCookie } from "../helpers/cookies";
import { parse } from "querystring";
import type { Participant } from "~/types";
import {
  fillNameForm,
  fillCountForm,
  fillParticipantForm,
} from "../helpers/formFillers";

const participantData: Omit<Participant, "adjunctive"> = {
  dob: { day: 3, year: 2004, month: 2 },
  tag: "TtmTDA5JcBAWr0tUWWmit",
  firstName: "Delightful",
  lastName: "Cheesemuffin",
  relationship: "child",
};

test("count has no automatically detectable accessibility errors", async ({
  page,
}) => {
  await page.goto("/gallatin/recertify/count");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("has title", async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  // Expect a title "to contain" a correct app title.
  await expect(page).toHaveTitle(/Who in your household is recertifying?/);
  await expect(page).toHaveScreenshot();
});

// This page should set a cookie
test("the count page sets a cookie", async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  const cookies = await page.context().cookies();
  expect(cookies).toHaveLength(1);
  await validateCookie(cookies[0]);
});

test(`the count form submits a POST request, and on return to the page,
      a GET request that repopulates the form`, async ({ page }) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  const cookies = await page.context().cookies();
  const submissionID = await parseSubmissionID(cookies[0]);

  // Fill in the form with basic answers and test that the screenshot for the filled out form matches
  await page.getByTestId("textInput").fill("2");
  await expect(page).toHaveScreenshot({ fullPage: true });

  // Catch the POST request to the API with the form data while we click "Continue"
  const [postRequest] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(
            "count?_data=routes%2F%24localAgency%2Frecertify%2Fcount"
          ) && response.status() === 204,
      { timeout: 2000 }
    ),
    await page.getByTestId("button").click(),
  ]);

  // Test that the submitted JSON matches the form state
  const postedData = postRequest.request().postData() || "";
  const parsedPostData = parse(postedData);
  expect(postRequest.request().method()).toBe("POST");
  expect(parsedPostData).toMatchObject({
    __rvfInternalFormId: "householdSizeForm",
    householdSize: "2",
  });

  // Check that we've moved to the Details page based on our count, with 2 participant cards being added
  await expect(page).toHaveURL("/gallatin/recertify/details?count=2");

  // Capture the GET request when we load the /count page again by clicking "Back"
  const [getRequest] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(
            "count?_data=routes%2F%24localAgency%2Frecertify%2Fcount"
          ) && response.status() === 200,
      { timeout: 2000 }
    ),
    await page.goBack(),
  ]);
  await expect(page).toHaveURL("/gallatin/recertify/count");
  const getData = await getRequest.json();
  expect(getRequest.request().method()).toBe("GET");
  expect(getData).toMatchObject({
    __rvfInternalFormDefaults_householdSizeForm: {
      householdSize: 2,
    },
    submissionID: submissionID,
  });
  await expect(page).toHaveScreenshot({ fullPage: true });

  // This is not verifying Playwright checked the boxes, but that the form repopulates
  // from the database record created by submitting the form
  expect(await page.getByTestId("textInput").fill("2"));
});

test("the count page is editable if no participant data has been submitted even if the back button is clicked", async ({
  page,
}) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await page.getByTestId("textInput").fill("2");
  await page.getByTestId("button").click();
  await expect(page).toHaveURL("/gallatin/recertify/details?count=2");

  await page.goBack({ waitUntil: "networkidle" });
  await expect(page).toHaveScreenshot({ fullPage: true });

  await expect(page).toHaveURL("/gallatin/recertify/count");
  await page.getByTestId("textInput").fill("3");
  await page.getByTestId("button").click();
  await expect(page).toHaveURL("/gallatin/recertify/details?count=3");
});

test("the count page is not editable if participant data has been submitted", async ({
  page,
}) => {
  await fillNameForm(page, "Matt", "Gardener", "/gallatin/recertify/count");
  await fillCountForm(page, 2, "/gallatin/recertify/details?count=2");
  await fillParticipantForm(page, { ...participantData, adjunctive: "yes" }, 0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/changes");

  await page.goto("/gallatin/recertify/count", { waitUntil: "networkidle" });
  await expect(page).toHaveScreenshot({ fullPage: true });
  const householdSize = page.getByTestId("textInput");
  await expect(householdSize).toBeDisabled();
  await page.getByRole("link", { name: "Continue" }).click();
  await expect(page).toHaveURL("/gallatin/recertify/details?count=1");
});
