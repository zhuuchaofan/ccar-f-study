import re,json
L=open('data/raw/exam_guide_ja.txt').read().split('\n')[132:742]
doms=[];cur=None;ts=None;mode=None;buf=None
def flush():
    global buf
    if buf and ts is not None and mode: ts[mode][-1]=buf.strip()
for ln in L:
    s=ln.strip()
    if not s or re.match(r'^(Claude Certification Program|試験ガイド|\d+)$',s): continue
    m=re.match(r'^分野(\d)：(.+)$',s)
    if m: doms.append(dict(id=int(m.group(1)),title_ja=m.group(2).strip(),task_statements=[]));ts=None;mode=None;continue
    m=re.match(r'^タスクステートメント(\d)\.(\d)：(.*)$',s)
    if m:
        ts=dict(id=f'{m.group(1)}.{m.group(2)}',title_ja=m.group(3).strip(),knowledge=[],skills=[]);doms[-1]['task_statements'].append(ts);mode='title';continue
    if s.startswith('以下に関する知識'): mode='knowledge';continue
    if s.startswith('以下を実行できること'): mode='skills';continue
    if ts is None: continue
    if mode=='title': ts['title_ja']+=s;continue
    if s.startswith('•'): ts[mode].append(s[1:].strip())
    elif ts[mode]: ts[mode][-1]+=s
for d in doms:
    for t in d['task_statements']:
        t['title_ja']=re.sub(r'\s+','',t['title_ja'])
json.dump(doms,open('data/parsed/syllabus_ja.json','w'),ensure_ascii=False,indent=1)
print([(d['id'],d['title_ja'],len(d['task_statements'])) for d in doms])
print(sum(len(t['knowledge']) for d in doms for t in d['task_statements']),sum(len(t['skills']) for d in doms for t in d['task_statements']))
for d in doms[4:]:
  for t in d['task_statements'][-1:]: print(t['id'],t['title_ja'],t['knowledge'][-1][:60],t['skills'][-1][-60:])
