import type { Metadata } from "next";
import "@fontsource-variable/inter/standard.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import "./globals.css";
import { ColorSchemeScript } from "@mantine/core";
import { AppProviders } from "@/shared/ui/app-providers";

export const metadata: Metadata = {
  title: { default: "PrepMind", template: "%s · PrepMind" },
  description: "A focused personal exam preparation workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><ColorSchemeScript defaultColorScheme="light" /></head><body><AppProviders>{children}</AppProviders></body></html>;
}
