import { NameInput } from "app/components/NameInput";
import type { NameInputProps } from "app/components/NameInput";

export default {
  component: NameInput,
  title: "Components/Input/NameInput",
};

const defaultProps: NameInputProps = {
  id: "input-example",
  nameKey: "test:nameinput",
  legendStyle: "srOnly",
  keyBase: "input",
};

const NameInputTemplate = {
  render: (props: NameInputProps) => {
    return <NameInput {...props} />;
  },
};

export const Default = {
  ...NameInputTemplate,
  args: {
    ...defaultProps,
  },
};

export const Error = {
  ...NameInputTemplate,
  args: {
    ...defaultProps,
    id: "error Name Input Error",
  },
};

export const PreferredName = {
  ...NameInputTemplate,
  args: {
    ...defaultProps,
    preferred: true,
  },
};

export const VisibleLegend = {
  ...NameInputTemplate,
  args: {
    ...defaultProps,
    legendStyle: "default",
  },
};

export const PreferredNameVisibleLegend = {
  ...NameInputTemplate,
  args: {
    ...defaultProps,
    preferred: true,
    legendStyle: "default",
  },
};
