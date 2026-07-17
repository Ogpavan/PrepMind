"use client";

import { useState, useTransition } from "react";
import { Alert, Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { IconAlertCircle, IconAt, IconLock } from "@tabler/icons-react";
import { loginAction } from "./actions";
import { loginSchema } from "../schemas/login-schema";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [pending, startTransition] = useTransition(); const [error, setError] = useState<string | null>(null);
  const form = useForm({ initialValues: { email: "", password: "", callbackUrl }, validate: zod4Resolver(loginSchema) });
  const submit = form.onSubmit((values) => startTransition(async () => { setError(null); const result = await loginAction(values); if (!result.ok) { setError(result.message); if (result.fieldErrors) Object.entries(result.fieldErrors).forEach(([field, messages]) => form.setFieldError(field, messages?.[0])); } }));
  return <form onSubmit={submit} noValidate><Stack>{error && <Alert color="red" icon={<IconAlertCircle size={18} />}>{error}</Alert>}<TextInput label="Email" placeholder="you@example.com" autoComplete="email" required leftSection={<IconAt size={16} />} {...form.getInputProps("email")} /><PasswordInput label="Password" placeholder="Your password" autoComplete="current-password" required leftSection={<IconLock size={16} />} {...form.getInputProps("password")} /><Button type="submit" data-haptic="medium" fullWidth loading={pending}>Sign in</Button></Stack></form>;
}
