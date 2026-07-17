import { AppShell } from "@/shared/ui/app-shell";
import { requireRole } from "@/modules/identity/application/authorization";

export default async function StudentLayout({ children }: { children: React.ReactNode }) { const user = await requireRole(["STUDENT"]); return <AppShell user={user} variant="student">{children}</AppShell>; }
