"use client";

import { useTransition } from "react";
import { Button, NumberInput, Paper, Stack, Switch, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { notifications } from "@mantine/notifications";
import { applicationSettingsSchema, type ApplicationSettings } from "../schemas/settings-schema";
import { saveApplicationSettingsAction } from "./actions";

export function AdminSettingsForm({ settings, canEdit }: { settings: ApplicationSettings; canEdit: boolean }) { const [pending, startTransition] = useTransition(); const form = useForm({ initialValues: settings, validate: zod4Resolver(applicationSettingsSchema) }); const submit = form.onSubmit((values) => startTransition(async () => { const result = await saveApplicationSettingsAction(values); notifications.show({ color: result.ok ? "green" : "red", message: result.message }); if (result.ok) form.resetDirty(); })); return <Paper className="tabler-card" p="lg" maw={700}><form onSubmit={submit}><Stack><Title order={3} fz="md">Application defaults</Title><TextInput label="Application name" disabled={!canEdit} {...form.getInputProps("applicationName")} /><NumberInput label="Default study question count" min={1} max={100} disabled={!canEdit} {...form.getInputProps("defaultQuestionCount")} /><Switch label="Allow timed study sessions" disabled={!canEdit} {...form.getInputProps("allowTimedSessions", { type: "checkbox" })} />{canEdit && <Button type="submit" loading={pending} w="fit-content">Save settings</Button>}</Stack></form></Paper>; }
