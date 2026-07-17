"use client";

import { Center } from "@mantine/core";
import { ErrorState } from "@/shared/ui/error-state";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <Center mih="70vh" p="md"><ErrorState message="An unexpected error occurred." retry={reset} /></Center>; }
