import { Fragment, type ReactNode } from 'react';

/** Minimal Markdown renderer for lesson files: ##/### headings, paragraphs, - and 1. lists, ``` code, > tips, **bold**, `code`, [text](https://…). */
function inline(s: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('**')) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith('`')) out.push(<code key={k++} className="code-inline">{t.slice(1, -1)}</code>);
    else { const i = t.indexOf(']('); out.push(<a key={k++} className="underline" href={t.slice(i + 2, -1)} target="_blank" rel="noreferrer">{t.slice(1, i)}</a>); }
    last = m.index + t.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export default function Markdown({ src }: { src: string }) {
  const lines = src.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0, k = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith('```')) {
      const lang = l.slice(3).trim(); const body: string[] = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i++; blocks.push(<pre key={k++} className="code-block" data-lang={lang || undefined}><code>{body.join('\n')}</code></pre>); continue;
    }
    if (l.startsWith('### ')) { blocks.push(<h3 key={k++} className="mt-5 font-bold">{inline(l.slice(4))}</h3>); i++; continue; }
    if (l.startsWith('## ')) { blocks.push(<h2 key={k++} className="mt-8 border-b pb-1 text-lg font-bold" style={{ borderColor: 'var(--line)' }}>{inline(l.slice(3))}</h2>); i++; continue; }
    if (l.startsWith('# ')) { blocks.push(<h2 key={k++} className="mt-8 text-lg font-bold">{inline(l.slice(2))}</h2>); i++; continue; }
    if (l.startsWith('> ')) {
      const body: string[] = []; while (i < lines.length && lines[i].startsWith('>')) body.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(<blockquote key={k++} className="tip">{inline(body.join(' '))}</blockquote>); continue;
    }
    if (/^\s*[-*] /.test(l)) {
      const items: string[] = []; while (i < lines.length && /^\s*[-*] /.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*] /, ''));
      blocks.push(<ul key={k++} className="list-disc space-y-1 pl-5">{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>); continue;
    }
    if (/^\s*\d+[.)] /.test(l)) {
      const items: string[] = []; while (i < lines.length && /^\s*\d+[.)] /.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)] /, ''));
      blocks.push(<ol key={k++} className="list-decimal space-y-1 pl-5">{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>); continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,3} |> |\s*[-*] |\s*\d+[.)] )/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={k++}>{inline(para.join(' '))}</p>);
  }
  return <div className="lesson space-y-3 leading-relaxed">{blocks.map((b, j) => <Fragment key={j}>{b}</Fragment>)}</div>;
}
