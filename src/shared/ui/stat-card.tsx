import { Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import type { TablerIcon } from "@tabler/icons-react";

export function StatCard({ label, value, icon: Icon, color = "blue", hint }: {
  label: string;
  value: string | number;
  icon: TablerIcon;
  color?: string;
  hint?: string;
}) {
  return (
    <Paper className="tabler-card" p="md" h="100%">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Stack gap={2}>
          <Text c="dimmed" fz={11} fw={600} tt="uppercase" lts={0.4}>{label}</Text>
          <Text fz={24} lh={1.25} fw={700} lts={-0.4}>{value}</Text>
          {hint && <Text c="dimmed" fz="xs">{hint}</Text>}
        </Stack>
        <ThemeIcon size={40} radius={4} variant="light" color={color}>
          <Icon size={21} stroke={1.7} aria-hidden />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}
