import { Group } from "@mantine/core";

export function PageHeader({ actions }: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  if (!actions) return null;

  return <Group justify="flex-end" gap="sm" mb="md" className="page-actions">{actions}</Group>;
}
