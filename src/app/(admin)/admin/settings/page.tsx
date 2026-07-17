import { requireRole } from "@/modules/identity/application/authorization";
import { settingsService } from "@/modules/settings/application/settings-service";
import { AdminSettingsForm } from "@/modules/settings/presentation/admin-settings-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Settings" };
export default async function AdminSettingsPage() { const user = await requireRole(["SUPER_ADMIN", "ADMIN"]); const settings = await settingsService.getApplicationSettings(); return <><PageHeader title="Settings" description="Control study defaults and platform behavior." /><AdminSettingsForm settings={settings} canEdit={user.role === "SUPER_ADMIN"} /></>; }
