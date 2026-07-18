"use client";

import { Badge, Box, Group, Paper, Progress, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { BookOpenText, CalendarBlank as IconCalendar, CaretRight as IconChevronRight } from "@phosphor-icons/react/ssr";
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
    <Paper className="tabler-card recent-sessions-card" p={{ base: "md", sm: "lg" }}>
      <Group justify="space-between" mb="md"><div><Title order={2}>Recent sessions</Title><Text fz="sm" c="dimmed" mt={3}>Continue where you left off or review completed work</Text></div></Group>
      {sessions.length === 0 ? <Text c="dimmed">No study sessions yet.</Text> : <>
        <Stack gap={0} className="recent-session-list">
          {sessions.map((session) => {
            const progress = session.totalQuestions ? session.attempted / session.totalQuestions * 100 : 0;
            return (
              <Box key={session.id} className="recent-session-item session-status-row" data-status={session.status} py="md">
                <Group align="center" wrap="nowrap" gap="md">
                  <ThemeIcon className="recent-session-icon" size={38} radius={10} variant="light" color={statusColor(session.status)}><BookOpenText size={20} /></ThemeIcon>
                  <div className="recent-session-main">
                    <Text fw={700} lineClamp={1}>{session.examName}</Text>
                    <Group gap={5} mt={4} wrap="nowrap">
                      <IconCalendar size={13} color="var(--pm-muted)" />
                      <Text fz="xs" c="dimmed">{formatDate(session.createdAt)}</Text>
                    </Group>
                  </div>
                  <Box className="recent-session-progress" visibleFrom="sm">
                    <Group justify="space-between" mb={6}><Text fz="xs" c="dimmed">Progress</Text><Text fz="xs" fw={700}>{session.attempted}/{session.totalQuestions}</Text></Group>
                    <Progress value={progress} color={statusColor(session.status)} size={6} radius="xl" />
                  </Box>
                  <Badge variant="light" color={statusColor(session.status)}>{session.status.replace("_", " ")}</Badge>
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
                <Group gap="sm" mt="sm" wrap="nowrap" hiddenFrom="sm">
                  <Progress value={progress} color={statusColor(session.status)} size={6} style={{ flex: 1 }} />
                  <Text fz="xs" fw={600}>{session.attempted}/{session.totalQuestions}</Text>
                </Group>
              </Box>
            );
          })}
        </Stack>
      </>}
    </Paper>
  );
}
