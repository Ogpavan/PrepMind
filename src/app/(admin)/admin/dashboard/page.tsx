import { requireRole } from "@/modules/identity/application/authorization";
import { dashboardService } from "@/modules/progress/application/dashboard-service";
import { AdminDashboardView } from "@/modules/progress/presentation/admin-dashboard-view";

export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const [data, user] = await Promise.all([
    dashboardService.admin(),
    requireRole(["SUPER_ADMIN", "ADMIN"]),
  ]);
  return <AdminDashboardView data={data} userName={user.name?.split(" ")[0] ?? "Administrator"} />;
}
