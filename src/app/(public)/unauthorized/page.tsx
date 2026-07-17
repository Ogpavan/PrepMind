import { Center, Paper, Stack, Text, Title } from "@mantine/core";
import { LinkButton } from "@/shared/ui/link-button";

export default function UnauthorizedPage() { return <Center mih="100vh" p="md"><Paper className="tabler-card" p="xl" maw={480}><Stack align="center"><Text fz={48} fw={800} c="orange">401</Text><Title order={2}>Authentication required</Title><Text c="dimmed" ta="center">Your session is missing, expired, or inactive.</Text><LinkButton href="/login">Go to sign in</LinkButton></Stack></Paper></Center>; }
