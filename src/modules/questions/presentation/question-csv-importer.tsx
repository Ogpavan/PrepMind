"use client";

import { useState, useTransition } from "react";
import { Alert, Button, FileInput, Group, List, Modal, Paper, ScrollArea, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconDownload, IconFileImport, IconFileSpreadsheet, IconUpload } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { QuestionImportSummary } from "../infrastructure/question-import-repository";
import { importQuestionsFileAction } from "./actions";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export function QuestionCsvImporter() {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [summary, setSummary] = useState<QuestionImportSummary | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    if (pending) return;
    setOpened(false);
    setFile(null);
    setErrors(null);
    setSummary(null);
  };

  const importFile = () => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setErrors({ File: ["CSV file cannot exceed 4 MB"] });
      return;
    }

    setErrors(null);
    setSummary(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await importQuestionsFileAction(formData);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? { Import: [result.message] });
        notifications.show({ color: "red", message: result.message });
        return;
      }

      setSummary(result.data);
      notifications.show({ color: "green", message: result.message });
      router.refresh();
    });
  };

  return (
    <>
      <Button variant="light" leftSection={<IconFileImport size={16} />} onClick={() => setOpened(true)}>Import sheet</Button>
      <Modal opened={opened} onClose={close} closeOnClickOutside={!pending} closeOnEscape={!pending} title="Import questions from CSV or Excel" size="xl">
        <Stack gap="md">
          <Alert color="blue" icon={<IconFileSpreadsheet size={19} />} title="One row creates one complete question">
            Existing exam and subject records are matched by code. Missing exams, subjects, topics, and subtopics are created automatically. The import is atomic: if any row fails, nothing is saved.
          </Alert>

          <Group justify="space-between" align="flex-start" wrap="wrap">
            <div>
              <Text fw={600}>1. Download and complete the template</Text>
              <Text size="sm" c="dimmed">Replace the sample rows, keep the column names unchanged, and save as CSV or Excel (.xlsx).</Text>
            </div>
            <Button component="a" href="/question-import-template.csv" download variant="default" leftSection={<IconDownload size={16} />}>Download template</Button>
          </Group>

          <div>
            <Text fw={600} mb={6}>2. Upload the completed question sheet</Text>
            <FileInput
              value={file}
              onChange={(nextFile) => { setFile(nextFile); setErrors(null); setSummary(null); }}
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              clearable
              leftSection={<IconUpload size={16} />}
              placeholder="Choose a CSV or Excel file"
              aria-label="Question CSV or Excel file"
            />
            <Text size="xs" c="dimmed" mt={5}>Maximum 4 MB or 2,000 question rows per import.</Text>
          </div>

          {errors && (
            <Alert color="red" icon={<IconAlertCircle size={18} />} title={`${Object.keys(errors).length} import issue${Object.keys(errors).length === 1 ? "" : "s"}`}>
              <ScrollArea.Autosize mah={240} type="auto">
                <Stack gap="xs">
                  {Object.entries(errors).map(([location, messages]) => (
                    <div key={location}>
                      <Text size="sm" fw={700}>{location}</Text>
                      <List size="sm" spacing={2}>{messages.map((message) => <List.Item key={message}>{message}</List.Item>)}</List>
                    </div>
                  ))}
                </Stack>
              </ScrollArea.Autosize>
            </Alert>
          )}

          {summary && (
            <Paper withBorder p="md">
              <Group gap="sm" mb="md"><ThemeIcon color="green" variant="light"><IconCheck size={18} /></ThemeIcon><Text fw={700}>Import completed</Text></Group>
              <SimpleGrid cols={{ base: 2, sm: 5 }}>
                {[
                  ["Questions", summary.questionsImported],
                  ["Exams created", summary.examsCreated],
                  ["Subjects created", summary.subjectsCreated],
                  ["Topics created", summary.topicsCreated],
                  ["Subtopics created", summary.subtopicsCreated],
                ].map(([label, value]) => <div key={String(label)}><Text fz={22} fw={700}>{value}</Text><Text size="xs" c="dimmed">{label}</Text></div>)}
              </SimpleGrid>
            </Paper>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={close} disabled={pending}>{summary ? "Close" : "Cancel"}</Button>
            {!summary && <Button onClick={importFile} loading={pending} disabled={!file} leftSection={<IconFileImport size={16} />}>Import questions</Button>}
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
