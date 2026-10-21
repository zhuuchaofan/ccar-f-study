'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [['/practice', '练习'], ['/syllabus', '课程'], ['/exam', '模考'], ['/questions', '题库'], ['/stats', '统计']] as const;
export default function NavLinks() {
  const path = usePathname();
  return <>{LINKS.map(([href, name]) => {
    const on = path === href || path.startsWith(href + '/');
    return <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={on ? 'font-bold underline decoration-2 underline-offset-8' : 'muted'} style={on ? { textDecorationColor: 'var(--accent)' } : undefined}>{name}</Link>;
  })}</>;
}
