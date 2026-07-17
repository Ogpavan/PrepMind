import { adminDashboardRepository } from "../infrastructure/admin-dashboard-repository";
import { progressService } from "./progress-service";
import { studyService } from "@/modules/study/application/study-service";

export const dashboardService = {
  admin: () => adminDashboardRepository.get(),
  async student(userId: string) { const [progress, availableQuestions, subjects, recentSessions] = await Promise.all([progressService.get(userId), progressService.availableQuestions(), progressService.subjectOverview(userId), studyService.recent(userId, 5)]); return { progress, availableQuestions, subjects, recentSessions }; },
};
