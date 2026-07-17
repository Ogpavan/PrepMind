import { Group } from "@mantine/core";
import { examService } from "@/modules/exams/application/exam-service";
import { subjectService } from "@/modules/subjects/application/subject-service";
import { SubjectManager } from "@/modules/subjects/presentation/subject-manager";
import { SearchInput } from "@/shared/ui/search-input";
import { UrlSelect } from "@/shared/ui/url-select";
import { ListPagination } from "@/shared/ui/list-pagination";

export const metadata = { title: "Subjects" };

export default async function SubjectsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; exam?: string }> }) {
  const params = await searchParams;
  const [result, exams] = await Promise.all([
    subjectService.list({ query: params.q, page: Number(params.page) || 1, examId: params.exam }),
    examService.listActive(),
  ]);
  const filters = <>
    <UrlSelect name="exam" placeholder="All exams" data={exams.map((exam) => ({ value: exam.id, label: exam.name }))} />
    <SearchInput placeholder="Search subjects" />
  </>;
  return <>
    <SubjectManager items={result.items} exams={exams} filters={filters} />
    <Group justify="flex-end" mt="lg"><ListPagination page={result.page} total={result.totalPages} /></Group>
  </>;
}
