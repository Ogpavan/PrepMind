"use client";

import {
  AppShell as MantineAppShell,
  Avatar,
  Box,
  Burger,
  Button,
  Container,
  Divider,
  Group,
  Menu,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAdjustmentsHorizontal,
  IconBooks,
  IconBrain,
  IconCertificate,
  IconChartHistogram,
  IconChevronDown,
  IconClipboardText,
  IconHierarchy3,
  IconLayoutDashboard,
  IconLogout,
  IconPlus,
  IconSchool,
  IconUserCog,
  IconUsersGroup,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/modules/identity/presentation/actions";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/admin/exams", label: "Exams", icon: IconCertificate },
  { href: "/admin/subjects", label: "Subjects", icon: IconBooks },
  { href: "/admin/topics", label: "Topics", icon: IconHierarchy3 },
  { href: "/admin/questions", label: "Questions", icon: IconClipboardText },
  { href: "/admin/users", label: "Users", icon: IconUsersGroup },
  { href: "/admin/settings", label: "Settings", icon: IconAdjustmentsHorizontal },
];

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/study", label: "Study", icon: IconSchool },
  { href: "/subjects", label: "Subjects", icon: IconBooks },
  { href: "/progress", label: "Progress", icon: IconChartHistogram },
  { href: "/settings", label: "Settings", icon: IconUserCog },
];

export function AppShell({ children, user, variant }: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; role: string };
  variant: "admin" | "student";
}) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();
  const links = variant === "admin" ? adminLinks : studentLinks;
  const home = variant === "admin" ? "/admin/dashboard" : "/dashboard";
  const quickAction = variant === "admin"
    ? { href: "/admin/questions/new", label: "New question" }
    : { href: "/study", label: "Start session" };
  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isActive = (href: string) => pathname === href || (href !== home && pathname.startsWith(`${href}/`));

  return (
    <MantineAppShell header={{ height: { base: 58, sm: 106 } }} padding={0}>
      <MantineAppShell.Header className="app-header">
        <Box className="app-header-primary">
          <Container size={1320} px={{ base: "md", sm: "lg" }} h="100%">
            <Group h="100%" justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
                <UnstyledButton component={Link} href={home} className="brand-link" aria-label="PrepMind home">
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon size={34} radius={4} color="blue">
                      <IconBrain size={21} stroke={1.8} />
                    </ThemeIcon>
                    <Text className="brand-wordmark">PrepMind</Text>
                  </Group>
                </UnstyledButton>
              </Group>

              <Group gap="md" wrap="nowrap">
                <Button
                  component={Link}
                  href={quickAction.href}
                  leftSection={<IconPlus size={16} />}
                  visibleFrom="md"
                >
                  {quickAction.label}
                </Button>
                <Menu position="bottom-end" shadow="md" width={240} offset={10}>
                  <Menu.Target>
                    <UnstyledButton className="account-button" aria-label="Open account menu">
                      <Group gap="sm" wrap="nowrap">
                        <Avatar size={34} color="blue" radius="xl">{initials}</Avatar>
                        <Box visibleFrom="sm">
                          <Text fz="sm" fw={600} lh={1.25}>{user.name}</Text>
                          <Text fz={11} c="dimmed" tt="uppercase" fw={600} lts={0.35}>{user.role.replace("_", " ")}</Text>
                        </Box>
                        <IconChevronDown size={15} stroke={1.8} />
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Signed in as</Menu.Label>
                    <Text px="sm" pb="xs" fz="sm" fw={500} lineClamp={1}>{user.email}</Text>
                    <Divider />
                    <Menu.Item component={Link} href={variant === "admin" ? "/admin/settings" : "/settings"} leftSection={<IconUserCog size={16} />}>Account settings</Menu.Item>
                    <form action={logoutAction}>
                      <Menu.Item component="button" type="submit" leftSection={<IconLogout size={16} />} color="red" w="100%">Sign out</Menu.Item>
                    </form>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </Container>
        </Box>

        <Box className="app-header-nav" visibleFrom="sm">
          <Container size={1320} px="lg" h="100%">
            <Group h="100%" gap={2} wrap="nowrap">
              {links.map(({ href, label, icon: Icon }) => (
                <UnstyledButton
                  component={Link}
                  href={href}
                  key={href}
                  className={`top-nav-link${isActive(href) ? " top-nav-link-active" : ""}`}
                >
                  <Icon size={17} stroke={1.7} />
                  <span>{label}</span>
                </UnstyledButton>
              ))}
            </Group>
          </Container>
        </Box>

        {opened && (
          <Box className="mobile-nav" hiddenFrom="sm">
            <Container px="md" py="sm">
              {links.map(({ href, label, icon: Icon }) => (
                <UnstyledButton
                  component={Link}
                  href={href}
                  key={href}
                  onClick={close}
                  className={`mobile-nav-link${isActive(href) ? " mobile-nav-link-active" : ""}`}
                >
                  <Icon size={18} stroke={1.7} />
                  <span>{label}</span>
                </UnstyledButton>
              ))}
              <Button component={Link} href={quickAction.href} onClick={close} leftSection={<IconPlus size={16} />} fullWidth mt="sm">
                {quickAction.label}
              </Button>
            </Container>
          </Box>
        )}
      </MantineAppShell.Header>

      <MantineAppShell.Main className="app-main">
        <Container size={1320} px={{ base: "md", sm: "lg" }} py={{ base: "lg", sm: 28 }}>
          {children}
        </Container>
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
