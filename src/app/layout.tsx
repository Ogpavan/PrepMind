import type { Metadata, Viewport } from "next";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import "./globals.css";
import { ColorSchemeScript } from "@mantine/core";
import { AppProviders } from "@/shared/ui/app-providers";
import { ButtonHaptics } from "@/shared/ui/button-haptics";
import { ConnectivityStatus } from "@/shared/pwa/connectivity-status";
import { RegisterServiceWorker } from "@/shared/pwa/register-service-worker";
import { NavigationProgress } from "@/shared/ui/navigation-progress";

export const metadata: Metadata = {
  title: { default: "PrepMind", template: "%s · PrepMind" },
  description: "A focused personal exam preparation workspace.",
  applicationName: "PrepMind",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PrepMind",
  },
  icons: {
    icon: [
      { url: "/icons/prepmind.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#206bc4",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><ColorSchemeScript defaultColorScheme="light" /></head>
      <body>
        <AppProviders>
          <NavigationProgress />
          <ButtonHaptics />
          <ConnectivityStatus />
          {children}
        </AppProviders>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
