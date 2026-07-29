import { Badge, Stack, Text } from "@mantine/core";
import { generationService } from "@/modules/generation/application/generation-service";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState } from "@/shared/ui/empty-state";

export const metadata = { title: "Logs" };

const statusColor = {
  queued: "gray",
  running: "blue",
  completed: "green",
  failed: "red",
} as const;

export default async function LogsPage() {
  const logs = await generationService.listLogs();
  return <>
    <PageHeader title="Logs" description="AI question generation progress and batch results." />
    {logs.length === 0 ? <EmptyState title="No logs found" description="Start generation from a topic to see progress here." /> : <div className="data-table-wrap"><table><thead><tr><th>Run</th><th>Topic</th><th>Model</th><th>Progress</th><th>Status</th><th>Latest message</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td><Text fw={600}>{log.createdAt.toLocaleString()}</Text><Text fz="xs" c="dimmed">{log.actorName ?? "System"}</Text></td><td><Text fz="sm">{log.topicName ?? "Deleted topic"}</Text><Text fz="xs" c="dimmed">{log.subjectName ?? "Deleted subject"} · {log.examName ?? "Deleted exam"}</Text></td><td><Text fz="sm">{log.model}</Text></td><td><Text fz="sm">{log.insertedQuestions}/{log.requestedQuestions} saved</Text><Text fz="xs" c="dimmed">{log.generatedQuestions} generated · {log.failedQuestions} skipped</Text></td><td><Badge color={statusColor[log.status]} variant="light">{log.status}</Badge></td><td style={{ maxWidth: 420 }}><Stack gap={3}><Text fz="sm">{log.message}</Text>{log.details.slice(-2).map((detail) => <Text key={`${log.id}-${detail.at}`} fz="xs" c="dimmed">{new Date(detail.at).toLocaleTimeString()} · {detail.message}</Text>)}</Stack></td></tr>)}</tbody></table></div>}
  </>;
}
