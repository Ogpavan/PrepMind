import { examService } from "@/modules/exams/application/exam-service";
import { requireUser } from "@/modules/identity/application/authorization";
import { settingsService } from "@/modules/settings/application/settings-service";
import { subjectService } from "@/modules/subjects/application/subject-service";
import { topicService } from "@/modules/topics/application/topic-service";
import { studyService } from "@/modules/study/application/study-service";
import { SessionCreator } from "@/modules/study/presentation/session-creator";
import { RecentSessions } from "@/modules/study/presentation/recent-sessions";
import { PageHeader } from "@/shared/ui/page-header";
import { Stack } from "@mantine/core";

export const metadata = { title: "Study" };
export default async function StudyPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) { const user = await requireUser(); const params = await searchParams; const [exams, subjectResult, topicResult, settings, recent] = await Promise.all([examService.listActive(), subjectService.list({ pageSize: 100 }), topicService.list({ pageSize: 100 }), settingsService.getApplicationSettings(), studyService.recent(user.id)]); return <><PageHeader title="Start studying" description="Choose a focused question set and learn from immediate explanations." /><Stack gap="lg"><SessionCreator exams={exams} subjects={subjectResult.items.filter((item) => item.isActive)} topics={topicResult.items.filter((item) => item.isActive)} settings={settings} initialSubjectId={params.subject} /><RecentSessions sessions={recent} /></Stack></>; }
