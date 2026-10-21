'use client';
import { useEffect, useState } from 'react';

export type Lang = 'en' | 'zh' | 'ja';
const LANGS = [['zh', '中文'], ['ja', '日本語'], ['en', 'English']] as const;
const KEY = 'quiz-lang';

/** Display language for questions, shared by practice and mock exam (remembered per browser). */
export function useLang() {
  const [lang, setL] = useState<Lang>('zh');
  useEffect(() => { try { const l = localStorage.getItem(KEY); if (l === 'en' || l === 'zh' || l === 'ja') setL(l); } catch {} }, []);
  return [lang, (l: Lang) => { setL(l); try { localStorage.setItem(KEY, l); } catch {} }] as const;
}
export function LangTabs({ lang, setLang, className = '' }: { lang: Lang; setLang: (l: Lang) => void; className?: string }) {
  return <div role="tablist" aria-label="语言" className={`seg ${className}`}>{LANGS.map(([k, n]) => <button key={k} role="tab" aria-selected={lang === k} onClick={() => setLang(k)}>{n}</button>)}</div>;
}
