"use client";

import { Badge, Box, Group, Paper, Progress, Stack, Table, Text, Title } from "@mantine/core";
import { IconCalendar, IconChevronRight } from "@tabler/icons-react";
import { LinkButton } from "@/shared/ui/link-button";

type RecentSession = {
  id: string;
  status: "created" | "in_progress" | "completed" | "abandoned";
  createdAt: Date;
  completedAt: Date | null;
  examName: string;
  totalQuestions: number;
  attempted: number;
};

const statusColor = (status: RecentSession["status"]) => status === "completed" ? "green" : status === "in_progress" ? "blue" : "gray";
const sessionHref = (session: RecentSession) => session.status === "completed" ? `/study/session/${session.id}/summary` : `/study/session/${session.id}`;
const formatDate = (value: Date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));

export function RecentSessions({ sessions }: { sessions: RecentSession[] }) {
  return (
    <Paper className="tabler-card" p={{ base: "md", sm: "lg" }}>
      <Group justify="space-between" mb="md"><Title order={3} fz="md">Recent sessions</Title></Group>
      {sessions.length === 0 ? <Text c="dimmed">No study sessions yet.</Text> : <>
        <Stack gap={0} hiddenFrom="sm">
          {sessions.map((session) => {
            const progress = session.totalQuestions ? session.attempted / session.totalQuestions * 100 : 0;
            return (
              <Box key={session.id} className="mobile-session-row session-status-row" data-status={session.status} py="sm">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text fw={600} lineClamp={1}>{session.examName}</Text>
                    <Group gap={5} mt={3} wrap="nowrap">
                      <IconCalendar size={13} color="var(--pm-muted)" />
                      <Text fz="xs" c="dimmed">{formatDate(session.createdAt)}</Text>
                    </Group>
                  </div>
                  <Badge variant="light" color={statusColor(session.status)}>{session.status.replace("_", " ")}</Badge>
                </Group>
                <Group gap="sm" mt="sm" wrap="nowrap">
                  <Progress value={progress} color={statusColor(session.status)} size={6} style={{ flex: 1 }} />
                  <Text fz="xs" fw={600}>{session.attempted}/{session.totalQuestions}</Text>
                  <LinkButton
                    size="compact-xs"
                    variant="subtle"
                    href={sessionHref(session)}
                    disabled={session.status === "abandoned"}
                    rightSection={<IconChevronRight size={14} />}
                  >
                    {session.status === "completed" ? "Review" : "Resume"}
                  </LinkButton>
                </Group>
              </Box>
            );
          })}
        </Stack>

        <Box visibleFrom="sm" className="data-table-wrap">
          <Table verticalSpacing="sm">
            <Table.Thead><Table.Tr><Table.Th>Exam</Table.Th><Table.Th>Progress</Table.Th><Table.Th>Status</Table.Th><Table.Th>Date</Table.Th><Table.Th /></Table.Tr></Table.Thead>
            <Table.Tbody>{sessions.map((session) => <Table.Tr key={session.id} className="session-status-row" data-status={session.status}>
              <Table.Td>{session.examName}</Table.Td>
              <Table.Td>{session.attempted}/{session.totalQuestions}</Table.Td>
              <Table.Td><Badge variant="light" color={statusColor(session.status)}>{session.status.replace("_", " ")}</Badge></Table.Td>
              <Table.Td>{formatDate(session.createdAt)}</Table.Td>
              <Table.Td><LinkButton size="xs" variant="subtle" href={sessionHref(session)} disabled={session.status === "abandoned"}>{session.status === "completed" ? "View summary" : "Resume"}</LinkButton></Table.Td>
            </Table.Tr>)}</Table.Tbody>
          </Table>
        </Box>
      </>}
    </Paper>
  );
}
