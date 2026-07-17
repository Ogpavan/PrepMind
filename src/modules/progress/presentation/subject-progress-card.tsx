import { Group, Paper, Progress, Stack, Text } from "@mantine/core";
import { formatPercent } from "@/shared/utils/text";
import { LinkButton } from "@/shared/ui/link-button";

export function SubjectProgressCard({ subject }: { subject: { id: string; name: string; code: string; available: number; attempted: number; correct: number } }) { const accuracy = subject.attempted ? subject.correct / subject.attempted * 100 : 0; return <Paper className="tabler-card" p="lg"><Stack><Group justify="space-between"><div><Text fw={600}>{subject.name}</Text><Text fz="xs" c="dimmed">{subject.code} · {subject.available} questions</Text></div><Text fw={700} c="blue">{formatPercent(accuracy)}</Text></Group><Progress value={accuracy} /><Group justify="space-between"><Text fz="sm" c="dimmed">{subject.attempted} attempted</Text><LinkButton href={`/subjects/${subject.id}`} size="xs" variant="light">View subject</LinkButton></Group></Stack></Paper>; }
