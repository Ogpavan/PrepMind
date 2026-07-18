import { Grid, GridCol, Group, Paper, RingProgress, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { Books as IconBooks, Clock as IconClockHour4, NotePencil as IconPencilCheck, Play as IconPlayerPlay, Sparkle as IconSparkle, Target as IconTargetArrow, TrendUp as IconTrendUp } from "@phosphor-icons/react/ssr";
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
  const { metrics } = data.progress;
  const accuracy = Math.max(0, Math.min(100, metrics.accuracy));
  const cards = [
    { label: "Questions available", value: data.availableQuestions, icon: IconBooks, color: "blue", hint: "Ready to practise" },
    { label: "Questions practised", value: metrics.uniqueQuestions, icon: IconPencilCheck, color: "cyan", hint: `${metrics.attempted} total attempts` },
    { label: "Overall accuracy", value: formatPercent(accuracy), icon: IconTargetArrow, color: "violet", hint: `${metrics.correct} correct · ${metrics.incorrect} incorrect` },
    { label: "Study time", value: formatDuration(metrics.studyTime), icon: IconClockHour4, color: "orange", hint: `${metrics.totalSessions} completed sessions` },
  ];

  return <>
    <PageHeader title="Dashboard" />

    <Paper className="tabler-card learner-dashboard-hero" p={{ base: "lg", sm: "xl" }} mb="lg">
      <Grid align="center">
        <GridCol span={{ base: 12, md: 7 }}>
          <Stack gap="md" maw={570}>
            <Group gap={7}>
              <ThemeIcon size={26} radius="xl" variant="light"><IconSparkle size={15} /></ThemeIcon>
              <Text fz={11} fw={700} c="blue.7" tt="uppercase" lts={0.55}>Your learning workspace</Text>
            </Group>
            <div>
              <Title order={2} className="learner-dashboard-title">Welcome back, {user.name?.split(" ")[0] ?? "Learner"}</Title>
              <Text c="dimmed" mt={8} maw={520}>Build momentum with a focused session, then use your results to decide what to revise next.</Text>
            </div>
            <Group gap="sm" wrap="nowrap" className="learner-dashboard-actions">
              <LinkButton href="/progress" variant="default" leftSection={<IconTrendUp size={17} />}>View progress</LinkButton>
              <LinkButton href="/study" leftSection={<IconPlayerPlay size={17} />}>Start study</LinkButton>
            </Group>
          </Stack>
        </GridCol>
        <GridCol span={{ base: 12, md: 5 }}>
          <Paper className="learner-dashboard-snapshot" p="md">
            <Group wrap="nowrap" gap="md">
              <RingProgress
                size={104}
                thickness={10}
                roundCaps
                sections={[{ value: accuracy, color: accuracy >= 70 ? "green.6" : accuracy >= 40 ? "blue.6" : "orange.6" }]}
                label={<Text ta="center" fw={700} fz={19}>{formatPercent(accuracy)}</Text>}
              />
              <Stack gap={9} style={{ flex: 1 }}>
                <div>
                  <Text fw={700}>Performance snapshot</Text>
                  <Text fz="xs" c="dimmed">Across all completed work</Text>
                </div>
                <Group gap="xl">
                  <div><Text fw={700} fz="lg">{metrics.correct}</Text><Text fz={11} c="dimmed">Correct</Text></div>
                  <div><Text fw={700} fz="lg">{metrics.totalSessions}</Text><Text fz={11} c="dimmed">Sessions</Text></div>
                </Group>
              </Stack>
            </Group>
          </Paper>
        </GridCol>
      </Grid>
    </Paper>

    <Group justify="space-between" align="flex-end" mb="md">
      <div>
        <Title order={2}>Overview</Title>
        <Text fz="sm" c="dimmed" mt={3}>Your learning activity at a glance</Text>
      </div>
    </Group>
    <Grid mb={28}>
      {cards.map((item) => <GridCol key={item.label} span={{ base: 6, md: 3 }}><StatCard {...item} /></GridCol>)}
    </Grid>

    <Stack gap={28}>
      <div>
        <Group justify="space-between" align="flex-end" mb="md">
          <div>
            <Title order={2}>Subject progress</Title>
            <Text fz="sm" c="dimmed" mt={3}>See where you are strong and what needs attention</Text>
          </div>
          <LinkButton href="/subjects" variant="subtle" size="xs">View all subjects</LinkButton>
        </Group>
        <Grid>{data.subjects.slice(0, 3).map((subject) => <GridCol key={subject.id} span={{ base: 12, md: 4 }}><SubjectProgressCard subject={subject} /></GridCol>)}</Grid>
      </div>
      <RecentSessions sessions={data.recentSessions} />
    </Stack>
  </>;
}
