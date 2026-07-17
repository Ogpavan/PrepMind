import { Center, Paper, Stack, Text, Title } from "@mantine/core";
import { LinkButton } from "@/shared/ui/link-button";

export default function ForbiddenPage() { return <Center mih="100vh" p="md"><Paper className="tabler-card" p="xl" maw={480}><Stack align="center"><Text fz={48} fw={800} c="red">403</Text><Title order={2}>Access denied</Title><Text c="dimmed" ta="center">Your account does not have permission to open this page.</Text><LinkButton href="/">Return home</LinkButton></Stack></Paper></Center>; }
