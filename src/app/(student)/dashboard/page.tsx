import { Grid, GridCol, Group, Stack } from "@mantine/core";
import { IconBooks, IconCircleCheck, IconCircleX, IconClockHour4, IconPencilCheck, IconPlayerPlay, IconTargetArrow } from "@tabler/icons-react";
import { requireUser } from "@/modules/identity/application/authorization";
import { dashboardService } from "@/modules/progress/application/dashboard-service";
import { SubjectProgressCard } from "@/modules/progress/presentation/subject-progress-card";
import { RecentSessions } from "@/modules/study/presentation/recent-sessions";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";
import { formatDuration, formatPercent } from "@/shared/utils/text";
import { LinkButton } from "@/shared/ui/link-button";

export const metadata = { title: "Dashboard" };

export default async function StudentDashboardPage() {
  const user = await requireUser();
  const data = await dashboardService.student(user.id);
  const cards = [
    { label: "Questions available", value: data.availableQuestions, icon: IconBooks, color: "blue" },
    { label: "Questions attempted", value: data.progress.metrics.attempted, icon: IconPencilCheck, color: "cyan" },
    { label: "Correct", value: data.progress.metrics.correct, icon: IconCircleCheck, color: "green" },
    { label: "Incorrect", value: data.progress.metrics.incorrect, icon: IconCircleX, color: "red" },
    { label: "Overall accuracy", value: formatPercent(data.progress.metrics.accuracy), icon: IconTargetArrow, color: "violet" },
    { label: "Study time", value: formatDuration(data.progress.metrics.studyTime), icon: IconClockHour4, color: "orange" },
  ];

  return <>
    <PageHeader
      title={`Welcome back, ${user.name?.split(" ")[0] ?? "Learner"}`}
      actions={<LinkButton href="/study" leftSection={<IconPlayerPlay size={16} />} visibleFrom="sm">Start study session</LinkButton>}
    />
    <Grid mb="lg">
      {cards.map((item) => <GridCol key={item.label} span={{ base: 6, sm: 6, lg: 4 }}><StatCard {...item} /></GridCol>)}
    </Grid>
    <Stack gap="lg">
      <div>
        <Group justify="space-between" mb="md">
          <h2 style={{ fontSize: 18, margin: 0 }}>Subject progress</h2>
          <LinkButton href="/subjects" variant="subtle" size="xs">View all</LinkButton>
        </Group>
        <Grid>{data.subjects.slice(0, 3).map((subject) => <GridCol key={subject.id} span={{ base: 12, md: 4 }}><SubjectProgressCard subject={subject} /></GridCol>)}</Grid>
      </div>
      <RecentSessions sessions={data.recentSessions} />
    </Stack>
  </>;
}
