"use client";

import { Pagination } from "@mantine/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startNavigationProgress } from "@/shared/ui/navigation-progress";

export function ListPagination({ page, total }: { page: number; total: number }) { const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams(); if (total <= 1) return null; return <Pagination value={page} total={total} onChange={(next) => { const params = new URLSearchParams(searchParams); params.set("page", String(next)); startNavigationProgress(); router.push(`${pathname}?${params.toString()}`); }} />; }
