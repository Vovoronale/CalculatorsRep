import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";

import { IVappsTopbar } from "@/components/ivapps-topbar";
import { siteContent } from "@/lib/site-content";

import "katex/dist/katex.min.css";
import "./globals.css";

const sansFont = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ivapps.pro"),
  title: `${siteContent.brand.productName} | ${siteContent.brand.authorName}`,
  description: siteContent.brand.role,
  icons: {
    icon: [{ url: "/brand/ivapps-icon.png", type: "image/png" }],
    apple: [{ url: "/brand/ivapps-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: `${siteContent.brand.productName} | ${siteContent.brand.authorName}`,
    description: siteContent.brand.role,
    images: [{ url: "/brand/ivapps-emblem.png", width: 900, height: 739 }],
  },
};

const themeBootstrap = `(function(){try{var s=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s||(p?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`;
const googleAnalyticsId = "G-LFC4DCDX7V";
const googleAnalyticsBootstrap = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${googleAnalyticsId}');
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body
        className={`${sansFont.variable} ${displayFont.variable} ${monoFont.variable}`}
      >
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {googleAnalyticsBootstrap}
        </Script>
        <IVappsTopbar />
        {children}
      </body>
    </html>
  );
}
