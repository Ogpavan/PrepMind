import { Breadcrumbs, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";

export function PageHeader({ title, actions, breadcrumbs }: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  return (
    <Stack gap={8} className="page-header">
      {breadcrumbs && (
        <Breadcrumbs fz={12} separator="/" className="page-breadcrumbs">
          {breadcrumbs.map((item) => item.href
            ? <Link key={item.label} href={item.href}>{item.label}</Link>
            : <Text key={item.label} c="dimmed" fz={12}>{item.label}</Text>)}
        </Breadcrumbs>
      )}
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Title order={2} fz={{ base: 22, sm: 24 }} className="page-header-title">{title}</Title>
        {actions && <Group gap="sm" className="page-header-actions">{actions}</Group>}
      </Group>
    </Stack>
  );
}
