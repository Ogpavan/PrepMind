import {
  Badge,
  Grid,
  GridCol,
  Group,
  Paper,
  Progress,
  RingProgress,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTr,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconBooks,
  IconCertificate,
  IconCircleCheck,
  IconClipboardList,
  IconHierarchy3,
  IconPencilCheck,
  IconReportAnalytics,
  IconUsersGroup,
} from "@tabler/icons-react";
import { LinkButton } from "@/shared/ui/link-button";
import { PageHeader } from "@/shared/ui/page-header";

type DashboardData = {
  totalQuestions: number;
  activeQuestions: number;
  totalExams: number;
  totalSubjects: number;
  totalTopics: number;
  totalStudents: number;
  attemptedToday: number;
  averageAccuracy: number;
  recentQuestions: Array<{ id: string; prompt: string; difficulty: string; subjectName: string }>;
  recentActivity: Array<{ id: string; learnerName: string; prompt: string; isCorrect: boolean | null; isSkipped: boolean }>;
};

function MetricTile({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof IconBooks; color: string }) {
  return (
    <Paper className="tabler-card" p="md" h="100%">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Text fz={11} fw={600} c="dimmed" tt="uppercase" lts={0.4}>{label}</Text>
          <Text fz={25} fw={650} lh={1.2} lts={-0.45}>{value}</Text>
        </Stack>
        <ThemeIcon size={38} radius={4} variant="light" color={color}>
          <Icon size={20} stroke={1.7} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

export function AdminDashboardView({ data, userName }: { data: DashboardData; userName: string }) {
  const activeRate = data.totalQuestions ? data.activeQuestions / data.totalQuestions * 100 : 0;
  const accuracy = Math.max(0, Math.min(100, data.averageAccuracy));

  return <>
    <PageHeader
      title="Dashboard"
      actions={<>
        <LinkButton href="/admin/questions" variant="default" leftSection={<IconClipboardList size={16} />} visibleFrom="sm">Question bank</LinkButton>
        <LinkButton href="/admin/questions/new" leftSection={<IconPencilCheck size={16} />}>Create question</LinkButton>
      </>}
    />

    <Grid mb="md" align="stretch">
      <GridCol span={{ base: 12, lg: 6 }}>
        <Paper className="tabler-card dashboard-welcome-card" p="lg" h="100%" mih={234}>
          <Group justify="space-between" align="stretch" h="100%" wrap="nowrap">
            <Stack justify="space-between" gap="xl" style={{ flex: 1 }}>
              <div>
                <Title order={2} fz={20} lts={-0.3}>Welcome back, {userName}</Title>
                <Text c="dimmed" mt={6} maw={390}>Your question bank is ready for today’s learner activity.</Text>
              </div>
              <Group gap="xl">
                <div>
                  <Text fz={11} c="dimmed" fw={600} tt="uppercase" lts={0.35}>Configured exams</Text>
                  <Text fw={650} fz={18}>{data.totalExams}</Text>
                </div>
                <div>
                  <Text fz={11} c="dimmed" fw={600} tt="uppercase" lts={0.35}>Learners</Text>
                  <Text fw={650} fz={18}>{data.totalStudents}</Text>
                </div>
              </Group>
            </Stack>
            <ThemeIcon className="dashboard-hero-mark" size={128} radius={999} variant="light" color="blue" visibleFrom="sm">
              <IconReportAnalytics size={66} stroke={1.25} />
            </ThemeIcon>
          </Group>
        </Paper>
      </GridCol>

      <GridCol span={{ base: 12, sm: 6, lg: 3 }}>
        <Paper className="tabler-card" p="lg" h="100%" mih={234}>
          <Stack h="100%" justify="space-between">
            <div>
              <Text fz={11} fw={600} c="dimmed" tt="uppercase" lts={0.4}>Total questions</Text>
              <Group align="baseline" gap="xs" mt={2}>
                <Text fz={28} fw={650} lts={-0.6}>{data.totalQuestions}</Text>
                <Text fz="sm" c="green.7" fw={600}>{Math.round(activeRate)}% active</Text>
              </Group>
              <Text c="dimmed" fz="sm" mt={6}>{data.activeQuestions} questions available to learners</Text>
            </div>
            <div>
              <Group justify="space-between" mb={7}><Text fz="xs" c="dimmed">Publishing coverage</Text><Text fz="xs" fw={600}>{Math.round(activeRate)}%</Text></Group>
              <Progress value={activeRate} size="sm" />
            </div>
          </Stack>
        </Paper>
      </GridCol>

      <GridCol span={{ base: 12, sm: 6, lg: 3 }}>
        <Paper className="tabler-card" p="lg" h="100%" mih={234}>
          <Stack align="center" gap={2}>
            <Text fz={11} fw={600} c="dimmed" tt="uppercase" lts={0.4} w="100%">Today’s accuracy</Text>
            <RingProgress
              size={150}
              thickness={15}
              roundCaps
              sections={[{ value: accuracy, color: "blue.6" }]}
              label={<Stack gap={0} align="center"><Text fz={25} fw={650}>{Math.round(accuracy)}%</Text><Text fz={11} c="dimmed">accuracy</Text></Stack>}
            />
          </Stack>
        </Paper>
      </GridCol>
    </Grid>

    <Grid mb="md">
      {[
        { label: "Total subjects", value: data.totalSubjects, icon: IconBooks, color: "cyan" },
        { label: "Topic hierarchy", value: data.totalTopics, icon: IconHierarchy3, color: "violet" },
        { label: "Active questions", value: data.activeQuestions, icon: IconCircleCheck, color: "green" },
        { label: "Attempted today", value: data.attemptedToday, icon: IconPencilCheck, color: "teal" },
      ].map((item) => <GridCol key={item.label} span={{ base: 12, sm: 6, lg: 3 }}><MetricTile {...item} /></GridCol>)}
    </Grid>

    <Grid>
      <GridCol span={{ base: 12, xl: 6 }}>
        <Paper className="tabler-card" p="lg" h="100%">
          <Group justify="space-between" mb="md"><Title order={3} fz="md">Recent questions</Title><IconCertificate size={19} color="var(--pm-muted)" /></Group>
          {data.recentQuestions.length ? <Table verticalSpacing="sm"><TableTbody>{data.recentQuestions.map((item) => <TableTr key={item.id}><TableTd><Text lineClamp={1} fw={500}>{item.prompt}</Text><Text fz="xs" c="dimmed">{item.subjectName}</Text></TableTd><TableTd><Badge variant="light">{item.difficulty}</Badge></TableTd></TableTr>)}</TableTbody></Table> : <Text c="dimmed">No questions yet.</Text>}
        </Paper>
      </GridCol>
      <GridCol span={{ base: 12, xl: 6 }}>
        <Paper className="tabler-card" p="lg" h="100%">
          <Group justify="space-between" mb="md"><Title order={3} fz="md">Recent learner activity</Title><IconUsersGroup size={19} color="var(--pm-muted)" /></Group>
          {data.recentActivity.length ? <Table verticalSpacing="sm"><TableTbody>{data.recentActivity.map((item) => <TableTr key={item.id}><TableTd><Text fw={500}>{item.learnerName}</Text><Text fz="xs" c="dimmed" lineClamp={1}>{item.prompt}</Text></TableTd><TableTd><Badge color={item.isSkipped ? "gray" : item.isCorrect ? "green" : "red"} variant="light">{item.isSkipped ? "Skipped" : item.isCorrect ? "Correct" : "Incorrect"}</Badge></TableTd></TableTr>)}</TableTbody></Table> : <Text c="dimmed">No learner attempts yet.</Text>}
        </Paper>
      </GridCol>
    </Grid>
  </>;
}
