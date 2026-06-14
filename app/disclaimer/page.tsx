import type { Metadata } from "next";

import { LegalPageView } from "@/components/legal-page-view";
import { getLegalPage } from "@/lib/legal-pages";

const page = getLegalPage("disclaimer");

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
};

export default function DisclaimerPage() {
  return <LegalPageView page={page} />;
}
