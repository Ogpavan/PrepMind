import { Badge, Group, Paper, Progress, Stack, Text, ThemeIcon } from "@mantine/core";
import { ArrowRight, BookOpenText } from "@phosphor-icons/react/ssr";
import { formatPercent } from "@/shared/utils/text";
import { LinkButton } from "@/shared/ui/link-button";

export function SubjectProgressCard({ subject }: { subject: { id: string; name: string; code: string; available: number; attempted: number; correct: number } }) {
  const accuracy = subject.attempted ? subject.correct / subject.attempted * 100 : 0;
  const accent = accuracy >= 75 ? "green" : accuracy >= 50 ? "blue" : accuracy > 0 ? "orange" : "cyan";

  return (
    <Paper className="tabler-card subject-progress-card" data-accent={accent} p="lg" h="100%">
      <Stack gap="md" h="100%">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon className="subject-progress-icon" size={38} radius={10} variant="light" color={accent}><BookOpenText size={20} /></ThemeIcon>
            <div style={{ minWidth: 0 }}>
              <Text fw={700} lineClamp={1}>{subject.name}</Text>
              <Badge size="xs" variant="light" color="gray" mt={4}>{subject.code}</Badge>
            </div>
          </Group>
          <div className="subject-accuracy-block">
            <Text className="subject-accuracy" fw={700} fz="lg">{formatPercent(accuracy)}</Text>
            <Text fz={10} c="dimmed" ta="right">Accuracy</Text>
          </div>
        </Group>
        <div>
          <Group justify="space-between" mb={7}><Text fz="xs" c="dimmed">Performance</Text><Text fz="xs" fw={600}>{subject.correct}/{subject.attempted || 0} correct</Text></Group>
          <Progress value={accuracy} color={accent} size={7} radius="xl" />
        </div>
        <Group justify="space-between" mt="auto">
          <Text fz="xs" c="dimmed">{subject.available} questions available</Text>
          <LinkButton href={`/subjects/${subject.id}`} size="compact-xs" variant="subtle" color={accent} rightSection={<ArrowRight size={13} />}>Open</LinkButton>
        </Group>
      </Stack>
    </Paper>
  );
}
