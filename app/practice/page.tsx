import Link from 'next/link';
import { DOMAIN_ZH } from '@/components/meta';
const modes = [
  { href: '/practice/run?mode=seq', t: '顺序刷题', s: '按题号 1 → 152' },
  { href: '/practice/run?mode=random', t: '随机刷题', s: '打乱顺序' },
  { href: '/practice/run?mode=unanswered', t: '没做过的题', s: '只做新题' },
  { href: '/practice/run?mode=due', t: '到期复习', s: '间隔重复安排到今天的题' },
  { href: '/practice/run?mode=mistakes', t: '错题重做', s: '最近一次答错的题' },
  { href: '/practice/run?mode=bookmarks', t: '收藏题', s: '你标记的题' },
];
export default function Practice() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">练习</h1>
      <ul className="grid gap-3 sm:grid-cols-2">{modes.map((m) => <li key={m.href}><Link className="card block p-4" href={m.href}><b>{m.t}</b><span className="muted block text-sm">{m.s}</span></Link></li>)}</ul>
      <section><h2 className="mb-2 font-bold">按领域</h2>
        <ul className="grid gap-3 sm:grid-cols-2">{[1, 2, 3, 4, 5].map((d) => <li key={d}><Link className="card block p-4" href={`/practice/run?mode=seq&domain=${d}`}>领域 {d}：{DOMAIN_ZH[d]}</Link></li>)}</ul>
        <p className="muted mt-2 text-sm">按知识点（Task Statement）刷题需要先完成题目与知识点的映射，目前尚未提供。</p>
      </section>
    </div>
  );
}
