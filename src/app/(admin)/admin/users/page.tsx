import { Group } from "@mantine/core";
import { requireRole } from "@/modules/identity/application/authorization";
import { userService } from "@/modules/users/application/user-service";
import { UserManager } from "@/modules/users/presentation/user-manager";
import { SearchInput } from "@/shared/ui/search-input";
import { UrlSelect } from "@/shared/ui/url-select";
import { ListPagination } from "@/shared/ui/list-pagination";

export const metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; role?: "SUPER_ADMIN" | "ADMIN" | "STUDENT" }> }) {
  const actor = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  const params = await searchParams;
  const result = await userService.list({ query: params.q, page: Number(params.page) || 1, role: params.role });
  const filters = <>
    <UrlSelect name="role" placeholder="All roles" data={[{ value: "STUDENT", label: "Students" }, { value: "ADMIN", label: "Admins" }, { value: "SUPER_ADMIN", label: "Super admins" }]} />
    <SearchInput placeholder="Search users" />
  </>;
  return <>
    <UserManager items={result.items} actorRole={actor.role} filters={filters} />
    <Group justify="flex-end" mt="lg"><ListPagination page={result.page} total={result.totalPages} /></Group>
  </>;
}
