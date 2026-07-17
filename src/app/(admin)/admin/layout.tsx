import { AppShell } from "@/shared/ui/app-shell";
import { requireRole } from "@/modules/identity/application/authorization";

export default async function AdminLayout({ children }: { children: React.ReactNode }) { const user = await requireRole(["SUPER_ADMIN", "ADMIN"]); return <AppShell user={user} variant="admin">{children}</AppShell>; }
