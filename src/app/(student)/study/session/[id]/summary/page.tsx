import { Group } from "@mantine/core";
import { IconPlayerPlay } from "@tabler/icons-react";
import { requireUser } from "@/modules/identity/application/authorization";
import { summaryService } from "@/modules/attempts/application/summary-service";
import { SessionSummary } from "@/modules/attempts/presentation/session-summary";
import { PageHeader } from "@/shared/ui/page-header";
import { LinkButton } from "@/shared/ui/link-button";

export const metadata = { title: "Session summary" };
export default async function SessionSummaryPage({ params }: { params: Promise<{ id: string }> }) { const user = await requireUser(); const { id } = await params; const summary = await summaryService.get(id, user.id); return <><PageHeader title="Session summary" actions={<Group><LinkButton href="/dashboard" variant="default" visibleFrom="sm">Dashboard</LinkButton><LinkButton href="/study" leftSection={<IconPlayerPlay size={16} />}>Start another</LinkButton></Group>} /><SessionSummary summary={summary} /></>; }
