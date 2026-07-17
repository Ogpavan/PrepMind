import { Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconInbox } from "@tabler/icons-react";
import { LinkButton } from "./link-button";

export function EmptyState({ title, description, actionLabel, actionHref }: { title: string; description: string; actionLabel?: string; actionHref?: string }) {
  return <Paper className="tabler-card empty-state-card" data-accent="cyan" p="xl"><Stack align="center" py="xl"><ThemeIcon size={48} variant="light" color="cyan"><IconInbox /></ThemeIcon><Title order={3}>{title}</Title><Text c="dimmed" ta="center" maw={480}>{description}</Text>{actionLabel && actionHref && <LinkButton href={actionHref}>{actionLabel}</LinkButton>}</Stack></Paper>;
}
