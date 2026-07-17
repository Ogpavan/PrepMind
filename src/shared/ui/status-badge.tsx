import { Badge } from "@mantine/core";

export function StatusBadge({ active, archived }: { active: boolean; archived?: boolean }) {
  if (archived) return <Badge color="gray" variant="light">Archived</Badge>;
  return <Badge color={active ? "green" : "orange"} variant="light">{active ? "Active" : "Inactive"}</Badge>;
}
