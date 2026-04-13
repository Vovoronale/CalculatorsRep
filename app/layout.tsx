import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

import { siteContent } from "@/lib/site-content";

import "./globals.css";

const uiFont = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-ui",
  weight: ["400", "500", "600"],
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: `${siteContent.brand.productName} | ${siteContent.brand.authorName}`,
  description: siteContent.brand.role,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${uiFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  );
}
