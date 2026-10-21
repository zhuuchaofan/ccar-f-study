import Link from 'next/link';

/** Anonymous visitors: one pattern everywhere, and they come back to the page they wanted. */
export function loginHref(next: string) { return `/login?next=${encodeURIComponent(next)}`; }
export function Notice({ children }: { children: React.ReactNode }) {
  return <p className="card p-3 text-sm" style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}>{children}</p>;
}
export function Empty({ title, children, href, cta }: { title: string; children?: React.ReactNode; href?: string; cta?: string }) {
  return (
    <div className="card p-6 text-center">
      <p className="font-bold">{title}</p>
      {children && <p className="muted mt-1 text-sm">{children}</p>}
      {href && cta && <Link className="btn btn-primary mt-4" href={href}>{cta}</Link>}
    </div>
  );
}
export function Loading() {
  return <div className="space-y-3" role="status" aria-label="加载中"><div className="card h-24 animate-pulse" /><div className="card h-16 animate-pulse" /><div className="card h-16 animate-pulse" /></div>;
}
