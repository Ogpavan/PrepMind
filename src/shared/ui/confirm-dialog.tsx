"use client";

import { Button, Group, Modal, Text } from "@mantine/core";

export function ConfirmDialog({ opened, onClose, onConfirm, title, message, confirmLabel = "Confirm", loading, color = "red" }: { opened: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; loading?: boolean; color?: string }) {
  return <Modal opened={opened} onClose={onClose} title={title} centered><Text>{message}</Text><Group justify="flex-end" mt="lg"><Button variant="default" onClick={onClose} disabled={loading}>Cancel</Button><Button color={color} onClick={onConfirm} loading={loading}>{confirmLabel}</Button></Group></Modal>;
}
