"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Alert, Badge, Button, Group, Paper, Progress, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconArrowRight, IconBooks, IconCheck, IconClock, IconFlag, IconGauge, IconHierarchy2, IconPlayerSkipForward, IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { QuestionRenderer } from "@/shared/ui/question-renderer";
import { startNavigationProgress } from "@/shared/ui/navigation-progress";
import { calculateCorrectness } from "@/modules/questions/domain/correctness";
import { triggerHaptic } from "@/shared/utils/haptics";
import { formatDuration } from "@/shared/utils/text";
import type { AnswerFeedback, LearnerSession } from "../types/session-types";
import { completeSessionAction } from "./actions";

export function SessionRunner({ initialSession }: { initialSession: LearnerSession }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const firstUnanswered = initialSession.questions.findIndex((item) => !item.feedback);
  const [index, setIndex] = useState(firstUnanswered >= 0 ? firstUnanswered : 0);
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>(
    Object.fromEntries(initialSession.questions.filter((item) => item.feedback).map((item) => [item.id, item.feedback!])),
  );
  const feedbackRef = useRef(feedback);
  const [selections, setSelections] = useState<Record<string, string[]>>(
    Object.fromEntries(initialSession.questions.map((item) => [item.id, item.feedback?.selectedOptionIds ?? []])),
  );
  const [advancing, setAdvancing] = useState(false);
  const startedQuestionAt = useRef(0);
  const completing = useRef(false);
  const advanceTimer = useRef<number | null>(null);
  const currentBase = initialSession.questions[index];
  const current = { ...currentBase, feedback: feedback[currentBase.id] ?? null };
  const answered = Object.keys(feedback).length;
  const allAnswered = answered === initialSession.questions.length;
  const [remaining, setRemaining] = useState<number | null>(initialSession.remainingSeconds);

  const finishSession = useCallback((timedOut = false) => {
    if (completing.current) return;
    completing.current = true;
    const answers = Object.entries(feedbackRef.current).map(([sessionQuestionId, answer]) => ({
      sessionQuestionId,
      selectedOptionIds: answer.selectedOptionIds,
      responseTimeSeconds: answer.responseTimeSeconds,
      skip: answer.isSkipped,
    }));
    startTransition(async () => {
      const result = await completeSessionAction({ sessionId: initialSession.id, answers, timedOut });
      if (result.ok) {
        triggerHaptic("success");
        const summaryUrl = `/study/session/${initialSession.id}/summary`;
        startNavigationProgress();
        if (timedOut) router.replace(summaryUrl);
        else router.push(summaryUrl);
      } else {
        completing.current = false;
        notifications.show({ color: "red", message: result.message });
      }
    });
  }, [initialSession.id, router]);

  useEffect(() => {
    startedQuestionAt.current = Date.now();
  }, [index]);

  useEffect(() => () => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
  }, []);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0 && !completing.current) {
      finishSession(true);
      return;
    }
    const timer = window.setInterval(() => setRemaining((value) => value === null ? null : Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [remaining, finishSession]);

  const scheduleNextQuestion = (updatedFeedback: Record<string, AnswerFeedback>) => {
    const nextAfterCurrent = initialSession.questions.findIndex((question, questionIndex) => questionIndex > index && !updatedFeedback[question.id]);
    const nextIndex = nextAfterCurrent >= 0
      ? nextAfterCurrent
      : initialSession.questions.findIndex((question) => !updatedFeedback[question.id]);
    if (nextIndex < 0) return;
    setAdvancing(true);
    advanceTimer.current = window.setTimeout(() => {
      setAdvancing(false);
      setIndex(nextIndex);
    }, 450);
  };

  const submit = (skip = false, selectedOptionIds?: string[]) => {
    if (current.feedback) return;
    const selected = skip ? [] : selectedOptionIds ?? selections[current.id] ?? [];
    const localFeedback: AnswerFeedback = {
      selectedOptionIds: selected,
      correctOptionIds: current.correctOptionIds,
      isCorrect: skip ? null : calculateCorrectness(selected, current.correctOptionIds),
      isSkipped: skip,
      responseTimeSeconds: Math.min(3600, Math.max(0, Math.round((Date.now() - startedQuestionAt.current) / 1000))),
      explanation: current.explanation,
    };
    triggerHaptic(localFeedback.isSkipped ? "light" : localFeedback.isCorrect ? "success" : "warning");
    const updatedFeedback = { ...feedbackRef.current, [current.id]: localFeedback };
    feedbackRef.current = updatedFeedback;
    setFeedback(updatedFeedback);
    scheduleNextQuestion(updatedFeedback);
  };

  const selectAnswer = (ids: string[]) => {
    setSelections((value) => ({ ...value, [current.id]: ids }));
    if (current.type !== "multiple_choice" && ids.length > 0) submit(false, ids);
  };

  const finish = () => finishSession(false);

  return (
    <Stack gap="lg" className="session-runner">
      <Paper className="tabler-card session-overview-card" p={{ base: "xs", sm: "md" }}>
        <Group justify="space-between">
          <div>
            <Text fz={{ base: "xs", sm: "sm" }} c="dimmed">{initialSession.examName}</Text>
            <Text fw={600}>Question {index + 1} of {initialSession.questions.length}</Text>
          </div>
          {remaining !== null && <Group gap={7} wrap="nowrap" className="session-timer"><IconClock size={21} stroke={1.8} color={remaining < 60 ? "var(--mantine-color-red-7)" : "var(--pm-primary)"} /><Text fz={18} fw={700} c={remaining < 60 ? "red.7" : "dark.8"}>{formatDuration(remaining)}</Text></Group>}
        </Group>
        <Progress value={((index + 1) / initialSession.questions.length) * 100} mt={{ base: 6, sm: "md" }} size="sm" />
      </Paper>

      <Paper key={current.id} className="tabler-card session-question-panel" p={{ base: "md", sm: "xl" }}>
        <Stack gap="lg" className="session-question-content">
          <Group gap="xs" wrap="nowrap" className="session-meta-row">
            <Badge size="md" variant="transparent" color="gray" className="session-meta-chip" leftSection={<IconBooks size={14} stroke={1.8} color="var(--pm-primary)" />}>{current.subjectName}</Badge>
            <Badge size="md" variant="transparent" color="gray" className="session-meta-chip" leftSection={<IconHierarchy2 size={14} stroke={1.8} color="var(--mantine-color-violet-6)" />}>{current.topicName}</Badge>
            <Badge size="md" variant="transparent" color="gray" className="session-meta-chip" leftSection={<IconGauge size={14} stroke={1.8} color={current.difficulty === "hard" ? "var(--mantine-color-red-6)" : current.difficulty === "medium" ? "var(--mantine-color-yellow-7)" : "var(--mantine-color-teal-6)"} />}>{current.difficulty}</Badge>
          </Group>
          <Title order={2} fz={{ base: 18, sm: 24 }} className="question-copy">{current.prompt}</Title>
          <QuestionRenderer
            question={current}
            selected={selections[current.id] ?? []}
            onChange={selectAnswer}
            disabled={Boolean(current.feedback) || pending || advancing}
          />
          {!current.feedback && current.type !== "multiple_choice" && <Text fz="xs" c="dimmed">Select an option to submit your answer automatically.</Text>}
          {current.feedback && (
            <Alert
              color={current.feedback.isSkipped ? "blue" : current.feedback.isCorrect ? "green" : "red"}
              icon={current.feedback.isCorrect ? <IconCheck size={19} /> : current.feedback.isSkipped ? <IconPlayerSkipForward size={19} /> : <IconX size={19} />}
              title={current.feedback.isSkipped ? "Question skipped" : current.feedback.isCorrect ? "Correct answer" : "Not quite"}
            >
              <Text className="question-copy">{current.feedback.explanation || "No explanation has been provided."}</Text>
              {advancing && <Text fz="xs" mt="xs" fw={600}>Moving to the next question…</Text>}
            </Alert>
          )}
        </Stack>
      </Paper>

      <Group justify="space-between" wrap="nowrap" className="session-navigation-row">
        <Button size="compact-sm" variant="default" data-haptic="selection" leftSection={<IconArrowLeft size={16} />} disabled={index === 0 || advancing} onClick={() => setIndex((value) => value - 1)}>Previous</Button>
        <Group gap="xs" wrap="nowrap">
          {!current.feedback && <Button size="compact-sm" variant="light" color="gray" data-haptic="light" leftSection={<IconPlayerSkipForward size={16} />} onClick={() => submit(true)} loading={pending}>Skip</Button>}
          {!current.feedback && current.type === "multiple_choice" && <Button size="compact-sm" data-haptic="medium" onClick={() => submit(false)} loading={pending} disabled={(selections[current.id] ?? []).length === 0}>Confirm</Button>}
        </Group>
        <Button size="compact-sm" variant="default" data-haptic="selection" rightSection={<IconArrowRight size={16} />} disabled={index === initialSession.questions.length - 1 || advancing} onClick={() => setIndex((value) => value + 1)}>Next</Button>
      </Group>

      {allAnswered && <Button className="session-finish-button" color="green" data-haptic="medium" leftSection={<IconFlag size={16} />} onClick={finish} loading={pending} w={{ base: "100%", sm: "fit-content" }} ml={{ sm: "auto" }}>Finish session</Button>}

      <Text className="session-answer-count" fz={{ base: "xs", sm: "sm" }} c="dimmed" ta="center">{answered} of {initialSession.questions.length} answered or skipped</Text>
    </Stack>
  );
}
