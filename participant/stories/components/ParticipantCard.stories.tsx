import { ParticipantCard } from "app/components/ParticipantCard";
import type { ParticipantCardProps } from "app/components/ParticipantCard";
import { CardGroup } from "@trussworks/react-uswds";
export default {
  component: ParticipantCard,
  title: "Components/ParticipantCard",
};

const defaultProps: ParticipantCardProps = {
  index: 1,
  adjunctiveKey: "test:adjunctive",
  clickHandler: () => {},
  dateKey: "test:dateinput",
  dateHint: true,
  dateLegendKey: "test:dateinput.legend",
  tag: "participant",
  nameKey: "test:nameinput",
  nameLegal: true,
  namePreferred: false,
  participantKey: "test:participantcard",
  relationshipKey: "test:relationship",
};

const ParticipantCardTemplate = {
  render: (props: ParticipantCardProps) => {
    return (
      <CardGroup>
        <ParticipantCard {...props} />
      </CardGroup>
    );
  },
};

export const Default = {
  ...ParticipantCardTemplate,
  args: {
    ...defaultProps,
  },
};
