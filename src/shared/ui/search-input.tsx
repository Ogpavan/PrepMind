"use client";

import { TextInput } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { MagnifyingGlass as IconSearch } from "@phosphor-icons/react/ssr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startNavigationProgress } from "@/shared/ui/navigation-progress";

export function SearchInput({ placeholder = "Search…" }: { placeholder?: string }) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const update = useDebouncedCallback((value: string) => { const params = new URLSearchParams(searchParams); if (value) params.set("q", value); else params.delete("q"); params.set("page", "1"); startNavigationProgress(); router.replace(`${pathname}?${params.toString()}`); }, 300);
  return <TextInput defaultValue={searchParams.get("q") ?? ""} onChange={(event) => update(event.currentTarget.value)} placeholder={placeholder} leftSection={<IconSearch size={16} />} w={{ base: "100%", sm: 280 }} aria-label={placeholder} />;
}
