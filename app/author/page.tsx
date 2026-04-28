import type { Metadata } from "next";

import { AuthorView } from "@/components/author-view";
import { siteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: `Про автора | ${siteContent.brand.authorName}`,
  description: siteContent.brand.role,
};

export default function AuthorPage() {
  return <AuthorView />;
}
