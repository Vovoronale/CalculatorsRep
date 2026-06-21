import { ExternalLink } from "lucide-react";

import {
  DBN_SOURCE_LINKS,
  type DbnSourceKey,
} from "@/lib/dbn-source-links";

export function DbnSourceLink({ document }: { document: DbnSourceKey }) {
  const source = DBN_SOURCE_LINKS[document];

  return (
    <a
      className="dbn-source-link"
      href={source.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{source.label}</span>
      <ExternalLink size={14} aria-hidden />
    </a>
  );
}
