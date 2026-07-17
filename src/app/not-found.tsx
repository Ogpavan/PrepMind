import { Center, Stack, Text, Title } from "@mantine/core";
import { LinkButton } from "@/shared/ui/link-button";

export default function NotFound() { return <Center mih="70vh"><Stack align="center"><Text fz={56} fw={800} c="blue">404</Text><Title order={2}>Page not found</Title><Text c="dimmed">The page may have moved or no longer exists.</Text><LinkButton href="/">Return home</LinkButton></Stack></Center>; }
