import { Card, Textarea } from "@mantine/core";

export interface JobResultProps {
  label: string;
  description: string;
  value: string;
}

const JobResult = ({ label, description, value }: JobResultProps) => {
  return (
    <>
      <Card
        radius="md"
        withBorder={true}
        shadow="xl"
        mb="md"
        sx={{
          textarea: {
            minHeight: 130,
          },
        }}
      >
        <Textarea
          label={label}
          required={false}
          description={description}
          variant="filled"
          size="md"
          value={value}
          readOnly
        />
      </Card>
    </>
  );
};

export default JobResult;
