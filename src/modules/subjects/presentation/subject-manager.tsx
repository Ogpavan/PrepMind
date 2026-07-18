"use client";

import { useState, useTransition } from "react";
import { ActionIcon, Button, Group, Menu, Modal, NumberInput, Select, Stack, Switch, Table, Text, TextInput, Textarea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { notifications } from "@mantine/notifications";
import { DotsThree as IconDots, PencilSimple as IconEdit, Plus as IconPlus, Power as IconPower } from "@phosphor-icons/react/ssr";
import type { Exam } from "@/infrastructure/database/schema";
import type { SubjectListItem } from "../infrastructure/subject-repository";
import { subjectSchema } from "../schemas/subject-schema";
import { saveSubjectAction, toggleSubjectAction } from "./actions";
import { StatusBadge } from "@/shared/ui/status-badge";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui/page-header";

export function SubjectManager({ items, exams, filters }: { items: SubjectListItem[]; exams: Exam[]; filters?: React.ReactNode }) {
  const initial = { id: undefined as string | undefined, examId: exams[0]?.id ?? "", name: "", code: "", description: "", displayOrder: 0, isActive: true };
  const [opened, modal] = useDisclosure(false); const [pending, startTransition] = useTransition(); const [confirm, setConfirm] = useState<SubjectListItem | null>(null); const form = useForm({ initialValues: initial, validate: zod4Resolver(subjectSchema) });
  const openCreate = () => { form.setValues(initial); form.resetDirty(); modal.open(); }; const openEdit = (item: SubjectListItem) => { form.setValues({ id: item.id, examId: item.examId, name: item.name, code: item.code, description: item.description, displayOrder: item.displayOrder, isActive: item.isActive }); form.resetDirty(); modal.open(); };
  const submit = form.onSubmit((values) => startTransition(async () => { const result = await saveSubjectAction(values); notifications.show({ color: result.ok ? "green" : "red", message: result.message }); if (result.ok) modal.close(); else if (result.fieldErrors) Object.entries(result.fieldErrors).forEach(([field, messages]) => form.setFieldError(field, messages?.[0])); }));
  const toggle = () => confirm && startTransition(async () => { const result = await toggleSubjectAction(confirm.id, !confirm.isActive); notifications.show({ color: result.ok ? "green" : "red", message: result.message }); if (result.ok) setConfirm(null); });
  return <><PageHeader title="Subjects" actions={<Button leftSection={<IconPlus size={16} />} onClick={openCreate} disabled={exams.length === 0}>New subject</Button>} />{filters && <div className="page-filters">{filters}</div>}{items.length === 0 ? <EmptyState title="No subjects found" description="Add subjects under an exam to organize topics and questions." /> : <div className="data-table-wrap"><Table highlightOnHover verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th>Subject</Table.Th><Table.Th>Exam</Table.Th><Table.Th>Order</Table.Th><Table.Th>Status</Table.Th><Table.Th w={48}>Actions</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{items.map((item) => <Table.Tr key={item.id}><Table.Td><Text fw={600}>{item.name}</Text><Text fz="xs" c="dimmed">{item.code}</Text></Table.Td><Table.Td>{item.examName}</Table.Td><Table.Td>{item.displayOrder}</Table.Td><Table.Td><StatusBadge active={item.isActive} /></Table.Td><Table.Td><Menu position="bottom-end"><Menu.Target><ActionIcon variant="subtle" aria-label={`Actions for ${item.name}`}><IconDots size={18} /></ActionIcon></Menu.Target><Menu.Dropdown><Menu.Item leftSection={<IconEdit size={16} />} onClick={() => openEdit(item)}>Edit</Menu.Item><Menu.Item leftSection={<IconPower size={16} />} color={item.isActive ? "orange" : "green"} onClick={() => setConfirm(item)}>{item.isActive ? "Deactivate" : "Activate"}</Menu.Item></Menu.Dropdown></Menu></Table.Td></Table.Tr>)}</Table.Tbody></Table></div>}
  <Modal opened={opened} onClose={modal.close} title={form.values.id ? "Edit subject" : "Create subject"} size="lg"><form onSubmit={submit} noValidate><Stack><Select label="Exam" required searchable data={exams.map((exam) => ({ value: exam.id, label: `${exam.name} (${exam.code})` }))} {...form.getInputProps("examId")} /><Group grow align="flex-start"><TextInput label="Name" required {...form.getInputProps("name")} /><TextInput label="Code" required {...form.getInputProps("code")} /></Group><Textarea label="Description" minRows={3} {...form.getInputProps("description")} /><NumberInput label="Display order" min={0} {...form.getInputProps("displayOrder")} /><Switch label="Active" {...form.getInputProps("isActive", { type: "checkbox" })} /><Group justify="flex-end"><Button variant="default" onClick={modal.close}>Cancel</Button><Button type="submit" loading={pending}>Save subject</Button></Group></Stack></form></Modal>
  <ConfirmDialog opened={Boolean(confirm)} onClose={() => setConfirm(null)} onConfirm={toggle} title={confirm?.isActive ? "Deactivate subject?" : "Activate subject?"} message={confirm?.isActive ? "This subject will not be available for new study sessions." : "This subject will become available to learners."} confirmLabel={confirm?.isActive ? "Deactivate" : "Activate"} color={confirm?.isActive ? "orange" : "green"} loading={pending} /></>;
}
