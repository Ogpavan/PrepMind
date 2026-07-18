import { examService } from "@/modules/exams/application/exam-service";
import { subjectService } from "@/modules/subjects/application/subject-service";
import { topicService } from "@/modules/topics/application/topic-service";
import { QuestionForm } from "@/modules/questions/presentation/question-form";
import { QuestionCsvImporter } from "@/modules/questions/presentation/question-csv-importer";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "New question" };
export default async function NewQuestionPage() { const [exams, subjectResult, topicResult] = await Promise.all([examService.listActive(), subjectService.list({ pageSize: 100 }), topicService.list({ pageSize: 100 })]); return <><PageHeader title="Create question" description="Add one question manually or import a complete CSV question bank." breadcrumbs={[{ label: "Questions", href: "/admin/questions" }, { label: "New" }]} actions={<QuestionCsvImporter />} /><QuestionForm exams={exams} subjects={subjectResult.items} topics={topicResult.items} /></>; }
