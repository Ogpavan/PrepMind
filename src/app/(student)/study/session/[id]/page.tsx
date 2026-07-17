import { Alert, Stack } from "@mantine/core";
import { redirect } from "next/navigation";
import { requireUser } from "@/modules/identity/application/authorization";
import { studyService } from "@/modules/study/application/study-service";
import { SessionRunner } from "@/modules/study/presentation/session-runner";
import { LinkButton } from "@/shared/ui/link-button";

export const metadata = { title: "Study session" };
export default async function StudySessionPage({ params }: { params: Promise<{ id: string }> }) { const user = await requireUser(); const { id } = await params; const session = await studyService.getSession(id, user.id); if (session.status === "completed") redirect(`/study/session/${id}/summary`); if (session.status === "abandoned") return <Stack><Alert color="gray" title="Session abandoned">This session is closed and cannot be resumed.</Alert><LinkButton href="/study" w="fit-content">Start another session</LinkButton></Stack>; return <SessionRunner initialSession={session} />; }
