import { requireUser } from "@/modules/identity/application/authorization";
import { AccountSettings } from "@/modules/users/presentation/account-settings";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Settings" };
export default async function SettingsPage() { const user = await requireUser(); return <><PageHeader title="Account settings" description="Keep your profile and password up to date." /><AccountSettings name={user.name ?? ""} email={user.email ?? ""} /></>; }
