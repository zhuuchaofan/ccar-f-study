import json,re
pages=json.load(open('data/parsed/pages_clean.json'))
NOISE=re.compile(r'^(Anthropic - CCAR-F|=+|<?https?://www\.examsvce\.com\S*>?|Version: \S+|\[ ?Total Questions: 152 ?\]|Web: www\.examsvce\.com|Email: support@examsvce\.com)\s*$')
lines=[]  # (page,line)
for p in pages:
    for ln in p['text'].split('\n'):
        if NOISE.match(ln.strip()) : continue
        lines.append((p['page'],ln.rstrip()))
qs=[];cur=None
for pg,ln in lines:
    m=re.match(r'^Question #:(\d+) - \[(.+)\]\s*$',ln)
    if m:
        cur=dict(num=int(m.group(1)),category=m.group(2),pages=[pg],lines=[]);qs.append(cur);continue
    if cur is None: continue
    if cur['pages'][-1]!=pg: cur['pages'].append(pg)
    cur['lines'].append(ln)
def fix(t):
    # PDF line-wrap artifacts: "project’ s" -> "project’s"; "force- unwrapping" -> "force-unwrapping" (keep suspended hyphens before and/or)
    t=re.sub(r"([A-Za-z])’ (s|t|re|ll|d|ve)\b",r"\1’\2",t)
    t=re.sub(r"([A-Za-z0-9])- (?!and\b|or\b)([a-z])",r"\1-\2",t)
    return t
out=[]
for q in qs:
    L=q['lines']
    ai=next(i for i,l in enumerate(L) if re.match(r'^Answer:',l))
    pre=L[:ai]; post=L[ai:]
    ans=re.sub(r'[ ,]+',',',re.match(r'^Answer:\s*(.*)$',post[0]).group(1).strip())
    ei=next((i for i,l in enumerate(post) if l.strip()=='Explanation'),None)
    expl=' '.join(x.strip() for x in post[ei+1:]) if ei is not None else ' '.join(x.strip() for x in post[1:])
    # options
    oi=[i for i,l in enumerate(pre) if re.match(r'^[A-F]\. ',l)]
    # options must be consecutive letters starting at A, take the last A-run
    starts=[i for i in oi if pre[i].startswith('A. ')]
    s=starts[-1]
    stem=' '.join(x.strip() for x in pre[:s])
    opts=[];letter=None
    for l in pre[s:]:
        m=re.match(r'^([A-F])\. (.*)$',l)
        if m and (not opts or ord(m.group(1))==ord(opts[-1][0])+1):
            opts.append([m.group(1),m.group(2).strip()])
        else: opts[-1][1]+=' '+l.strip()
    out.append(dict(num=q['num'],category=q['category'],pdf_pages=[q['pages'][0],q['pages'][-1]],stem=re.sub(r'\s+',' ',stem).strip(),
        options=[dict(label=a,text=re.sub(r'\s+',' ',b)) for a,b in opts],answer=ans.split(','),explanation_en=re.sub(r'\s+',' ',expl).strip()))
for q in out:
    q['stem']=fix(q['stem']); q['explanation_en']=fix(q['explanation_en'])
    for o in q['options']: o['text']=fix(o['text'])
    q.update(source_type='third_party_bank',source_name='examsvce CCAR-F v3.1',review_status='extracted_unreviewed',translations=dict(zh=None,ja=None),task_statement=None)
json.dump(out,open('data/parsed/questions_en.json','w'),ensure_ascii=False,indent=1)
from collections import Counter
print(len(out),Counter(len(q['options']) for q in out),Counter(len(q['answer']) for q in out))
print(Counter(q['category'] for q in out))
bad=[q['num'] for q in out if not set(q['answer'])<={o['label'] for o in q['options']}]; print('answer not in options',bad)
print('multi',[(q['num'],q['answer']) for q in out if len(q['answer'])>1])
print('short',[q['num'] for q in out if len(q['stem'])<150 or len(q['explanation_en'])<200])
print(sorted(Counter(q['answer'][0] for q in out).items()))
