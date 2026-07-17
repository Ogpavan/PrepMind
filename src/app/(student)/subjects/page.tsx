import { Grid, GridCol } from "@mantine/core";
import { requireUser } from "@/modules/identity/application/authorization";
import { progressService } from "@/modules/progress/application/progress-service";
import { SubjectProgressCard } from "@/modules/progress/presentation/subject-progress-card";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState } from "@/shared/ui/empty-state";

export const metadata = { title: "Subjects" };
export default async function SubjectsPage() { const user = await requireUser(); const subjects = await progressService.subjectOverview(user.id); return <><PageHeader title="Subjects" description="Explore available questions and your performance by subject." />{subjects.length ? <Grid>{subjects.map((subject) => <GridCol key={subject.id} span={{ base: 12, md: 6, xl: 4 }}><SubjectProgressCard subject={subject} /></GridCol>)}</Grid> : <EmptyState title="No active subjects" description="An administrator has not published any subjects yet." />}</>; }
