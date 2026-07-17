import {
  Grid,
  GridCol,
  Group,
  Paper,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title,
} from "@mantine/core";
import { IconCalendarStats, IconCircleCheck, IconCircleX, IconClipboardList, IconClockHour4, IconPencilCheck, IconTargetArrow } from "@tabler/icons-react";
import { requireUser } from "@/modules/identity/application/authorization";
import { examService } from "@/modules/exams/application/exam-service";
import { subjectService } from "@/modules/subjects/application/subject-service";
import { progressService } from "@/modules/progress/application/progress-service";
import { ProgressCharts } from "@/modules/progress/presentation/progress-charts";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";
import { UrlSelect } from "@/shared/ui/url-select";
import { DateRangeFilter } from "@/shared/ui/date-range-filter";
import { formatDuration, formatPercent } from "@/shared/utils/text";

export const metadata = { title: "Progress" };

export default async function ProgressPage({ searchParams }: { searchParams: Promise<{ exam?: string; subject?: string; from?: string; to?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const [progress, exams, subjectResult] = await Promise.all([
    progressService.get(user.id, { examId: params.exam, subjectId: params.subject, from: params.from, to: params.to }),
    examService.listActive(),
    subjectService.list({ pageSize: 100 }),
  ]);
  const cards = [
    { label: "Sessions", value: progress.metrics.totalSessions, icon: IconCalendarStats, color: "blue" },
    { label: "Attempted", value: progress.metrics.attempted, icon: IconPencilCheck, color: "cyan" },
    { label: "Unique questions", value: progress.metrics.uniqueQuestions, icon: IconClipboardList, color: "indigo" },
    { label: "Correct", value: progress.metrics.correct, icon: IconCircleCheck, color: "green" },
    { label: "Incorrect", value: progress.metrics.incorrect, icon: IconCircleX, color: "red" },
    { label: "Accuracy", value: formatPercent(progress.metrics.accuracy), icon: IconTargetArrow, color: "violet" },
    { label: "Study time", value: formatDuration(progress.metrics.studyTime), icon: IconClockHour4, color: "orange" },
  ];
  return <>
    <PageHeader title="Progress" description="Real performance calculated from your submitted attempts." />
    <Group mb="lg" align="flex-end">
      <UrlSelect name="exam" placeholder="All exams" data={exams.map((item) => ({ value: item.id, label: item.name }))} />
      <UrlSelect name="subject" placeholder="All subjects" data={subjectResult.items.filter((item) => !params.exam || item.examId === params.exam).map((item) => ({ value: item.id, label: item.name }))} />
      <DateRangeFilter />
    </Group>
    <Grid mb="lg">{cards.map((item) => <GridCol key={item.label} span={{ base: 12, sm: 6, lg: 3 }}><StatCard {...item} /></GridCol>)}</Grid>
    <ProgressCharts subjects={progress.subjects} daily={progress.daily} />
    <Paper className="tabler-card" p="lg" mt="lg">
      <Title order={3} fz="md" mb="md">Topic performance</Title>
      {progress.topics.length ? <div className="data-table-wrap"><Table><TableThead><TableTr><TableTh>Topic</TableTh><TableTh>Attempted</TableTh><TableTh>Correct</TableTh><TableTh>Accuracy</TableTh></TableTr></TableThead><TableTbody>{progress.topics.map((item) => <TableTr key={item.id}><TableTd>{item.label}</TableTd><TableTd>{item.attempted}</TableTd><TableTd>{item.correct}</TableTd><TableTd>{formatPercent(item.accuracy)}</TableTd></TableTr>)}</TableTbody></Table></div> : <Text c="dimmed">No topic attempts match these filters.</Text>}
    </Paper>
  </>;
}
