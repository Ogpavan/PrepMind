"use client";

import { useTransition } from "react";
import { ActionIcon, Button, Group, Menu, Modal, PasswordInput, Select, Stack, Switch, Table, Text, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { notifications } from "@mantine/notifications";
import { IconDots, IconEdit, IconPlus } from "@tabler/icons-react";
import type { UserListItem } from "../infrastructure/user-repository";
import { userSchema } from "../schemas/user-schema";
import { saveUserAction } from "./actions";
import { StatusBadge } from "@/shared/ui/status-badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";

export function UserManager({ items, actorRole, filters }: { items: UserListItem[]; actorRole: string; filters?: React.ReactNode }) {
  const defaults = { id: undefined as string | undefined, name: "", email: "", password: "", role: "STUDENT" as "SUPER_ADMIN" | "ADMIN" | "STUDENT", isActive: true }; const [opened, modal] = useDisclosure(false); const [pending, startTransition] = useTransition(); const form = useForm({ initialValues: defaults, validate: zod4Resolver(userSchema) });
  const openCreate = () => { form.setValues(defaults); form.resetDirty(); modal.open(); }; const openEdit = (item: UserListItem) => { form.setValues({ id: item.id, name: item.name, email: item.email, password: "", role: item.role, isActive: item.isActive }); form.resetDirty(); modal.open(); };
  const submit = form.onSubmit((values) => startTransition(async () => { const result = await saveUserAction(values); notifications.show({ color: result.ok ? "green" : "red", message: result.message }); if (result.ok) modal.close(); else if (result.fieldErrors) Object.entries(result.fieldErrors).forEach(([field, messages]) => form.setFieldError(field, messages?.[0])); }));
  const roleData = actorRole === "SUPER_ADMIN" ? [{ value: "STUDENT", label: "Student" }, { value: "ADMIN", label: "Admin" }, { value: "SUPER_ADMIN", label: "Super admin" }] : [{ value: "STUDENT", label: "Student" }];
  return <><PageHeader title="Users" actions={<Button leftSection={<IconPlus size={16} />} onClick={openCreate}>New user</Button>} />{filters && <div className="page-filters">{filters}</div>}{items.length === 0 ? <EmptyState title="No users found" description="Create a learner account to begin tracking progress." /> : <div className="data-table-wrap"><Table highlightOnHover verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th>User</Table.Th><Table.Th>Role</Table.Th><Table.Th>Last login</Table.Th><Table.Th>Status</Table.Th><Table.Th w={48}>Actions</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{items.map((item) => <Table.Tr key={item.id}><Table.Td><Text fw={600}>{item.name}</Text><Text fz="xs" c="dimmed">{item.email}</Text></Table.Td><Table.Td>{item.role.replace("_", " ")}</Table.Td><Table.Td>{item.lastLoginAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.lastLoginAt)) : "Never"}</Table.Td><Table.Td><StatusBadge active={item.isActive} /></Table.Td><Table.Td><Menu position="bottom-end"><Menu.Target><ActionIcon variant="subtle" aria-label={`Actions for ${item.name}`}><IconDots size={18} /></ActionIcon></Menu.Target><Menu.Dropdown><Menu.Item leftSection={<IconEdit size={16} />} onClick={() => openEdit(item)}>Edit</Menu.Item></Menu.Dropdown></Menu></Table.Td></Table.Tr>)}</Table.Tbody></Table></div>}
  <Modal opened={opened} onClose={modal.close} title={form.values.id ? "Edit user" : "Create user"} size="lg"><form onSubmit={submit} noValidate><Stack><TextInput label="Name" required {...form.getInputProps("name")} /><TextInput label="Email" type="email" required {...form.getInputProps("email")} /><PasswordInput label={form.values.id ? "New password" : "Password"} description={form.values.id ? "Leave blank to keep the current password." : "Use at least 10 characters."} required={!form.values.id} {...form.getInputProps("password")} /><Select label="Role" required data={roleData} {...form.getInputProps("role")} /><Switch label="Active account" {...form.getInputProps("isActive", { type: "checkbox" })} /><Group justify="flex-end"><Button variant="default" onClick={modal.close}>Cancel</Button><Button type="submit" loading={pending}>Save user</Button></Group></Stack></form></Modal></>;
}
