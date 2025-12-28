import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { SkipToContent } from "@/components/accessibility/SkipToContent";
import { ScrollToTop } from "@/components/scroll/ScrollToTop";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { PopupManager } from "@/components/monetization/PopupManager";
import { TopBanner } from "@/components/monetization/TopBanner";
import { defaultMetadata } from "./metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  ...defaultMetadata,
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <SkipToContent />
          <ErrorBoundary>
            <AnalyticsProvider>
              <TopBanner />
              {children}
              <Toaster />
              <OfflineIndicator />
              <ScrollToTop />
              <PopupManager />
            </AnalyticsProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
