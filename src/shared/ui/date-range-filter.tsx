"use client";

import { Group, TextInput } from "@mantine/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startNavigationProgress } from "@/shared/ui/navigation-progress";

export function DateRangeFilter() { const router = useRouter(); const pathname = usePathname(); const params = useSearchParams(); const change = (name: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(name, value); else next.delete(name); startNavigationProgress(); router.replace(`${pathname}?${next.toString()}`); }; return <Group gap="xs" wrap="nowrap"><TextInput type="date" label="From" defaultValue={params.get("from") ?? ""} onBlur={(event) => change("from", event.currentTarget.value)} /><TextInput type="date" label="To" defaultValue={params.get("to") ?? ""} onBlur={(event) => change("to", event.currentTarget.value)} /></Group>; }
