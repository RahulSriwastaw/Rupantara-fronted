import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { SkipToContent } from "@/components/accessibility/SkipToContent";
import { ScrollToTop } from "@/components/scroll/ScrollToTop";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { defaultMetadata } from "./metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  ...defaultMetadata,
  manifest: "/manifest.json",
  themeColor: "#3B82F6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SkipToContent />
          <ErrorBoundary>
            <AnalyticsProvider>
              {children}
              <Toaster />
              <OfflineIndicator />
              <ScrollToTop />
            </AnalyticsProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
