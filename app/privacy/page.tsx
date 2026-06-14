import type { Metadata } from "next";

import { LegalPageView } from "@/components/legal-page-view";
import { getLegalPage } from "@/lib/legal-pages";

const page = getLegalPage("privacy");

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
};

export default function PrivacyPage() {
  return <LegalPageView page={page} />;
}
