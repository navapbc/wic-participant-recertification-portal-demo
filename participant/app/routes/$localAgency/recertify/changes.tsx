import {
  ValidatedForm,
  setFormDefaults,
  validationError,
} from "remix-validated-form";
import { withZod } from "@remix-validated-form/with-zod";
import { ChoiceGroupInput } from "app/components/ChoiceGroupInput";
import type { Choice } from "app/components/ChoiceGroupInput";
import { Button } from "@trussworks/react-uswds";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { Params } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { Trans } from "react-i18next";

import List from "app/components/List";
import RequiredQuestionStatement from "app/components/RequiredQuestionStatement";
import { cookieParser } from "app/cookies.server";
import { changesSchema } from "app/utils/validation";
import type { ChangesData, Participant } from "app/types";
import { checkRoute, routeFromChanges } from "~/utils/routing";
import {
  upsertSubmissionForm,
  findSubmissionFormData,
  fetchSubmissionData,
} from "app/utils/db.server";
import logger from "app/utils/logging.server";

const changesValidator = withZod(changesSchema);

export const loader: LoaderFunction = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID, headers } = await cookieParser(request, params);
  const submissionData = await fetchSubmissionData(submissionID);
  checkRoute(request, submissionData);
  return json(
    {
      submissionID: submissionID,
      ...setFormDefaults("changesForm", submissionData.changes as ChangesData),
    },
    { headers: headers }
  );
};

type loaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request }: { request: Request }) => {
  const { submissionID } = await cookieParser(request);
  const formData = await request.formData();
  const validationResult = await changesValidator.validate(formData);
  if (validationResult.error) {
    logger.debug(
      {
        location: "routes/changes",
        type: "action.validation",
        validationError: validationResult.error,
        submissionID: submissionID,
      },
      "Validation error"
    );
    return validationError(validationResult.error, validationResult.data);
  }
  const parsedForm = changesSchema.parse(formData);
  logger.info(
    {
      location: "routes/changes",
      type: "action.submission",
      parsedForm: parsedForm,
      submissionID: submissionID,
    },
    "Got submission"
  );
  await upsertSubmissionForm(submissionID, "changes", parsedForm);
  const participants = await findSubmissionFormData(submissionID, "details");
  const routeTarget = routeFromChanges(request, {
    changes: parsedForm,
    participant: participants as unknown as Participant[],
  });
  logger.info(
    {
      location: "routes/changes",
      type: "action.complete",
      routeTarget: routeTarget,
      submissionID: submissionID,
    },
    "Completed changes form"
  );
  return redirect(routeTarget);
};

export default function Changes() {
  useLoaderData<loaderData>();
  const idChangeHelp = (
    <List type="unordered" i18nKey="Changes.nameIdQuestion.situations" />
  );
  const ChangeChoices: Choice[] = [
    {
      value: "yes",
      labelElement: <Trans i18nKey={"Changes.yesAnswer"} />,
    },
    { value: "no", labelElement: <Trans i18nKey={"Changes.noAnswer"} /> },
  ];

  return (
    <div>
      <h1>
        <Trans i18nKey="Changes.title" />
      </h1>
      <RequiredQuestionStatement />
      <ValidatedForm
        validator={changesValidator}
        id="changesForm"
        method="post"
      >
        <ChoiceGroupInput
          name="idChange"
          type="radio"
          legendKey="Changes.nameIdQuestion.legend"
          legendStyle="large"
          helpElement={idChangeHelp}
          choices={ChangeChoices}
          required={true}
          keyBase="idChange"
        />
        <ChoiceGroupInput
          name="addressChange"
          type="radio"
          legendStyle="large"
          legendKey="Changes.moveQuestion.legend"
          choices={ChangeChoices}
          required={true}
          keyBase="addressChange"
        />
        <Button type="submit" value="submit" className="margin-top-6">
          <Trans i18nKey="Changes.button" />
        </Button>
      </ValidatedForm>
    </div>
  );
}
