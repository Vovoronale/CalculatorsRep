import type { Metadata } from "next";

import { LegalPageView } from "@/components/legal-page-view";
import { getLegalPage } from "@/lib/legal-pages";

const page = getLegalPage("terms");

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
};

export default function TermsPage() {
  return <LegalPageView page={page} />;
}
