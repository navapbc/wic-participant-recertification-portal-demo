import { Trans } from "react-i18next";
import type { ChangeEvent, ReactElement } from "react";

import Required from "app/components/Required";

import type { i18nKey } from "app/types";
import {
  ErrorMessage,
  Label,
  Textarea,
  TextInput,
} from "@trussworks/react-uswds";
import { useField } from "remix-validated-form";

export type TextFieldProps = {
  handleChange?: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => void;
  id: string;
  labelKey: i18nKey;
  labelClassName?: string;
  hint?: ReactElement;
  required?: boolean;
  requiredStar?: boolean;
  type?: "input" | "textarea";
  inputType:
    | "number"
    | "search"
    | "text"
    | "email"
    | "password"
    | "tel"
    | "url";
  defaultValue?: string;
  value?: string;
  className?: string;
  size?: number;
  disabled?: boolean;
};

export const TextField = (props: TextFieldProps): ReactElement => {
  const {
    handleChange,
    id,
    labelKey,
    labelClassName,
    hint,
    required,
    requiredStar = required,
    type,
    inputType,
    defaultValue,
    value,
    className,
    size,
    ...otherProps
  } = props;
  const { getInputProps, error } = useField(id);
  const TextTypeClass = type == "textarea" ? Textarea : TextInput;
  let errorProp = {};
  if (error && type == "textarea") {
    errorProp = { error: true };
  } else if (error) {
    errorProp = { validationStatus: "error" };
  }
  return (
    <>
      <Label htmlFor={id} className={labelClassName} hint={hint}>
        <Trans i18nKey={labelKey} />
        {requiredStar && <Required />}
      </Label>
      {error && <ErrorMessage id={`${id}-error-message`}>{error}</ErrorMessage>}
      <TextTypeClass
        onChange={handleChange}
        defaultValue={defaultValue}
        size={size}
        required={required}
        {...errorProp}
        {...getInputProps({
          id: id,
          type: inputType,
          value: value,
          className: className,
          ...otherProps,
        })}
      />
    </>
  );
};
