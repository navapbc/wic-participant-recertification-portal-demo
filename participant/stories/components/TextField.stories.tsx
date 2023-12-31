import { TextField } from "app/components/TextField";
import type { TextFieldProps } from "app/components/TextField";

export default {
  component: TextField,
  title: "Components/Input/TextField",
};

const defaultProps: TextFieldProps = {
  id: "test-text-id",
  labelKey: "test:textfield.inputbox",
  required: false,
  type: "input",
  inputType: "text",
};

const TextFieldTemplate = {
  render: (props: TextFieldProps) => {
    return <TextField {...props} />;
  },
};

export const TextInput = {
  ...TextFieldTemplate,
  args: {
    ...defaultProps,
  },
};

export const TextInputError = {
  ...TextFieldTemplate,
  args: {
    ...defaultProps,
    id: "text-field-error Example Error",
  },
};

export const TextInputWithHint = {
  ...TextFieldTemplate,
  args: {
    ...defaultProps,
    hint: (
      <div>
        <em>Helper text</em>
      </div>
    ),
  },
};

export const TextInputDefaultValue = {
  ...TextFieldTemplate,
  args: {
    ...defaultProps,
    defaultValue: "Default Value",
  },
};

export const TextInputRequired = {
  ...TextFieldTemplate,
  args: {
    ...defaultProps,
    required: true,
  },
};

export const TextInputLargeStyleRequired = {
  ...TextFieldTemplate,
  args: {
    ...defaultProps,
    required: true,
    labelClassName: "font-alt-lg",
  },
};

export const TextInputLargeStyleWithHint = {
  ...TextFieldTemplate,
  args: {
    ...defaultProps,
    labelClassName: "usa-label--large",
    hint: (
      <div>
        <em>Helper text</em>
      </div>
    ),
  },
};

export const TextArea = {
  ...TextFieldTemplate,
  args: {
    ...defaultProps,
    labelKey: "test:textfield.textarea",
    type: "textarea",
  },
};

export const TextAreaError = {
  ...TextFieldTemplate,
  args: {
    ...defaultProps,
    labelKey: "test:textfield.textarea",
    type: "textarea",
    id: "text-area-error Example Error",
  },
};
