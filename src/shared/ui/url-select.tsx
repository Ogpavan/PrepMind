"use client";

import { Select } from "@mantine/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startNavigationProgress } from "@/shared/ui/navigation-progress";

export function UrlSelect({ name, data, placeholder, clearable = true, width = 220 }: { name: string; data: Array<{ value: string; label: string }>; placeholder: string; clearable?: boolean; width?: number }) { const router = useRouter(); const pathname = usePathname(); const params = useSearchParams(); return <Select value={params.get(name)} data={data} placeholder={placeholder} clearable={clearable} w={{ base: "100%", sm: width }} onChange={(value) => { const next = new URLSearchParams(params); if (value) next.set(name, value); else next.delete(name); next.set("page", "1"); startNavigationProgress(); router.replace(`${pathname}?${next.toString()}`); }} />; }
