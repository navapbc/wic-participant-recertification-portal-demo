import type { i18nKey } from "~/types";
import type { ReactElement } from "react";
import { Trans } from "react-i18next";
import { ChoiceGroupInput } from "~/components/ChoiceGroupInput";
import { List } from "app/components/List";
import type {
  Choice,
  ChoiceGroupInputProps,
} from "~/components/ChoiceGroupInput";

export type AdjunctiveInputProps = Omit<
  ChoiceGroupInputProps,
  "choices" | "type" | "legendKey"
> & {
  adjunctiveKey: i18nKey;
  keyBase: string;
  values?: "yes" | "no";
  required?: boolean;
};

export const AdjunctiveInput = (props: AdjunctiveInputProps): ReactElement => {
  const { name, adjunctiveKey, legendStyle, values, required, ...rest } = props;
  const adjunctiveChoices: Choice[] = [
    {
      value: "yes",
      labelElement: <Trans i18nKey={`${adjunctiveKey}.yes`} />,
      selected: values && values == "yes",
    },
    {
      value: "no",
      labelElement: <Trans i18nKey={`${adjunctiveKey}.no`} />,
      selected: values && values == "no",
    },
  ];
  // eslint-disable-next-line  @typescript-eslint/no-unnecessary-type-assertion
  const programListKey = `${adjunctiveKey}.programs`;
  const helpElement = <List i18nKey={programListKey} type="unordered" />;
  return (
    <ChoiceGroupInput
      choices={adjunctiveChoices}
      name={name}
      type="radio"
      legendKey={`${adjunctiveKey}.label`}
      legendStyle={legendStyle}
      helpElement={helpElement}
      required={required}
      {...rest}
    />
  );
};
