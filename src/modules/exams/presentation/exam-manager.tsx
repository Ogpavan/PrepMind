"use client";

import { useState, useTransition } from "react";
import { ActionIcon, Button, Group, Menu, Modal, NumberInput, Stack, Switch, Table, Text, TextInput, Textarea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { notifications } from "@mantine/notifications";
import { DotsThree as IconDots, PencilSimple as IconEdit, Plus as IconPlus, Power as IconPower } from "@phosphor-icons/react/ssr";
import type { Exam } from "@/infrastructure/database/schema";
import { examSchema } from "../schemas/exam-schema";
import { saveExamAction, toggleExamAction } from "./actions";
import { StatusBadge } from "@/shared/ui/status-badge";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";

const defaults = { id: undefined as string | undefined, name: "", code: "", description: "", totalMarks: 100, targetScore: 70, durationMinutes: 90, isActive: true };

export function ExamManager({ items, filters }: { items: Exam[]; filters?: React.ReactNode }) {
  const [opened, modal] = useDisclosure(false); const [pending, startTransition] = useTransition(); const [confirm, setConfirm] = useState<Exam | null>(null);
  const form = useForm({ initialValues: defaults, validate: zod4Resolver(examSchema) });
  const openCreate = () => { form.setValues(defaults); form.resetDirty(); modal.open(); };
  const openEdit = (item: Exam) => { form.setValues({ id: item.id, name: item.name, code: item.code, description: item.description, totalMarks: item.totalMarks, targetScore: item.targetScore, durationMinutes: item.durationMinutes, isActive: item.isActive }); form.resetDirty(); modal.open(); };
  const submit = form.onSubmit((values) => startTransition(async () => { const result = await saveExamAction(values); if (result.ok) { notifications.show({ color: "green", message: result.message }); modal.close(); } else { notifications.show({ color: "red", message: result.message }); if (result.fieldErrors) Object.entries(result.fieldErrors).forEach(([field, messages]) => form.setFieldError(field, messages?.[0])); } }));
  const toggle = () => confirm && startTransition(async () => { const result = await toggleExamAction(confirm.id, !confirm.isActive); notifications.show({ color: result.ok ? "green" : "red", message: result.ok ? result.message : result.message }); if (result.ok) setConfirm(null); });
  return <><PageHeader title="Exams" actions={<Button leftSection={<IconPlus size={16} />} onClick={openCreate}>New exam</Button>} />{filters && <div className="page-filters">{filters}</div>}{items.length === 0 ? <EmptyState title="No exams found" description="Create the first exam to start organizing subjects and questions." /> : <div className="data-table-wrap"><Table highlightOnHover verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th>Exam</Table.Th><Table.Th>Marks</Table.Th><Table.Th>Target</Table.Th><Table.Th>Duration</Table.Th><Table.Th>Status</Table.Th><Table.Th w={48}><span className="sr-only">Actions</span></Table.Th></Table.Tr></Table.Thead><Table.Tbody>{items.map((item) => <Table.Tr key={item.id}><Table.Td><Text fw={600}>{item.name}</Text><Text fz="xs" c="dimmed">{item.code}</Text></Table.Td><Table.Td>{item.totalMarks}</Table.Td><Table.Td>{item.targetScore}</Table.Td><Table.Td>{item.durationMinutes} min</Table.Td><Table.Td><StatusBadge active={item.isActive} /></Table.Td><Table.Td><Menu position="bottom-end"><Menu.Target><ActionIcon variant="subtle" aria-label={`Actions for ${item.name}`}><IconDots size={18} /></ActionIcon></Menu.Target><Menu.Dropdown><Menu.Item leftSection={<IconEdit size={16} />} onClick={() => openEdit(item)}>Edit</Menu.Item><Menu.Item leftSection={<IconPower size={16} />} color={item.isActive ? "orange" : "green"} onClick={() => setConfirm(item)}>{item.isActive ? "Deactivate" : "Activate"}</Menu.Item></Menu.Dropdown></Menu></Table.Td></Table.Tr>)}</Table.Tbody></Table></div>}
  <Modal opened={opened} onClose={modal.close} title={form.values.id ? "Edit exam" : "Create exam"} closeOnClickOutside={!form.isDirty()} size="lg"><form onSubmit={submit} noValidate><Stack><Group grow align="flex-start"><TextInput label="Name" required {...form.getInputProps("name")} /><TextInput label="Code" required {...form.getInputProps("code")} /></Group><Textarea label="Description" minRows={3} {...form.getInputProps("description")} /><Group grow align="flex-start"><NumberInput label="Total marks" min={1} required {...form.getInputProps("totalMarks")} /><NumberInput label="Target score" min={0} required {...form.getInputProps("targetScore")} /><NumberInput label="Duration (minutes)" min={1} required {...form.getInputProps("durationMinutes")} /></Group><Switch label="Active" {...form.getInputProps("isActive", { type: "checkbox" })} /><Group justify="flex-end"><Button variant="default" onClick={modal.close}>Cancel</Button><Button type="submit" loading={pending}>Save exam</Button></Group></Stack></form></Modal>
  <ConfirmDialog opened={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={toggle} title={confirm?.isActive ? "Deactivate exam?" : "Activate exam?"} message={confirm?.isActive ? "Learners will no longer be able to start sessions for this exam." : "This exam will become available to learners."} confirmLabel={confirm?.isActive ? "Deactivate" : "Activate"} color={confirm?.isActive ? "orange" : "green"} loading={pending} /></>;
}
