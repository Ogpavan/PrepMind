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
    <Paper className="tabler-card stat-card" data-accent={color} p="md" h="100%">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Stack gap={2} style={{ minWidth: 0 }}>
          <Text c="dimmed" fz={11} fw={600} tt="uppercase" lts={0.4}>{label}</Text>
          <Text className="stat-card-value" fz={24} lh={1.25} fw={700} lts={-0.4}>{value}</Text>
          {hint && <Text c="dimmed" fz="xs">{hint}</Text>}
        </Stack>
        <ThemeIcon className="stat-card-icon" size={40} radius={4} variant="light" color={color}>
          <Icon size={21} stroke={1.7} aria-hidden />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}
