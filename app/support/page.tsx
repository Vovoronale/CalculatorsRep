import type { Metadata } from "next";

import { SupportView } from "@/components/support-view";
import { siteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: `${siteContent.support.eyebrow} | IVApps.pro`,
  description: siteContent.support.paragraphs[0],
};

export default function SupportPage() {
  return <SupportView />;
}
