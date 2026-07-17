import { Group } from "@mantine/core";
import { examService } from "@/modules/exams/application/exam-service";
import { subjectService } from "@/modules/subjects/application/subject-service";
import { topicService } from "@/modules/topics/application/topic-service";
import { TopicManager } from "@/modules/topics/presentation/topic-manager";
import { SearchInput } from "@/shared/ui/search-input";
import { UrlSelect } from "@/shared/ui/url-select";
import { ListPagination } from "@/shared/ui/list-pagination";

export const metadata = { title: "Topics" };

export default async function TopicsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; exam?: string; subject?: string }> }) {
  const params = await searchParams;
  const [result, exams, subjectResult, refs] = await Promise.all([
    topicService.list({ query: params.q, page: Number(params.page) || 1, examId: params.exam, subjectId: params.subject }),
    examService.listActive(),
    subjectService.list({ pageSize: 100 }),
    topicService.listReference(),
  ]);
  const subjects = subjectResult.items;
  const filters = <>
    <UrlSelect name="exam" placeholder="All exams" data={exams.map((exam) => ({ value: exam.id, label: exam.name }))} />
    <UrlSelect name="subject" placeholder="All subjects" data={subjects.filter((subject) => !params.exam || subject.examId === params.exam).map((subject) => ({ value: subject.id, label: subject.name }))} />
    <SearchInput placeholder="Search topics" />
  </>;
  return <>
    <TopicManager items={result.items} subjects={subjects} topicRefs={refs} filters={filters} />
    <Group justify="flex-end" mt="lg"><ListPagination page={result.page} total={result.totalPages} /></Group>
  </>;
}
