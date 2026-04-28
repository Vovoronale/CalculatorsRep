import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type Breadcrumb = {
  label: string;
  href?: string;
};

type WorkspaceTopBarProps = {
  breadcrumbs: Breadcrumb[];
  actions?: ReactNode;
};

export function WorkspaceTopBar({ breadcrumbs, actions }: WorkspaceTopBarProps) {
  return (
    <div className="workspace-top-bar">
      <nav className="workspace-breadcrumbs" aria-label="Шлях навігації">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} className="workspace-breadcrumbs__item">
              {index > 0 ? (
                <ChevronRight
                  size={12}
                  aria-hidden
                  className="workspace-breadcrumbs__separator"
                />
              ) : null}
              {!isLast && crumb.href ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <span className="workspace-breadcrumbs__current">{crumb.label}</span>
              )}
            </span>
          );
        })}
      </nav>
      {actions ? <div className="workspace-top-bar__actions">{actions}</div> : null}
    </div>
  );
}
