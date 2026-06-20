import Link from "next/link";

import { siteContent } from "@/lib/site-content";

export function SupportStrip() {
  return (
    <Link className="support-strip" href="/support">
      {siteContent.support.stripLabel}
    </Link>
  );
}
