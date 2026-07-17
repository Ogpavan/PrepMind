import { Group } from "@mantine/core";
import { examService } from "@/modules/exams/application/exam-service";
import { ExamManager } from "@/modules/exams/presentation/exam-manager";
import { SearchInput } from "@/shared/ui/search-input";
import { ListPagination } from "@/shared/ui/list-pagination";

export const metadata = { title: "Exams" };

export default async function ExamsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const result = await examService.list({ query: params.q, page: Number(params.page) || 1 });
  return <>
    <ExamManager items={result.items} filters={<SearchInput placeholder="Search exams" />} />
    <Group justify="flex-end" mt="lg"><ListPagination page={result.page} total={result.totalPages} /></Group>
  </>;
}
