import { Group, Paper, Progress, Stack, Text } from "@mantine/core";
import { formatPercent } from "@/shared/utils/text";
import { LinkButton } from "@/shared/ui/link-button";

export function SubjectProgressCard({ subject }: { subject: { id: string; name: string; code: string; available: number; attempted: number; correct: number } }) {
  const accuracy = subject.attempted ? subject.correct / subject.attempted * 100 : 0;
  const accent = accuracy >= 75 ? "green" : accuracy >= 50 ? "blue" : accuracy > 0 ? "orange" : "cyan";

  return (
    <Paper className="tabler-card subject-progress-card" data-accent={accent} p="lg">
      <Stack>
        <Group justify="space-between" wrap="nowrap">
          <div style={{ minWidth: 0 }}>
            <Text fw={600} lineClamp={1}>{subject.name}</Text>
            <Text fz="xs" c="dimmed">{subject.code} · {subject.available} questions</Text>
          </div>
          <Text className="subject-accuracy" fw={700}>{formatPercent(accuracy)}</Text>
        </Group>
        <Progress value={accuracy} color={accent} />
        <Group justify="space-between">
          <Text fz="sm" c="dimmed">{subject.attempted} attempted</Text>
          <LinkButton href={`/subjects/${subject.id}`} size="xs" variant="light" color={accent}>View subject</LinkButton>
        </Group>
      </Stack>
    </Paper>
  );
}
