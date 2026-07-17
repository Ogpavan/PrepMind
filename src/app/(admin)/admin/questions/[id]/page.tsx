import { notFound } from "next/navigation";
import { examService } from "@/modules/exams/application/exam-service";
import { subjectService } from "@/modules/subjects/application/subject-service";
import { topicService } from "@/modules/topics/application/topic-service";
import { questionService } from "@/modules/questions/application/question-service";
import { QuestionForm } from "@/modules/questions/presentation/question-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Edit question" };
export default async function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const [question, exams, subjectResult, topicResult] = await Promise.all([questionService.findById(id), examService.listActive(), subjectService.list({ pageSize: 100 }), topicService.list({ pageSize: 100 })]); if (!question) notFound(); return <><PageHeader title="Edit question" description={`${question.subjectName} · ${question.topicName}`} breadcrumbs={[{ label: "Questions", href: "/admin/questions" }, { label: "Edit" }]} /><QuestionForm question={question} exams={exams} subjects={subjectResult.items} topics={topicResult.items} /></>; }
