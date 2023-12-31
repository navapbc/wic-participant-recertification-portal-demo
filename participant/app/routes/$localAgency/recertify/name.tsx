import { Button } from "@trussworks/react-uswds";
import React from "react";
import { Trans } from "react-i18next";
import { NameInput } from "app/components/NameInput";
import type { NameInputProps } from "app/components/NameInput";
import { RequiredQuestionStatement } from "~/components/RequiredQuestionStatement";
import {
  ValidatedForm,
  setFormDefaults,
  validationError,
} from "remix-validated-form";
import { representativeNameSchema } from "app/utils/validation";
import { withZod } from "@remix-validated-form/with-zod";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { Params } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { cookieParser } from "app/cookies.server";
import type { NameData } from "app/types";
import { routeFromName } from "~/utils/routing";
import {
  upsertSubmissionForm,
  findSubmissionFormData,
} from "app/utils/db.server";
import logger from "app/utils/logging.server";

const representativeNameValidator = withZod(representativeNameSchema);

export const loader: LoaderFunction = async ({
  request,
  params,
}: {
  request: Request;
  params: Params<string>;
}) => {
  const { submissionID, headers } = await cookieParser(request, params);
  const existingNameData = (await findSubmissionFormData(
    submissionID,
    "name"
  )) as NameData;
  return json(
    {
      submissionID: submissionID,
      ...setFormDefaults("representativeNameForm", {
        representative: existingNameData,
      }),
    },
    { headers: headers }
  );
};

type loaderData = Awaited<ReturnType<typeof loader>>;

export const action = async ({ request }: { request: Request }) => {
  const { submissionID } = await cookieParser(request);

  const formData = await request.formData();
  const validationResult = await representativeNameValidator.validate(formData);
  if (validationResult.error) {
    logger.debug(
      {
        location: "routes/name",
        type: "action.validation",
        validationError: validationResult.error,
        submissionID: submissionID,
      },
      "Validation error"
    );
    return validationError(validationResult.error, validationResult.data);
  }
  const parsedForm = representativeNameSchema.parse(formData);
  logger.info(
    {
      location: "routes/name",
      type: "action.submission",
      parsedForm: parsedForm,
      submissionID: submissionID,
    },
    "Got submission"
  );
  await upsertSubmissionForm(submissionID, "name", parsedForm.representative);
  const routeTarget = routeFromName(request);
  logger.info(
    {
      location: "routes/name",
      type: "action.complete",
      routeTarget: routeTarget,
      submissionID: submissionID,
    },
    "Completed name form"
  );
  return redirect(routeTarget);
};

export default function Name() {
  useLoaderData<loaderData>();
  const nameInputProps: NameInputProps = {
    id: "representative",
    nameKey: "NameInput",
    legendStyle: "srOnly",
    legal: true,
    preferred: true,
    keyBase: "representative",
  };

  return (
    <div>
      <h1>
        <Trans i18nKey="Name.title" />
      </h1>
      <RequiredQuestionStatement />
      <ValidatedForm
        validator={representativeNameValidator}
        id="representativeNameForm"
        method="post"
      >
        <NameInput {...nameInputProps} />
        <Button
          className="display-block margin-top-6"
          type="submit"
          formMethod="post"
        >
          <Trans i18nKey="Name.button" />
        </Button>
      </ValidatedForm>
    </div>
  );
}
