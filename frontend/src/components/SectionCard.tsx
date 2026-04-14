import type { ReactNode } from "react";

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="section-card">
      <div className="section-header">
        <h3>{title}</h3>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}
