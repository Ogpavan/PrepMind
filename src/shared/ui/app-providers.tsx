"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

const theme = createTheme({
  primaryColor: "blue",
  defaultRadius: 4,
  colors: {
    blue: ["#e9f2fc", "#d8e8f8", "#b1d1f1", "#8abbe9", "#63a4e2", "#3c8dda", "#206bc4", "#1a56a0", "#14417b", "#0e2d57"],
  },
  fontFamily: "Inter Variable, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  headings: { fontFamily: "Inter Variable, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif", fontWeight: "600" },
  components: {
    Button: { defaultProps: { size: "sm", radius: 4 } },
    Badge: { defaultProps: { radius: 4 } },
    TextInput: { defaultProps: { size: "sm" } },
    Select: { defaultProps: { size: "sm" } },
    NumberInput: { defaultProps: { size: "sm" } },
    Textarea: { defaultProps: { size: "sm" } },
    Paper: { defaultProps: { radius: 4 } },
    Menu: { defaultProps: { radius: 4 } },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <MantineProvider theme={theme} defaultColorScheme="light"><Notifications position="top-right" />{children}</MantineProvider>;
}
