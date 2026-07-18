"use client";

import {
  Accordion,
  Badge,
  Grid,
  Group,
  Paper,
  Progress,
  RingProgress,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  CalendarBlank as IconCalendar,
  CheckCircle as IconCircleCheck,
  ClipboardText as IconClipboardList,
  Clock as IconClockHour4,
  SkipForward as IconPlayerSkipForward,
  Target as IconTargetArrow,
  Trophy as IconTrophy,
  XCircle as IconCircleX,
} from "@phosphor-icons/react/ssr";
import { StatCard } from "@/shared/ui/stat-card";
import { formatDuration, formatPercent } from "@/shared/utils/text";
import type { SessionSummaryData } from "../application/summary-service";

type Summary = SessionSummaryData;
type PerformanceRows = Summary["subjectPerformance"];

function performanceColor(accuracy: number) {
  if (accuracy >= 75) return "green";
  if (accuracy >= 50) return "blue";
  if (accuracy >= 30) return "orange";
  return "red";
}

function performanceMessage(accuracy: number) {
  if (accuracy >= 85) return "Excellent session";
  if (accuracy >= 70) return "Strong progress";
  if (accuracy >= 50) return "Good effort";
  return "Keep building momentum";
}

function PerformanceCard({ title, rows }: { title: string; rows: PerformanceRows }) {
  return (
    <Paper className="tabler-card summary-performance-card" p={{ base: "md", sm: "lg" }} h="100%">
      <Title order={3} fz="md" mb="lg">{title}</Title>
      {rows.length ? (
        <Stack gap="md">
          {rows.map((row) => {
            const color = performanceColor(row.accuracy);
            return (
              <div key={row.label}>
                <Group justify="space-between" gap="sm" wrap="nowrap" mb={6}>
                  <Text fw={600} fz="sm" lineClamp={1} tt={title === "Difficulty" ? "capitalize" : undefined}>{row.label}</Text>
                  <Text fw={700} fz="sm" c={`${color}.7`}>{formatPercent(row.accuracy)}</Text>
                </Group>
                <Progress value={row.accuracy} color={color} size={7} radius="xl" />
                <Text fz="xs" c="dimmed" mt={5}>{row.correct} of {row.attempted} correct</Text>
              </div>
            );
          })}
        </Stack>
      ) : (
        <Text c="dimmed" fz="sm">No attempted questions in this category.</Text>
      )}
    </Paper>
  );
}

export function SessionSummary({ summary }: { summary: Summary }) {
  const scoreColor = performanceColor(summary.accuracy);
  const completedOn = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    summary.session.completedAt ?? new Date(),
  );
  const metrics = [
    { label: "Questions", value: summary.total, icon: IconClipboardList, color: "blue" },
    { label: "Correct", value: summary.correct, icon: IconCircleCheck, color: "green" },
    { label: "Incorrect", value: summary.incorrect, icon: IconCircleX, color: "red" },
    { label: "Skipped", value: summary.skipped, icon: IconPlayerSkipForward, color: "gray" },
    { label: "Total time", value: formatDuration(summary.totalTime), icon: IconClockHour4, color: "cyan" },
    { label: "Avg. per question", value: formatDuration(Math.round(summary.averageTime)), icon: IconTargetArrow, color: "violet" },
  ];

  return (
    <Stack gap="lg">
      <Paper className="tabler-card session-summary-hero" p={{ base: "md", sm: "lg" }}>
        <Group align="center" gap="md" wrap="nowrap">
          <RingProgress
            size={124}
            thickness={12}
            roundCaps
            sections={[{ value: summary.accuracy, color: scoreColor }]}
            label={
              <Stack gap={0} align="center">
                <Text fz={23} fw={750} lh={1}>{formatPercent(summary.accuracy)}</Text>
                <Text fz={10} c="dimmed" tt="uppercase" fw={700} lts={0.4}>Accuracy</Text>
              </Stack>
            }
          />
          <Stack gap={7} style={{ minWidth: 0, flex: 1 }}>
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon color={scoreColor} variant="light" size={30} radius="xl">
                <IconTrophy size={17} />
              </ThemeIcon>
              <Title order={2} fz={{ base: 18, sm: 22 }} lineClamp={1}>{performanceMessage(summary.accuracy)}</Title>
            </Group>
            <Text c="dimmed" fz="sm">
              You answered {summary.correct} of {summary.attempted} attempted questions correctly.
            </Text>
            <Group gap={6}>
              <Badge variant="light" color="blue" leftSection={<IconClipboardList size={12} />}>
                {summary.session.examName}
              </Badge>
              <Badge variant="light" color="gray" leftSection={<IconCalendar size={12} />}>
                {completedOn}
              </Badge>
            </Group>
          </Stack>
        </Group>
      </Paper>

      <Grid>
        {metrics.map((item) => (
          <Grid.Col key={item.label} span={{ base: 6, sm: 4, lg: 2 }}>
            <StatCard {...item} />
          </Grid.Col>
        ))}
      </Grid>

      <div>
        <Title order={2} fz={18} mb="md">Performance breakdown</Title>
        <Grid>
          <Grid.Col span={{ base: 12, lg: 4 }}><PerformanceCard title="Subjects" rows={summary.subjectPerformance} /></Grid.Col>
          <Grid.Col span={{ base: 12, lg: 4 }}><PerformanceCard title="Topics" rows={summary.topicPerformance} /></Grid.Col>
          <Grid.Col span={{ base: 12, lg: 4 }}><PerformanceCard title="Difficulty" rows={summary.difficultyPerformance} /></Grid.Col>
        </Grid>
      </div>

      <Paper className="tabler-card" p={{ base: "md", sm: "lg" }}>
        <Group justify="space-between" mb="md">
          <Title order={2} fz={18}>Review answers</Title>
          <Badge variant="light" color="gray">{summary.review.length} questions</Badge>
        </Group>
        <Accordion className="summary-review" variant="separated">
          {summary.review.map((item) => {
            const status = item.isSkipped ? "Skipped" : item.isCorrect ? "Correct" : "Incorrect";
            const statusColor = item.isSkipped ? "gray" : item.isCorrect ? "green" : "red";
            return (
              <Accordion.Item key={item.order} value={String(item.order)}>
                <Accordion.Control data-haptic="selection">
                  <Group wrap="nowrap" gap="sm">
                    <ThemeIcon className="summary-question-number" size={30} radius="xl" variant="light" color={statusColor}>
                      <Text fz="xs" fw={750}>{item.order}</Text>
                    </ThemeIcon>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Text fw={600} fz="sm" lineClamp={1}>{item.prompt}</Text>
                      <Badge mt={4} size="xs" variant="light" color={statusColor}>{status}</Badge>
                    </div>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    <Text className="question-copy" fw={600}>{item.prompt}</Text>
                    <Stack gap="xs">
                      {item.options.map((option) => {
                        const selected = item.selectedOptionIds.includes(option.id);
                        const optionLabel = option.isCorrect && selected
                          ? "Your answer · Correct"
                          : option.isCorrect
                            ? "Correct answer"
                            : selected
                              ? "Your answer"
                              : "";
                        return (
                          <Paper
                            key={option.id}
                            className="summary-answer-option"
                            withBorder
                            p="sm"
                            bg={option.isCorrect ? "green.0" : selected ? "red.0" : "white"}
                          >
                            <Group justify="space-between" wrap="nowrap" gap="md">
                              <Text fz="sm">{option.text}</Text>
                              {optionLabel && <Text fz={11} fw={700} c={option.isCorrect ? "green.8" : "red.8"} ta="right">{optionLabel}</Text>}
                            </Group>
                          </Paper>
                        );
                      })}
                    </Stack>
                    <Paper className="summary-explanation" p="md" bg="blue.0">
                      <Text fz={11} fw={700} c="blue.8" tt="uppercase" lts={0.4} mb={5}>Explanation</Text>
                      <Text c="dark.7" className="question-copy" fz="sm">{item.explanation || "No explanation provided."}</Text>
                    </Paper>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Paper>
    </Stack>
  );
}
