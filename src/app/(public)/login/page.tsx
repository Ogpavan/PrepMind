import { Box, Center, Group, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { Brain as IconBrain, Check as IconCheck } from "@phosphor-icons/react/ssr";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/identity/application/authorization";
import { LoginForm } from "@/modules/identity/presentation/login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "STUDENT" ? "/dashboard" : "/admin/dashboard");
  const { callbackUrl } = await searchParams;

  return (
    <Box mih="100vh" bg="var(--pm-bg)" p="md">
      <Center mih="calc(100vh - 32px)">
        <Stack w="100%" maw={410} gap="lg">
          <Group justify="center" gap="sm">
            <ThemeIcon size={38} radius={4}><IconBrain size={23} /></ThemeIcon>
            <Text className="brand-wordmark" fz={22}>PrepMind</Text>
          </Group>
          <Paper className="tabler-card" p={{ base: "lg", sm: 32 }}>
            <Stack gap="lg">
              <Stack gap={5} align="center">
                <Title order={1} fz={22} lts={-0.3}>Login to your account</Title>
                <Text c="dimmed" ta="center" fz="sm">Enter your credentials to continue to PrepMind.</Text>
              </Stack>
              <LoginForm callbackUrl={callbackUrl} />
            </Stack>
          </Paper>
          <Paper withBorder p="sm" radius={4} bg="white">
            <Stack gap={5}>
              <Text fz={11} fw={600} c="dimmed" tt="uppercase" lts={0.4}>Demo accounts</Text>
              <Text fz="xs" c="dimmed"><IconCheck size={13} /> Admin: admin@prepmind.local / Admin@12345</Text>
              <Text fz="xs" c="dimmed"><IconCheck size={13} /> Learner: student@prepmind.local / Student@12345</Text>
            </Stack>
          </Paper>
        </Stack>
      </Center>
    </Box>
  );
}
