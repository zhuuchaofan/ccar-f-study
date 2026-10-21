import './globals.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import NavUser from '@/components/NavUser';
import NavLinks from '@/components/NavLinks';

export const metadata: Metadata = { title: 'CCAR-F 学习平台', description: 'Claude Certified Architect – Foundations 中日英三语学习（私人学习用途）' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };
const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <header className="border-b" style={{ borderColor: 'var(--line)' }}>
          <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 text-sm" aria-label="主导航">
            <Link href="/" className="order-1 py-2 font-bold" style={{ color: 'var(--accent)' }}>CCAR-F</Link>
            <span className="order-2 ml-auto sm:order-3"><NavUser /></span>
            {/* phones: brand and account controls on the first row, section links on their own row below */}
            <div className="order-3 flex w-full gap-5 sm:order-2 sm:w-auto [&>a]:py-2">
              <NavLinks />
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 pb-10 text-xs muted">私人学习用途。题库来自第三方，未经审核，不代表官方考试内容；练习正确率不是官方 720 分制成绩。</footer>
      </body>
    </html>
  );
}
