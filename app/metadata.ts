import type { Metadata } from "next";

export const defaultMetadata: Metadata = {
  title: "Rupantar AI - Transform Your Photos with AI",
  description:
    "AI-powered photo transformation and generation platform. Create stunning images with 1000+ templates, advanced AI tools, and premium quality outputs.",
  keywords: [
    "AI image generation",
    "photo transformation",
    "AI templates",
    "image editing",
    "photo enhancement",
    "AI art",
  ],
  authors: [{ name: "Rupantar AI" }],
  creator: "Rupantar AI",
  publisher: "Rupantar AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Rupantar AI - Transform Your Photos",
    description: "AI-powered photo transformation and generation platform",
    siteName: "Rupantar AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rupantar AI",
    description: "Transform your photos with AI magic",
    creator: "@rupantarai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

