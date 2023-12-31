import type { ReactElement } from "react";
import type { Participant, i18nKey, legendStyleType } from "~/types";

import { Trans, useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from "@trussworks/react-uswds";
import { RelationshipInput } from "~/components/RelationshipInput";
import type { RelationshipInputProps } from "app/components/RelationshipInput";
import { NameInput } from "app/components/NameInput";
import type { NameInputProps } from "app/components/NameInput";
import { DateInput } from "app/components/DateInput";
import type { DateInputProps } from "app/components/DateInput";
import { AdjunctiveInput } from "~/components/AdjunctiveInput";
import type { AdjunctiveInputProps } from "~/components/AdjunctiveInput";
import { pick } from "lodash";

export type ParticipantCardProps = {
  index: number;

  adjunctiveKey: i18nKey;
  adjunctiveLegendStyle?: legendStyleType;
  adjunctiveRequired?: boolean;

  clickHandler: Function;
  dateKey: i18nKey;
  dateLegendKey: i18nKey;
  dateLegendStyle?: legendStyleType;
  dateHint?: boolean;
  dateDMYOrder?: boolean;
  dateRequired?: boolean;

  tag: string;

  nameKey: i18nKey;
  nameLegal?: boolean;
  namePreferred?: boolean;

  participantHeaderClassName?: string;
  participantKey: i18nKey;

  relationshipKey: i18nKey;
  relationshipRequired?: boolean;
  values?: Participant;
};

export const ParticipantCard = (props: ParticipantCardProps): ReactElement => {
  const {
    index,
    adjunctiveKey,
    adjunctiveLegendStyle = "default",
    adjunctiveRequired,
    clickHandler,
    dateKey,
    dateLegendKey,
    dateLegendStyle,
    dateHint,
    dateDMYOrder,
    dateRequired,
    tag,
    nameKey,
    nameLegal,
    namePreferred,
    participantHeaderClassName,
    participantKey,
    relationshipKey,
    relationshipRequired,
    values,
  } = props;

  const relationshipProps: RelationshipInputProps = {
    relationshipKey: relationshipKey,
    legendKey: `${relationshipKey}.label`,
    name: `participant[${index}].relationship`,
    required: relationshipRequired,
    keyBase: `${tag}-relationship`,
    values: values?.relationship,
  };
  const nameProps: NameInputProps = {
    id: `participant[${index}]`,
    nameKey: nameKey,
    legendStyle: "srOnly",
    legal: nameLegal,
    preferred: namePreferred,
    keyBase: `${tag}-name`,
    values: pick(values, ["firstName", "lastName", "preferredName"]),
  };
  const dateProps: DateInputProps = {
    id: `participant-${index}-dob`,
    name: `participant[${index}].dob`,
    keyBase: `${tag}-dob`,
    dateKey: dateKey,
    legendKey: dateLegendKey,
    legendStyle: dateLegendStyle,
    DMYorder: dateDMYOrder,
    hint: dateHint,
    required: dateRequired,
    values: values?.dob,
  };
  const adjunctiveProps: AdjunctiveInputProps = {
    name: `participant[${index}].adjunctive`,
    adjunctiveKey: adjunctiveKey,
    legendStyle: adjunctiveLegendStyle,
    required: adjunctiveRequired,
    keyBase: `${tag}-adjunctive`,
    values: values?.adjunctive,
  };
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <h2
          className={`usa-card__heading ${
            participantHeaderClassName || ""
          }`.trim()}
        >
          <Trans i18nKey={`${participantKey}.cardHeader`} /> {index + 1}
        </h2>
      </CardHeader>
      <CardBody>
        <RelationshipInput {...relationshipProps} />
        <NameInput {...nameProps} />
        <DateInput {...dateProps} />
        <AdjunctiveInput {...adjunctiveProps} />
      </CardBody>
      <CardFooter>
        <input type="hidden" name={`participant[${index}].tag`} value={tag} />
        <button
          type="button"
          name="remove_participant"
          value={tag}
          className="text-secondary-vivid usa-button--unstyled"
          onClick={() => clickHandler(tag)}
        >
          {t(`${participantKey}.cardFooter`, { participantIndex: index + 1 })}
        </button>
      </CardFooter>
    </Card>
  );
};
