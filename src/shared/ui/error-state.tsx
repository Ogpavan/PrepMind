"use client";

import { Alert, Button } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) { return <Alert icon={<IconAlertTriangle size={18} />} color="red" title="Unable to load this page">{message}{retry && <Button mt="md" variant="light" color="red" onClick={retry}>Try again</Button>}</Alert>; }
